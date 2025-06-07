'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FiSend, FiPaperclip, FiMic, FiSmile, FiArrowLeft, FiUser, FiX, FiCamera, FiFile, FiCornerDownRight, FiMessageSquare, FiCheck, FiVideo, FiPhone } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import EmojiPicker from 'emoji-picker-react';
import { EmojiClickData } from 'emoji-picker-react';
import { listenToUserProfile } from '@/lib/users';
import VideoCallModal from './VideoCallModal';
import IncomingCallModal from './IncomingCallModal';

// Komponen Avatar untuk menampilkan foto profil
type AvatarProps = {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
};

function UserAvatar({ userId, size = 'md' }: AvatarProps) {
  const [userData, setUserData] = useState<{ 
    photoURL?: string; 
    displayName?: string;
    email?: string;
  } | null>(null);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Listener untuk data pengguna realtime
    const unsubscribe = listenToUserProfile(userId, (data) => {
      setUserData(data);
      setImageError(false); // Reset error state saat data user berubah
    });
    
    return () => unsubscribe();
  }, [userId]);
  
  // Ukuran avatar berdasarkan prop
  const sizeClass = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  }[size];
  
  // Ambil inisial dari nama pengguna atau email
  const getInitials = () => {
    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    } else if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
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
          onError={(e) => {
            console.error("Error loading avatar");
            setImageError(true); // Set state error, akan memicu render dengan inisial
          }}
        />
      ) : (
        getInitials()
      )}
    </div>
  );
}

type Message = {
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
  replyTo?: string;
  isEdited?: boolean;
  audio?: boolean;
};

type ChatWindowProps = {
  user: User;
  chatId: string | null;
  onBackClick?: () => void;
  contact?: { name: string; phoneNumber: string } | null;
  usingContact?: boolean;
};

