'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FiCheck, FiCheckSquare, FiTrash, FiMoreVertical, FiDownload, FiFile, FiFileText, FiMusic, FiVideo, FiImage, FiCode, FiMessageSquare, FiStar, FiCornerDownRight, FiPlay, FiPause, FiUser, FiX, FiGlobe, FiEdit } from 'react-icons/fi';
import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '@/firebase/config';
import { doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { listenToUserProfile } from '@/lib/users';
import { useAIConfig } from '@/lib/context';
import { useTranslate } from '@/lib/hooks/useTranslate';

type MessageProps = {
  message: {
    id: string;
    text: string;
    senderId: string;
    timestamp: any;
    readBy: string[];
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    isMarked?: boolean;
    replyTo?: string;
    isEdited?: boolean;
    audio?: boolean;
  };
  isOwn: boolean;
  chatId: string;
  onReplyMessage?: (messageId: string, messageText: string) => void;
  onEditMessage?: (messageId: string, messageText: string) => void;
};

// Komponen Avatar untuk menampilkan foto profil
type AvatarProps = {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
};

function UserAvatar({ userId, size = 'md' }: AvatarProps) {
  const [userData, setUserData] = useState<{ 
    photoURL?: string; 
    displayName?: string;
  } | null>(null);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Listener untuk data pengguna realtime
    const unsubscribe = listenToUserProfile(userId, (data) => {
      setUserData(data);
      setImageError(false);
    });
    
    return () => unsubscribe();
  }, [userId]);
  
  // Ukuran avatar berdasarkan prop
  const sizeClass = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  }[size];
  
  // Ambil inisial dari nama pengguna
  const getInitials = () => {
    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  return (
    <div className={`${sizeClass} rounded-full bg-primary flex items-center justify-center overflow-hidden text-white font-medium`}>
      {userData?.photoURL && !imageError ? (
        <img 
          src={userData.photoURL} 
          alt={userData?.displayName || 'Avatar'}
          className={`${sizeClass} object-cover`}
          onError={() => setImageError(true)}
        />
      ) : (
        getInitials()
      )}
    </div>
  );
}