export default function ChatWindow({ 
  user, 
  chatId, 
  onBackClick,
  contact = null,
  usingContact = false
}: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generalFile, setGeneralFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerPhoneNumber, setPartnerPhoneNumber] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [partnerOnlineStatus, setPartnerOnlineStatus] = useState<string>('Offline');
  const [partnerLastSeen, setPartnerLastSeen] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string, text: string} | null>(null);
  const [editingMessage, setEditingMessage] = useState<{id: string, text: string} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState<boolean>(false);
  const [showAudioCallModal, setShowAudioCallModal] = useState<boolean>(false);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState<boolean>(false);
  const [incomingCallId, setIncomingCallId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');

  useEffect(() => {
    // Tutup emoji picker ketika klik di luar komponen
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      
      // Tutup menu lampiran file ketika klik di luar komponen
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMessages([]);
    setChatPartner(null);
    setLoading(true);
    setError(null);

    if (!chatId) {
      setLoading(false);
      return;
    }

    // Fungsi helper untuk update status partner
    const updatePartnerStatus = (partnerData: any) => {
      if (partnerData.isOnline) {
        setPartnerOnlineStatus('Online');
      } else if (partnerData.lastSeen) {
        setPartnerOnlineStatus('Terakhir dilihat');
        setPartnerLastSeen(partnerData.lastSeen);
      } else {
        setPartnerOnlineStatus('Offline');
      }
    };

    // Ambil detail chat untuk mendapatkan informasi partner
    const fetchChatPartner = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const partnerId = chatData.participants.find((id: string) => id !== user.uid);
          
          if (partnerId) {
            try {
              const partnerRef = doc(db, 'users', partnerId);
              const partnerDoc = await getDoc(partnerRef);
              
              if (partnerDoc.exists()) {
                const partnerData = partnerDoc.data();
                setChatPartner({...partnerData, id: partnerId});
                setPartnerName(partnerData.displayName || partnerData.email || 'Pengguna');
                setPartnerPhoneNumber(partnerData.phoneNumber || null);
                
                // Set status awal
                updatePartnerStatus(partnerData);
                
                // Gunakan listener untuk data pengguna realtime
                const unsubscribeProfile = listenToUserProfile(partnerId, (userData) => {
                  setChatPartner({...userData, id: partnerId});
                  setPartnerName(userData.displayName || userData.email || 'Pengguna');
                  setPartnerPhoneNumber(userData.phoneNumber || null);
                  updatePartnerStatus(userData);
                });
                
                // Return cleanup function
                return unsubscribeProfile;
              } else {
                setChatPartner({ id: partnerId, displayName: 'Pengguna', email: '' });
              }
            } catch (partnerError) {
              console.error('Error fetching partner info:', partnerError);
              setChatPartner({ id: partnerId, displayName: 'Pengguna', email: '' });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chat partner:', error);
        setError('Gagal memuat informasi chat');
      }
      
      // Default return jika tidak ada listener
      return () => {};
    };

    // Menjalankan fetch chat partner dan mendapatkan unsubscribe function
    const unsubscribePartner = fetchChatPartner();

    // Fetch pesan menggunakan onSnapshot untuk realtime updates
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        
        setMessages(newMessages);
        setLoading(false);
        
        // Tandai pesan sebagai dibaca
        for (const msg of newMessages) {
          if (msg.senderId !== user.uid && !msg.readBy?.includes(user.uid)) {
            try {
              await updateDoc(doc(db, 'chats', chatId, 'messages', msg.id), {
                readBy: [...(msg.readBy || []), user.uid]
              });
            } catch (updateError) {
              console.error('Error marking message as read:', updateError);
            }
          }
        }
        
        // Cek apakah pesan baru datang dari pengguna lain
        const lastMsg = snapshot.docChanges().find(change => 
          change.type === 'added' && change.doc.data().senderId !== user.uid
        );
        
        // Hanya scroll otomatis jika ada pesan baru dari pengguna lain
        // atau jika pengguna belum melakukan scroll manual
        if ((lastMsg && !userScrolled) || !userScrolled) {
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setError('Gagal memuat pesan');
        setLoading(false);
      }
    );
    
    // Clean up listeners
    return () => {
      unsubscribeMessages();
      unsubscribePartner.then(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [chatId, user.uid]);

  useEffect(() => {
    if (shouldScroll && !userScrolled) {
      scrollToBottom();
    }
  }, [messages, shouldScroll, userScrolled]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Deteksi ketika user scroll manual
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 20;
    
    // Jika user scroll up
    if (!isScrolledToBottom) {
      setUserScrolled(true);
    } else {
      setUserScrolled(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset userScrolled saat mengirim pesan baru
    setUserScrolled(false);
    setShouldScroll(true);
    
    // Jika dalam mode edit, panggil saveEdit
    if (isEditing && editingMessage) {
      await saveEdit();
      return;
    }
    
    if ((!message.trim() && !imageFile && !generalFile) || !chatId) return;

    setUploadError(null); // Reset error saat memulai upload
    
    try {
      let finalImageUrl = '';
      let fileInfo = {
        fileUrl: '',
        fileName: '',
        fileType: '',
        fileSize: 0
      };
      
      setIsUploading(true);
      
      // Jika ada file umum, upload ke Cloudinary melalui API kita
      if (generalFile) {
        try {
          console.log('Memulai upload file umum:', generalFile.name, generalFile.type);
          const formData = new FormData();
          formData.append('file', generalFile);
          
          const response = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response dari API:', errorData);
            throw new Error(`Gagal mengupload file: ${errorData.message || response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Respons upload file:', data);
          
          if (data.success && data.url) {
            fileInfo = {
              fileUrl: data.url,
              fileName: generalFile.name,
              fileType: generalFile.type || 'application/octet-stream',
              fileSize: generalFile.size
            };
            console.log('File berhasil diupload ke Cloudinary:', data.url);
          }
        } catch (error) {
          console.error('Error upload file ke Cloudinary:', error);
          setUploadError(error instanceof Error ? error.message : 'Gagal mengupload file. Silakan coba lagi.');
          setIsUploading(false);
          return;
        }
      }
      // Jika ada file gambar, upload file ke Cloudinary melalui API kita
      else if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('file', imageFile);
          
          const response = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error('Gagal mengupload gambar');
          }
          
          const data = await response.json();
          if (data.success && data.url) {
            finalImageUrl = data.url;
            console.log('Gambar berhasil diupload ke Cloudinary:', finalImageUrl);
          }
        } catch (error) {
          console.error('Error upload file ke Cloudinary:', error);
          setUploadError(error instanceof Error ? error.message : 'Gagal mengupload gambar. Silakan coba lagi.');
          setIsUploading(false);
          return;
        }
      }
      
      setIsUploading(false);
      
      // Simpan pesan ke Firestore
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: message,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        readBy: [user.uid],
        ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
        ...(fileInfo.fileUrl ? { 
          fileUrl: fileInfo.fileUrl,
          fileName: fileInfo.fileName,
          fileType: fileInfo.fileType,
          fileSize: fileInfo.fileSize
        } : {}),
        ...(replyingTo ? { replyTo: replyingTo.id } : {})
      });
      
      // Update terakhir chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text: fileInfo.fileUrl 
            ? `📎 ${fileInfo.fileName}` 
            : (finalImageUrl ? '📷 Gambar' : message),
          timestamp: serverTimestamp(),
          senderId: user.uid
        },
        updatedAt: serverTimestamp()
      });
      
      // Reset state
      setMessage('');
      setPreviewUrl(null);
      setImageFile(null);
      setGeneralFile(null);
      setShowEmojiPicker(false);
      setShowAttachMenu(false);
      setReplyingTo(null);
      
      // Reload messages after sending
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      
      setMessages(newMessages);
      
      // Scroll ke bawah hanya untuk pesan yang dikirim sendiri
      setTimeout(() => {
        // Izinkan scrolling otomatis setelah mengirim pesan sendiri
        setShouldScroll(true);
        setUserScrolled(false);
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan');
      return;
    }
    
    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB');
      return;
    }
    
    setImageFile(file);
    setGeneralFile(null);
    
    // Buat preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGeneralFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('File yang dipilih:', file.name, file.type, file.size);
    
    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return;
    }
    
    setGeneralFile(file);
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setGeneralFile(null);
    if (generalFileInputRef.current) {
      generalFileInputRef.current.value = '';
    }
  };
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const formatLastSeen = (timestamp: any): string => {
    if (!timestamp) return '';
    
    try {
      // Konversi timestamp Firestore ke Date
      const date = timestamp.toDate ? timestamp.toDate() : 
                   timestamp.seconds ? new Date(timestamp.seconds * 1000) : 
                   new Date();
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);
      
      if (diffMins < 1) return 'baru saja';
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return 'kemarin';
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      
      return format(date, 'dd/MM/yyyy', { locale: id });
    } catch (error) {
      console.error('Error formatting last seen:', error);
      return '';
    }
  };

  // Fungsi untuk membuka WhatsApp
  const openWhatsApp = () => {
    if (!partnerPhoneNumber) return;
    
    // Bersihkan nomor telepon (hanya angka dan +)
    const cleanNumber = partnerPhoneNumber.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  // Tambahkan efek untuk menangani kontak
  useEffect(() => {
    if (usingContact && contact) {
      // Jika menggunakan kontak langsung tanpa chat id
      setChatPartner({
        displayName: contact.name,
        email: '',
        phoneNumber: contact.phoneNumber
      });
      setPartnerName(contact.name);
      setPartnerPhoneNumber(contact.phoneNumber);
      setLoading(false);
    }
  }, [usingContact, contact]);

  const clearUploadError = () => {
    if (uploadError) {
      setUploadError(null);
    }
  };

  // Fungsi untuk memulai rekaman suara
  const startVoiceRecording = async () => {
    try {
      // Reset state terlebih dahulu
      setAudioChunks([]);
      setAudioBlob(null);
      setIsProcessingAudio(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      // Simpan chunks setiap 300ms
      let chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        try {
          // Pastikan ada audio chunks yang direkam
          if (chunks.length === 0) {
            console.log('Tidak ada audio yang direkam');
            setUploadError('Tidak ada audio yang direkam. Silakan coba lagi.');
            setIsProcessingAudio(false);
            return;
          }
          
          setIsProcessingAudio(true);
          
          // Buat audio blob dengan format yang didukung
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          
          if (audioBlob.size < 100) {
            console.log('Rekaman audio terlalu pendek');
            setUploadError('Rekaman terlalu pendek. Silakan coba lagi.');
            setIsProcessingAudio(false);
            return;
          }
          
          setAudioBlob(audioBlob);
          setAudioChunks(chunks);
          
          // Upload audio ke server
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice-message.webm');
          
          console.log('Uploading audio file, size:', audioBlob.size);
          
          const response = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Upload response error:', errorData);
            throw new Error(errorData.message || 'Gagal mengupload voice chat');
          }
          
          const data = await response.json();
          console.log('Upload response:', data);
          
          if (data.success && data.url && chatId) {
            // Kirim pesan audio
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
              text: '🎤 Voice Message',
              senderId: user.uid,
              timestamp: serverTimestamp(),
              readBy: [user.uid],
              fileUrl: data.url,
              fileName: 'voice-message.webm',
              fileType: 'audio/webm',
              fileSize: audioBlob.size,
              audio: true, // Penting: tandai ini sebagai audio
              ...(replyingTo ? { replyTo: replyingTo.id } : {})
            });
            
            // Update terakhir chat
            await updateDoc(doc(db, 'chats', chatId), {
              lastMessage: {
                text: '🎤 Voice Message',
                timestamp: serverTimestamp(),
                senderId: user.uid
              },
              updatedAt: serverTimestamp()
            });
            
            // Reload pesan untuk menampilkan pesan audio baru
            const messagesQuery = query(
              collection(db, 'chats', chatId, 'messages'),
              orderBy('timestamp', 'asc')
            );
            
            const snapshot = await getDocs(messagesQuery);
            const newMessages = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Message[];
            
            setMessages(newMessages);
            scrollToBottom();
            
            setReplyingTo(null);
          }
        } catch (error) {
          console.error('Error sending voice message:', error);
          setUploadError('Gagal mengirim pesan suara. Silakan coba lagi.');
        } finally {
          setIsProcessingAudio(false);
          setAudioChunks([]);
          chunks = [];
        }
      };
      
      setMediaRecorder(recorder);
      
      // Mulai rekaman dengan interval chunk 300ms
      recorder.start(300);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setUploadError('Gagal mengakses mikrofon. Pastikan mikrofon diizinkan di browser Anda.');
    }
  };

  // Fungsi untuk berhenti merekam
  const stopVoiceRecording = () => {
    if (!mediaRecorder) return;
    
    try {
      if (mediaRecorder.state === 'recording') {
        // Berhenti merekam
        mediaRecorder.stop();
        
        // Stop semua audio tracks
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setUploadError('Gagal menghentikan rekaman. Coba lagi.');
      setIsRecording(false);
    }
  };

  // Fungsi untuk membalas pesan
  const handleReplyMessage = (messageId: string, messageText: string) => {
    setReplyingTo({
      id: messageId,
      text: messageText
    });
    
    // Untuk balas pesan, kita tetap scroll otomatis
    setShouldScroll(true);
    setUserScrolled(false);
    
    // Fokus ke input pesan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Fungsi untuk membatalkan balasan
  const cancelReply = () => {
    setReplyingTo(null);
    // Tidak perlu mengubah scroll behavior saat cancel reply
  };

  // Fungsi untuk menangani edit pesan
  const handleEditMessage = (messageId: string, messageText: string) => {
    setEditingMessage({
      id: messageId,
      text: messageText
    });
    
    setMessage(messageText);
    setIsEditing(true);
    
    // Matikan scroll otomatis saat mengedit
    setShouldScroll(false);
    
    // Fokus ke input pesan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Fungsi untuk membatalkan edit
  const cancelEdit = () => {
    setEditingMessage(null);
    setIsEditing(false);
    setMessage('');
    // Tetap matikan scroll otomatis setelah cancel edit
    setShouldScroll(false);
  };

  // Fungsi untuk menyimpan edit
  const saveEdit = async () => {
    if (!chatId || !editingMessage || !message.trim()) return;
    
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', editingMessage.id), {
        text: message.trim(),
        isEdited: true
      });
      
      // Reset state edit
      setEditingMessage(null);
      setIsEditing(false);
      setMessage('');
      // Tetap matikan scroll otomatis setelah edit
      setShouldScroll(false);
      
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Gagal mengedit pesan. Silakan coba lagi.');
    }
  };

  // Di dalam komponen ChatWindow, tambahkan efek untuk menandai pesan sebagai sudah dibaca
  useEffect(() => {
    if (chatId) {
      // Perbarui timestamp terakhir dibaca
      const currentTime = Date.now();
      localStorage.setItem(`lastRead_${chatId}`, currentTime.toString());
      
      // Beritahu komponen lain bahwa pesan telah dibaca
      const event = new CustomEvent('messageRead', { 
        detail: { chatId }
      });
      window.dispatchEvent(event);
    }
  }, [chatId, messages]); // Ketika pesan berubah atau chatId berubah

  useEffect(() => {
    // Mendengarkan panggilan masuk
    const listenForIncomingCalls = () => {
      if (!user.uid) return;
      
      // Setup interval untuk memeriksa localStorage setiap 2 detik
      const intervalId = setInterval(() => {
        try {
          // Ambil semua panggilan dari localStorage
          const calls = JSON.parse(localStorage.getItem('hallo_calls') || '{}');
          
          // Filter panggilan yang sedang 'ringing' dan ditujukan ke pengguna ini dan chatId ini
          const incomingCalls = Object.entries(calls)
            .map(([id, data]) => ({ id, ...data as any }))
            .filter(call => 
              call.recipientId === user.uid && 
              call.status === 'ringing' &&
              call.chatId === chatId &&
              // Hanya tampilkan notifikasi jika panggilan kurang dari 30 detik yang lalu
              new Date().getTime() - new Date(call.startedAt).getTime() < 30000
            );
          
          // Jika ada panggilan masuk, tampilkan modal
          if (incomingCalls.length > 0) {
            const latestCall = incomingCalls[0];
            setIncomingCallId(latestCall.id);
            setShowIncomingCallModal(true);
          }
          
          // Jika ada panggilan yang sedang ditampilkan tapi sudah tidak ringing, tutup modal
          if (incomingCallId) {
            const currentCall = calls[incomingCallId];
            if (!currentCall || currentCall.status !== 'ringing') {
              setShowIncomingCallModal(false);
              setIncomingCallId(null);
            }
          }
        } catch (error) {
          console.error('Error checking for incoming calls:', error);
        }
      }, 2000);
      
      // Return cleanup function
      return () => clearInterval(intervalId);
    };
    
    const unsubscribeCalls = listenForIncomingCalls();
    
    return () => {
      if (unsubscribeCalls) {
        unsubscribeCalls();
      }
    };
  }, [user.uid, chatId, incomingCallId]);

  const handleVideoCall = () => {
    if (!chatPartner || !chatPartner.id) {
      alert('Tidak dapat melakukan panggilan, informasi pengguna tidak ditemukan');
      return;
    }
    
    // Cek apakah partner sedang online untuk meningkatkan keberhasilan panggilan
    if (partnerOnlineStatus !== 'Online') {
      if (!confirm('Pengguna ini terlihat tidak aktif. Tetap ingin melakukan panggilan video?')) {
        return;
      }
    }
    
    // Berikan delay kecil sebelum memulai panggilan untuk memastikan UI tidak lag
    setTimeout(() => {
      console.log('Starting video call with:', chatPartner.id);
      setCallType('video');
      setShowVideoCallModal(true);
    }, 100);
  };
  
  const handleAudioCall = () => {
    if (!chatPartner || !chatPartner.id) {
      alert('Tidak dapat melakukan panggilan, informasi pengguna tidak ditemukan');
      return;
    }
    
    // Cek apakah partner sedang online untuk meningkatkan keberhasilan panggilan
    if (partnerOnlineStatus !== 'Online') {
      if (!confirm('Pengguna ini terlihat tidak aktif. Tetap ingin melakukan panggilan audio?')) {
        return;
      }
    }
    
    // Berikan delay kecil sebelum memulai panggilan untuk memastikan UI tidak lag
    setTimeout(() => {
      console.log('Starting audio call with:', chatPartner.id);
      setCallType('audio');
      setShowVideoCallModal(true);
    }, 100);
  };
  
  const handleAcceptCall = (callId: string, isVideoCall: boolean) => {
    console.log('Accepting call in ChatWindow:', callId, isVideoCall ? 'video' : 'audio');
    setIncomingCallId(callId);
    setShowIncomingCallModal(false);
    
    // Gunakan timeout untuk memastikan modal incoming call ditutup terlebih dahulu
    setTimeout(() => {
      setCallType(isVideoCall ? 'video' : 'audio');
      setShowVideoCallModal(true);
    }, 200);
  };
  
  const handleRejectCall = () => {
    console.log('Rejecting call in ChatWindow');
    setShowIncomingCallModal(false);
    
    // Gunakan timeout untuk memastikan state reset setelah modal ditutup
    setTimeout(() => {
      setIncomingCallId(null);
    }, 200);
  };

  if (!chatId) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-primary p-4 text-white">
          <h2 className="font-medium">Pilih chat untuk memulai percakapan</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Pilih atau mulai chat baru untuk memulai percakapan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-visible">
      {/* Chat Header */}
      <div 
        className="bg-gradient-to-r from-primary via-primary to-primary-dark p-3 flex items-center text-white border-b border-primary-dark/40 shadow-sm navbar-no-radius" 
        style={{ 
          borderRadius: '0', 
          overflow: 'visible',
        }}
      >
        {onBackClick && (
          <button 
            onClick={onBackClick}
            className="mr-2 p-1.5 hover:bg-white/10 transition-colors"
          >
            <FiArrowLeft size={22} />
          </button>
        )}
        
        <div className="flex items-center flex-1 min-w-0">
          <UserAvatar userId={chatPartner?.id || '0'} size="lg" />
          
          <div className="ml-3 flex-1 min-w-0">
            <h2 className="font-medium text-base truncate">{partnerName || 'Memuat...'}</h2>
            <p className="text-xs text-white/80 flex items-center">
              {partnerOnlineStatus === 'Online' ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  {partnerOnlineStatus}
                </>
              ) : partnerOnlineStatus === 'Terakhir dilihat' && partnerLastSeen ? (
                <>Terakhir dilihat {formatLastSeen(partnerLastSeen)}</>
              ) : (
                <>Offline</>
              )}
            </p>
          </div>

          {/* Tombol Video dan Audio Call */}
          <div className="flex space-x-3">
            <button 
              onClick={handleAudioCall}
              className="rounded-full p-2 hover:bg-primary-dark focus:outline-none"
              title="Panggilan Suara"
            >
              <FiPhone size={20} />
            </button>
            <button 
              onClick={handleVideoCall}
              className="rounded-full p-2 hover:bg-primary-dark focus:outline-none"
              title="Panggilan Video"
            >
              <FiVideo size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div 
        className="flex-1 p-4 overflow-y-auto relative"
        onScroll={handleScroll}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23aaaaaa' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundColor: '#e6e0d4'
        }}
      >
        <div className="relative z-10">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center p-4 bg-red-50 rounded-xl shadow">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-dark transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center mt-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <FiMessageSquare size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800">Belum ada pesan</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4">Kirim pesan untuk memulai percakapan</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 pb-2">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === user.uid}
                  onReplyMessage={(msgId: string, text: string) => handleReplyMessage(msgId, text)}
                  onEditMessage={(msgId: string, text: string) => handleEditMessage(msgId, text)}
                  chatId={chatId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {messages.length > 10 && userScrolled && (
          <button 
            onClick={scrollToBottom}
            className="fixed bottom-20 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-md hover:bg-white transition-colors z-20"
            title="Scroll ke pesan terbaru"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </button>
        )}
      </div>
      
      {/* Preview Upload Image */}
      {previewUrl && (
        <div className="p-3 bg-white border-t">
          <div className="relative rounded-md overflow-hidden bg-gray-100 inline-block">
            <img 
              src={previewUrl} 
              alt="Upload preview" 
              className="max-h-48 max-w-full object-contain" 
            />
            <button 
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow hover:bg-white"
            >
              <FiX size={16} className="text-red-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Preview Upload File */}
      {generalFile && (
        <div className="p-3 bg-white border-t">
          <div className="flex items-center p-2 rounded-md bg-gray-100 max-w-full">
            <div className="p-2 bg-primary/10 rounded-md mr-2">
              <FiFile className="text-primary" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{generalFile.name}</p>
              <p className="text-xs text-gray-500">
                {(generalFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button 
              onClick={handleRemoveFile}
              className="ml-2 p-1 rounded-full hover:bg-gray-200"
            >
              <FiX size={16} className="text-red-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Reply to Message */}
      {replyingTo && (
        <div className="p-2 bg-white border-t border-gray-200">
          <div className="flex items-center p-1.5 bg-gray-50 border-l-4 border-l-primary rounded-sm overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 ml-2">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-primary truncate max-w-[70%]">
                  {chatPartner?.displayName || 'User'}
                </span>
              </div>
              <p className="text-sm text-gray-700 truncate">{replyingTo.text}</p>
            </div>
            <button 
              onClick={cancelReply}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Message */}
      {isEditing && editingMessage && (
        <div className="p-3 bg-white border-t">
          <div className="flex items-center">
            <div className="w-1 h-full bg-orange-500 rounded-full mr-2"></div>
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-xs font-medium text-orange-500">Edit pesan</span>
              <p className="text-sm text-gray-700 truncate">
                {message || editingMessage.text}
              </p>
            </div>
            <button 
              onClick={cancelEdit}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <FiX size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Upload Error */}
      {uploadError && (
        <div className="p-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center">
            <p className="text-sm text-red-600 flex-1">{uploadError}</p>
            <button 
              onClick={clearUploadError}
              className="p-1 hover:bg-red-100 rounded-full"
            >
              <FiX size={18} className="text-red-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Message Input */}
      <div className="p-3 bg-white border-t relative">
        {/* Attachment Menu */}
        {showAttachMenu && (
          <div 
            ref={attachMenuRef}
            className="absolute bottom-16 left-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden z-20"
          >
            <div className="p-2 grid grid-cols-2 gap-1">
              <button 
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                  setShowAttachMenu(false);
                }}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-1">
                  <FiCamera className="text-primary" size={18} />
                </div>
                <span className="text-xs text-gray-600">Foto</span>
              </button>
              
              <button 
                onClick={() => {
                  if (generalFileInputRef.current) generalFileInputRef.current.click();
                  setShowAttachMenu(false);
                }}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-1">
                  <FiFile className="text-primary" size={18} />
                </div>
                <span className="text-xs text-gray-600">Dokumen</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-16 right-3 z-20 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden"
          >
            <EmojiPicker 
              onEmojiClick={handleEmojiClick} 
              width={280} 
              height={350}
            />
          </div>
        )}
        
        <div className="flex items-center">
          {/* Attachment Button */}
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <FiPaperclip size={22} />
          </button>
          
          {/* Message Input */}
          <div className="flex-1 mx-2 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (isEditing) {
                    saveEdit();
                  } else {
                    handleSendMessage(e);
                  }
                }
              }}
              placeholder="Ketik pesan..."
              className="w-full py-2.5 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
              disabled={isUploading || isProcessingAudio}
            />
          </div>
          
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <FiSmile size={22} />
          </button>
          
          {/* Voice Message Button / Send Button */}
          {!message && !imageFile && !generalFile && !isEditing ? (
            <button
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
              className={`p-2 rounded-full ${
                isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : isProcessingAudio 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-dark transition-colors'
              }`}
            >
              {isRecording ? (
                <div className="w-6 h-6 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  <FiMic size={20} />
                </div>
              ) : isProcessingAudio ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white"></div>
                </div>
              ) : (
                <FiMic size={20} />
              )}
            </button>
          ) : (
            <button
              onClick={isEditing ? saveEdit : handleSendMessage}
              disabled={isUploading || (!message && !imageFile && !generalFile)}
              className={`p-2 rounded-full ${
                (!message && !imageFile && !generalFile) || isUploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-dark transition-colors'
              }`}
            >
              {isUploading ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white"></div>
                </div>
              ) : isEditing ? (
                <FiCheck size={20} />
              ) : (
                <FiSend size={20} />
              )}
            </button>
          )}
        </div>
        
        {/* Hidden file inputs */}
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />
        
        <input 
          ref={generalFileInputRef}
          type="file"
          onChange={handleGeneralFileChange}
          className="hidden"
        />
      </div>

      {/* Modals */}
      {showVideoCallModal && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setShowVideoCallModal(false)}
          user={user}
          chatId={chatId}
          recipientId={chatPartner?.id || ''}
          isVideoCall={callType === 'video'}
        />
      )}
      
      {showAudioCallModal && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setShowAudioCallModal(false)}
          user={user}
          chatId={chatId}
          recipientId={chatPartner?.id || ''}
          isVideoCall={callType === 'video'}
        />
      )}
      
      {showIncomingCallModal && (
        <IncomingCallModal
          isOpen={true}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          user={user}
          callId={incomingCallId || ''}
        />
      )}
    </div>
  );
} 