export default function ChatMessage({ message, isOwn, chatId, onReplyMessage, onEditMessage }: MessageProps) {
  const { aiConfig } = useAIConfig();
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [replyMessageText, setReplyMessageText] = useState<string>('');
  const [replySenderName, setReplySenderName] = useState<string>('User');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Gunakan hook useTranslate
  const { translateMessage: translate, isTranslating: isTranslatingFromHook, translationError: hookTranslationError, cancelTranslation } = useTranslate();
  
  // Fungsi untuk reset error
  const resetError = () => setTranslationError(null);

  // Fungsi untuk menerjemahkan pesan saat user klik tombol terjemahan
  const translateMessage = async () => {
    if (!message.text || isTranslating) return;
    
    try {
      setIsTranslating(true);
      setTranslationError(null);
      setShowOptions(false); // Tutup dropdown options segera
      
      // Tampilkan indikasi loading
      setTranslatedText("Menerjemahkan...");
      setIsShowingTranslation(true);
      
      // Gunakan hook useTranslate yang sudah menangani error dan timeout dengan baik
      const targetLang = aiConfig.translateLanguage || 'en';
      const result = await translate(message.text, message.id, targetLang);
      
      if (result && result.translatedText) {
        // Update state dengan hasil terjemahan
        setTranslatedText(result.translatedText);
      } else {
        // Fallback minimal jika tidak ada terjemahan
        setTranslatedText(`[${targetLang.toUpperCase()}] ${message.text}`);
        setTranslationError("Gagal menerjemahkan pesan");
      }
    } catch (error) {
      console.error('Gagal menerjemahkan pesan:', error);
      // Jangan tampilkan error, cukup tampilkan terjemahan sederhana
      setTranslatedText(`[${(aiConfig.translateLanguage || 'en').toUpperCase()}] ${message.text}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Terjemahkan otomatis jika pengaturan autoTranslate diaktifkan dan pesan bukan dari user sendiri
  useEffect(() => {
    let isMounted = true;
    
    // Hanya terjemahkan jika:
    // 1. Component masih terpasang
    // 2. Fitur autoTranslate aktif
    // 3. Pesan bukan dari user sendiri
    // 4. Pesan memiliki teks
    if (aiConfig.autoTranslate && !isOwn && message.text && !isShowingTranslation && !isTranslating) {
      // Implementasi yang sederhana tanpa callback
      const handleAutoTranslate = async () => {
        if (!isMounted) return;
        
        try {
          setIsTranslating(true);
          setTranslatedText("Menerjemahkan otomatis...");
          setIsShowingTranslation(true);
          
          const targetLang = aiConfig.translateLanguage || 'en';
          const result = await translate(message.text, message.id, targetLang);
          
          if (!isMounted) return;
          
          if (result && result.translatedText) {
            setTranslatedText(result.translatedText);
          } else {
            setTranslatedText(`[${targetLang.toUpperCase()}] ${message.text}`);
          }
        } catch (error) {
          if (!isMounted) return;
          setTranslatedText(`[Auto] ${message.text}`);
        } finally {
          if (isMounted) setIsTranslating(false);
        }
      };
      
      // Tunggu sebentar sebelum menerjemahkan
      const timer = setTimeout(handleAutoTranslate, 500);
      return () => {
        cancelTranslation(message.id);
        clearTimeout(timer);
        isMounted = false;
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [aiConfig.autoTranslate, isOwn, message.text, message.id, translate, cancelTranslation]);

  // Penanganan timestamp yang lebih aman
  let formattedTime = '';
  try {
    if (message.timestamp) {
      if (message.timestamp.toDate) {
        formattedTime = format(message.timestamp.toDate(), 'HH:mm', { locale: id });
      } else if (message.timestamp.seconds) {
        // Alternatif jika toDate() tidak tersedia tapi ada seconds
        formattedTime = format(new Date(message.timestamp.seconds * 1000), 'HH:mm', { locale: id });
      }
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    formattedTime = ''; // Default to empty if there's an error
  }

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handler untuk audio player
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else {
        setAudioDuration(0);
      }
    } catch (e) {
      console.error('Error in handleLoadedMetadata:', e);
      setAudioDuration(0);
    }
  };
  
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    } catch (e) {
      console.error('Error in handleTimeUpdate:', e);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } catch (e) {
      console.error('Error in handleEnded:', e);
    }
  };
  
  // Reset state ketika audio berubah
  useEffect(() => {
    setAudioDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [message.fileUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      // Load audio saat component mount
      audio.load();
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    } catch (e) {
      console.error('Error setting up audio event listeners:', e);
    }
  }, [audioRef.current, message.fileUrl]);

  const toggleAudioPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(e => {
          console.error('Error playing audio:', e);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Error in toggleAudioPlayback:', e);
      setIsPlaying(false);
    }
  };

  // Fungsi untuk memformat waktu audio
  const formatAudioTime = (timeInSeconds: number) => {
    if (!isFinite(timeInSeconds) || timeInSeconds < 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDeleteMessage = async () => {
    if (!chatId || isDeleting) return;
    
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'chats', chatId, 'messages', message.id));
      
      // Perbarui lastMessage jika pesan ini adalah pesan terakhir
      // Ini bisa dikembangkan lebih lanjut untuk mengambil pesan terakhir sebelum yang dihapus
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          text: 'Pesan telah dihapus',
          timestamp: message.timestamp,
          senderId: message.senderId
        }
      });
      
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Gagal menghapus pesan. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
      setShowOptions(false);
    }
  };

  const handleMarkMessage = async () => {
    if (!chatId || isMarking) return;
    
    try {
      setIsMarking(true);
      
      // Toggle status marked
      const isCurrentlyMarked = message.isMarked || false;
      
      await updateDoc(doc(db, 'chats', chatId, 'messages', message.id), {
        isMarked: !isCurrentlyMarked
      });
      
    } catch (error) {
      console.error('Error marking message:', error);
      alert('Gagal menandai pesan. Silakan coba lagi.');
    } finally {
      setIsMarking(false);
      setShowOptions(false);
    }
  };

  const handleReplyMessage = () => {
    if (onReplyMessage) {
      onReplyMessage(message.id, message.text);
      setShowOptions(false);
    }
  };

  const handleEditMessage = () => {
    if (onEditMessage && message.text) {
      onEditMessage(message.id, message.text);
      setShowOptions(false);
    }
  };

  const handleCloseTranslation = () => {
    setTranslatedText(null);
    setTranslationError(null);
    setIsShowingTranslation(false);
    resetError(); // Juga reset error dari hook
  };
  
  // Menampilkan error terjemahan - simplify logic
  const renderTranslationError = () => {
    if (!translationError) return null;
    
    return (
      <div className="mt-2 p-2 rounded-lg bg-red-100 text-red-700 text-xs animate-fadeIn flex items-center justify-between">
        <span>{translationError}</span>
        <button 
          onClick={handleCloseTranslation}
          className="text-red-600 hover:text-red-800 ml-2"
        >
          <FiX size={14} />
        </button>
      </div>
    );
  };

  // Fungsi untuk menampilkan ikon file yang sesuai
  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <FiFile size={24} />;
    
    // Konversi ke lowercase untuk perbandingan yang lebih mudah
    const type = fileType.toLowerCase();
    
    // Gambar
    if (type.startsWith('image/')) return <FiImage size={24} />;
    
    // Video
    if (type.startsWith('video/')) return <FiVideo size={24} />;
    
    // Audio
    if (type.startsWith('audio/')) return <FiMusic size={24} />;
    
    // Dokumen
    if (
      type.includes('pdf') || 
      type.includes('application/pdf')
    ) return <FiFileText size={24} />;
    
    // Microsoft Office / OpenDocument
    if (
      type.includes('word') || 
      type.includes('wordprocessingml') ||
      type.includes('application/msword') ||
      type.includes('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
      type.includes('application/vnd.oasis.opendocument.text')
    ) return <FiFileText size={24} />;
    
    if (
      type.includes('excel') || 
      type.includes('spreadsheetml') ||
      type.includes('application/vnd.ms-excel') ||
      type.includes('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
      type.includes('application/vnd.oasis.opendocument.spreadsheet')
    ) return <FiFileText size={24} />;
    
    if (
      type.includes('powerpoint') || 
      type.includes('presentationml') ||
      type.includes('application/vnd.ms-powerpoint') ||
      type.includes('application/vnd.openxmlformats-officedocument.presentationml') ||
      type.includes('application/vnd.oasis.opendocument.presentation')
    ) return <FiFileText size={24} />;
    
    // Kode
    if (
      type.includes('text') || 
      type.includes('javascript') || 
      type.includes('html') || 
      type.includes('css') ||
      type.includes('json') ||
      type.includes('xml')
    ) {
      return <FiCode size={24} />;
    }
    
    // Default
    return <FiFile size={24} />;
  };

  // Format file size
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Cek apakah file adalah audio
  const isAudioFile = (fileType: string | undefined) => {
    if (!fileType) return false;
    return fileType.toLowerCase().startsWith('audio/');
  };

  // Fetch pesan balasan jika ada
  useEffect(() => {
    const fetchReplyMessage = async () => {
      if (message.replyTo && chatId) {
        try {
          const replyDoc = await getDoc(doc(db, 'chats', chatId, 'messages', message.replyTo));
          if (replyDoc.exists()) {
            const replyData = replyDoc.data();
            // Tentukan teks yang akan ditampilkan berdasarkan jenis konten
            let displayText = replyData.text || '';
            let senderName = '';
            
            // Dapatkan nama pengirim asli
            try {
              if (replyData.senderId) {
                const senderDoc = await getDoc(doc(db, 'users', replyData.senderId));
                if (senderDoc.exists()) {
                  const userData = senderDoc.data();
                  // Batasi panjang nama pengirim jika terlalu panjang
                  senderName = userData.displayName || userData.email || 'User';
                  if (senderName.length > 20) {
                    senderName = senderName.substring(0, 18) + '...';
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching reply sender info:', error);
              senderName = 'User';
            }
            
            if (replyData.imageUrl) {
              displayText = displayText || '📷 Foto';
            } else if (replyData.fileUrl) {
              if (replyData.audio) {
                displayText = displayText || '🎤 Pesan Suara'; 
              } else {
                displayText = displayText || `📎 ${replyData.fileName || 'File'}`;
              }
            } else if (!displayText) {
              displayText = 'Pesan';
            }
            
            // Batasi panjang teks pesan balasan
            if (displayText.length > 50) {
              displayText = displayText.substring(0, 48) + '...';
            }
            
            setReplyMessageText(displayText);
            setReplySenderName(senderName);
          }
        } catch (error) {
          console.error('Error fetching reply message:', error);
          setReplyMessageText('Pesan tidak tersedia');
          setReplySenderName('User');
        }
      }
    };

    fetchReplyMessage();
  }, [message.replyTo, chatId]);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group/message`} onDoubleClick={() => handleReplyMessage()}>
      <div className={`relative max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Tombol opsi untuk pesan di luar bubble chat */}
        <button 
          className={`self-center absolute ${isOwn ? '-left-9' : '-right-9'} top-1/2 transform -translate-y-1/2 p-1.5 rounded-full 
            bg-white/90 hover:bg-white text-gray-600 opacity-0 group-hover/message:opacity-100 
            transition-all duration-200 shadow-sm focus:outline-none border border-gray-200`}
          onClick={() => setShowOptions(!showOptions)}
          title="Opsi pesan"
        >
          <FiMoreVertical size={16} />
        </button>
      
        {/* Message bubble */}
        <div 
          className={`px-4 py-2.5 ${
            isOwn 
            ? 'bg-gradient-to-r from-primary to-primary-dark text-white mr-1 rounded-2xl rounded-tr-sm shadow-md shadow-primary/20 border border-primary-dark/20' 
            : 'bg-white/95 backdrop-blur-sm text-gray-800 ml-1 rounded-2xl rounded-tl-sm shadow-md border border-gray-100'
          } ${
            message.replyTo ? 'pt-12' : ''
          } hover:shadow-lg transition-all duration-200 relative`}
        >
          {/* Reply to message reference */}
          {message.replyTo && replyMessageText && (
            <div className={`absolute top-0 left-0 right-0 px-3 py-1.5 rounded-t-2xl flex items-start ${
              isOwn 
              ? 'bg-primary-dark/20 border-l-4 border-l-white/70' 
              : 'bg-gray-100/90 border-l-4 border-l-primary'
            }`}>
              <div className="flex-1 min-w-0 ml-1 mb-0.5">
                <div className="flex items-center">
                  <p className={`text-xs font-medium truncate max-w-[85%] ${isOwn ? 'text-white/90' : 'text-primary'}`}>
                    {replySenderName}
                  </p>
                </div>
                <p className={`text-xs truncate ${isOwn ? 'text-white/80' : 'text-gray-600'}`}>
                  {replyMessageText}
                </p>
              </div>
            </div>
          )}
          
          {/* Dropdown menu untuk pesan */}
          {showOptions && (
            <div 
              ref={optionsRef}
              className={`absolute ${isOwn ? 'right-full mr-3' : 'left-full ml-3'} top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-20 overflow-hidden border border-gray-200 min-w-[180px] animate-scaleIn`}
            >
              {/* Panah indikator dropdown */}
              {isOwn && (
                <div 
                  className="absolute top-6 right-[-6px] w-3 h-3 bg-white border-t border-r border-gray-200 transform rotate-45"
                ></div>
              )}
              {!isOwn && (
                <div 
                  className="absolute top-6 left-[-6px] w-3 h-3 bg-white border-b border-l border-gray-200 transform rotate-45"
                ></div>
              )}
              
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-500">Opsi Pesan</p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={translateMessage}
                  disabled={isTranslating}
                  className="px-4 py-2.5 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                >
                  <div className="bg-indigo-50 p-1.5 rounded-full mr-3">
                    <FiGlobe className="text-indigo-500" size={15} />
                  </div>
                  <span>{isTranslating ? 'Menerjemahkan...' : 'Terjemahkan'}</span>
                </button>
                
                <button
                  onClick={() => handleReplyMessage()}
                  className="px-4 py-2.5 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                >
                  <div className="bg-blue-50 p-1.5 rounded-full mr-3">
                    <FiCornerDownRight className="text-blue-500" size={15} />
                  </div>
                  <span>Balas</span>
                </button>
                
                <button
                  onClick={() => handleMarkMessage()}
                  disabled={isMarking}
                  className="px-4 py-2.5 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                >
                  <div className={`${message.isMarked ? 'bg-yellow-100' : 'bg-yellow-50'} p-1.5 rounded-full mr-3`}>
                    <FiStar className={`${message.isMarked ? 'text-yellow-500' : 'text-yellow-400'}`} size={15} />
                  </div>
                  <span>{message.isMarked ? 'Hapus tanda' : 'Tandai pesan'}</span>
                </button>
                
                {isOwn && (
                  <>
                    <button
                      onClick={() => handleEditMessage()}
                      className="px-4 py-2.5 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <div className="bg-green-50 p-1.5 rounded-full mr-3">
                        <FiEdit className="text-green-500" size={15} />
                      </div>
                      <span>Edit</span>
                    </button>
                    
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => handleDeleteMessage()}
                        disabled={isDeleting}
                        className="px-4 py-2.5 w-full text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                      >
                        <div className="bg-red-50 p-1.5 rounded-full mr-3">
                          <FiTrash className="text-red-500" size={15} />
                        </div>
                        <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Message content */}
          <div className={`${message.imageUrl || message.fileUrl ? 'space-y-2' : ''} max-w-full overflow-hidden`}>
            {/* Text content */}
            {message.text && (
              <p className={`text-sm whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'} ${!message.imageUrl && !message.fileUrl ? 'py-0.5' : ''}`}>
                {message.text}
              </p>
            )}
            
            {/* Translation UI */}
            {isShowingTranslation && (
              <div className={`mt-2 text-sm ${isOwn ? 'bg-white/20' : 'bg-primary/10'} p-2 rounded-xl ${isOwn ? 'text-white/90' : 'text-gray-700'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {translationError ? (
                      renderTranslationError()
                    ) : (
                      <p className="text-sm">
                        {translatedText}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCloseTranslation}
                    className={`ml-1 p-1 rounded-full hover:bg-black/5 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Image content */}
            {message.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden bg-black/5 border border-white/20">
                <img 
                  src={message.imageUrl} 
                  alt="Image message" 
                  className="max-w-full rounded-lg object-contain hover:scale-[0.98] transition-transform cursor-pointer"
                  onClick={() => window.open(message.imageUrl, '_blank')}
                  onLoad={() => {
                    // Scroll to bottom when image loads
                    const messagesContainer = document.querySelector('.messages-container');
                    if (messagesContainer) {
                      messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                  }}
                />
              </div>
            )}
            
            {/* File content */}
            {message.fileUrl && message.fileName && (
              <div className="mt-2">
                {message.audio ? (
                  // Audio player
                  <div className={`flex items-center p-3 rounded-xl ${
                    isOwn 
                    ? 'bg-white/20 backdrop-blur-sm border border-white/20' 
                    : 'bg-primary/10 backdrop-blur-sm border border-primary/20'
                  } transition-all hover:shadow-md`}>
                    <button
                      onClick={toggleAudioPlayback}
                      className={`p-2.5 rounded-full flex items-center justify-center ${
                        isOwn 
                        ? 'bg-white/30 text-white hover:bg-white/40' 
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                      } mr-3 transition-all hover:scale-105 active:scale-95 w-10 h-10 shadow-sm`}
                    >
                      {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} className="ml-0.5" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isOwn ? 'bg-white' : 'bg-primary'} transition-all duration-150 ease-in-out`}
                            style={{width: `${(currentTime / audioDuration) * 100}%`}}
                          ></div>
                        </div>
                        <div className="ml-2">
                          <FiMusic size={14} className={isOwn ? 'text-white/70' : 'text-primary/70'} />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mt-1.5">
                        <span className={isOwn ? 'text-white/80' : 'text-gray-600'}>
                          {formatAudioTime(currentTime)}
                        </span>
                        <span className={isOwn ? 'text-white/80' : 'text-gray-600'}>
                          {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                    </div>
                    
                    <audio 
                      ref={audioRef}
                      src={message.fileUrl}
                      className="hidden"
                      preload="metadata"
                    />
                  </div>
                ) : (
                  // Standard file attachment
                  <a 
                    href={message.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center p-3 rounded-xl ${
                      isOwn 
                      ? 'bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30' 
                      : 'bg-primary/10 backdrop-blur-sm border border-primary/20 hover:bg-primary/15'
                    } transition-all hover:shadow-md`}
                  >
                    <div className={`p-2.5 rounded-xl mr-3 flex-shrink-0 ${
                      isOwn 
                      ? 'bg-white/30 text-white' 
                      : 'bg-primary/20 text-primary'
                    } w-11 h-11 flex items-center justify-center shadow-sm`}>
                      {getFileIcon(message.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                        {message.fileName}
                      </p>
                      <p className={`text-xs ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                        {formatFileSize(message.fileSize)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(message.fileUrl, '_blank');
                      }}
                      className={`p-2 rounded-full ml-2 ${
                        isOwn 
                        ? 'text-white/90 hover:bg-white/20' 
                        : 'text-primary hover:bg-primary/20'
                      } transition-colors hover:scale-105 active:scale-95`}
                    >
                      <FiDownload size={18} />
                    </button>
                  </a>
                )}
              </div>
            )}
          </div>
          
          {/* Message meta */}
          <div className={`flex items-center mt-1.5 text-xs ${isOwn ? 'text-white/70 justify-end' : 'text-gray-500'}`}>
            <span>{formattedTime}</span>
            
            {isOwn && (
              <div className="flex items-center ml-1.5">
                {message.isEdited && (
                  <span className="mr-1 opacity-70">(diubah)</span>
                )}
                
                {message.readBy && message.readBy.length > 1 ? (
                  <div className="flex items-center ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15" className="fill-blue-400">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15" className="fill-white/80">
                      <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                    </svg>
                  </div>
                )}
              </div>
            )}
            
            {message.isMarked && (
              <span className="ml-1.5 text-yellow-400">
                <FiStar size={12} className="inline fill-current" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 