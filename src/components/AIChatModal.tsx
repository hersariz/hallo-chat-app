'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiX, FiMessageSquare, FiLoader, FiMoreVertical, FiCopy, FiTrash2, FiSmile, FiStar, FiBookmark, FiCornerDownLeft } from 'react-icons/fi';
import { DEFAULT_MODEL, getModelDisplayName } from '@/lib/qwen';
import EmojiPicker from 'emoji-picker-react';
import { useAIConfig } from '@/lib/context';
import { translateText } from '@/lib/translate';

// Tipe pesan yang juga memiliki properti translatedContent dan replyTo
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  translatedContent?: string;
  replyTo?: {
    index: number;
    content: string;
  };
};

type AIChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customInstructions?: string;
  model?: string;
  defaultLanguage?: string;
  isEmbedded?: boolean;
};

export default function AIChatModal({ 
  isOpen, 
  onClose, 
  customInstructions = '',
  model = DEFAULT_MODEL,
  defaultLanguage = 'id',
  isEmbedded = false
}: AIChatModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [markedMessages, setMarkedMessages] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{index: number, content: string} | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Map<number, string>>(new Map());
  const [isTranslating, setIsTranslating] = useState<Map<number, boolean>>(new Map());

  const { aiConfig } = useAIConfig();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Tutup emoji picker ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  // Tutup dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle menu dropdown
  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Salin pesan ke clipboard
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('Pesan disalin ke clipboard');
        setActiveDropdown(null);
      })
      .catch(err => {
        console.error('Gagal menyalin pesan:', err);
      });
  };

  // Hapus pesan dari daftar chat lokal
  const deleteMessage = (index: number) => {
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages.splice(index, 1);
      return newMessages;
    });
    setActiveDropdown(null);
  };

  // Tandai pesan penting
  const toggleMarkMessage = (index: number) => {
    setMarkedMessages(prev => {
      const newMarked = new Set(prev);
      if (newMarked.has(index)) {
        newMarked.delete(index);
      } else {
        newMarked.add(index);
      }
      return newMarked;
    });
    setActiveDropdown(null);
  };

  // Balas pesan
  const handleReplyMessage = (index: number, content: string) => {
    setReplyingTo({index, content});
    setActiveDropdown(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Batalkan balasan
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Fungsi untuk menerjemahkan pesan
  const translateMessage = async (content: string, index: number) => {
    if (!content || isTranslating.get(index)) return;
    
    // Set status menerjemahkan
    const newTranslatingStatus = new Map(isTranslating);
    newTranslatingStatus.set(index, true);
    setIsTranslating(newTranslatingStatus);
    
    try {
      // Tutup dropdown
      setActiveDropdown(null);
      
      console.log("Menerjemahkan pesan:", content);
      console.log("Bahasa target:", aiConfig.translateLanguage || 'en');
      
      // Gunakan fungsi translateText
      const targetLang = aiConfig.translateLanguage || 'en';
      
      try {
        const result = await translateText(content, targetLang);
        console.log("Hasil terjemahan:", result);
        
        if (result && result.translatedText) {
          // Update state dengan hasil terjemahan
          const newTranslatedMessages = new Map(translatedMessages);
          newTranslatedMessages.set(index, result.translatedText);
          setTranslatedMessages(newTranslatedMessages);
          
          // Update pesan yang ditampilkan dengan tag terjemahan
          const updatedMessages = [...messages];
          updatedMessages[index] = {
            ...updatedMessages[index],
            translatedContent: result.translatedText
          };
          setMessages(updatedMessages);
        } else {
          throw new Error("Respons terjemahan tidak valid");
        }
      } catch (translateError) {
        console.error("Error saat memanggil translateText:", translateError);
        setError('Gagal menerjemahkan pesan. Silakan coba lagi.');
        setTimeout(() => setError(null), 3000);
      }
      
    } catch (error) {
      console.error('Gagal menerjemahkan pesan:', error);
      setError('Gagal menerjemahkan pesan. Silakan coba lagi.');
      setTimeout(() => setError(null), 3000);
    } finally {
      // Reset status menerjemahkan
      const newTranslatingStatus = new Map(isTranslating);
      newTranslatingStatus.set(index, false);
      setIsTranslating(newTranslatingStatus);
    }
  };

  // Kirim pesan ke AI dengan bahasa yang ditetapkan
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Tambahkan pesan pengguna ke daftar pesan
      const userMessage: Message = { 
        role: 'user', 
        content: message,
        replyTo: replyingTo ? {
          index: replyingTo.index,
          content: replyingTo.content.substring(0, 50) + (replyingTo.content.length > 50 ? '...' : '')
        } : undefined
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Reset input dan reply
      setMessage('');
      setReplyingTo(null);
      
      // Tambahkan instruksi bahasa jika ada
      let finalInstructions = customInstructions;
      if (defaultLanguage && !customInstructions.includes('bahasa')) {
        const languageMap: {[key: string]: string} = {
          'id': 'Indonesia',
          'en': 'Inggris',
          'ja': 'Jepang',
          'ko': 'Korea',
          'zh': 'Mandarin',
          'ar': 'Arab',
          'es': 'Spanyol',
          'fr': 'Prancis',
          'de': 'Jerman',
          'ru': 'Rusia'
        };
        
        const languageName = languageMap[defaultLanguage] || 'Indonesia';
        finalInstructions = finalInstructions + `\nSelalu menjawab dalam bahasa ${languageName}.`;
      }
      
      // Jumlah percobaan maksimum
      const MAX_RETRIES = 3;
      let retries = 0;
      let success = false;
      let errorMsg = '';
      
      while (retries <= MAX_RETRIES && !success) {
        try {
          // Tambahkan penundaan yang semakin lama dengan backoff eksponensial
          if (retries > 0) {
            const delayMs = Math.min(1000 * Math.pow(2, retries - 1), 8000); // max 8 detik delay
            console.log(`Mencoba ulang dalam ${delayMs}ms (percobaan ${retries}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }

          // Kirim pesan ke API
          console.log(`Mengirim request ke API (percobaan ${retries + 1}/${MAX_RETRIES + 1})...`);
          
          // Pastikan URL endpoint benar
          const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              customInstructions: finalInstructions,
              model,
            }),
            cache: 'no-store' // Pastikan tidak menggunakan cache
          });
          
          // Tangani error response
          if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            } catch (e) {
              throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
          }
          
          const data = await response.json();
          console.log('Response data:', data);
          
          // Periksa berbagai kemungkinan format respons
          let responseContent = '';
          let responseRole: 'user' | 'assistant' | 'system' = 'assistant';
          
          if (data.response) {
            // Format dari API kita
            responseContent = data.response;
            if (data.role === 'assistant' || data.role === 'user' || data.role === 'system') {
              responseRole = data.role;
            }
          } else if (data.content) {
            // Format content langsung
            responseContent = data.content;
          } else if (data.message && data.message.content) {
            // Format dengan message di root
            responseContent = data.message.content;
            if (data.message.role === 'assistant' || data.message.role === 'user' || data.message.role === 'system') {
              responseRole = data.message.role;
            }
          } else if (data.choices && data.choices[0] && data.choices[0].message) {
            // Format OpenAI-like
            responseContent = data.choices[0].message.content;
            if (data.choices[0].message.role === 'assistant' || data.choices[0].message.role === 'user' || data.choices[0].message.role === 'system') {
              responseRole = data.choices[0].message.role;
            }
          } else {
            throw new Error('Format respons tidak dapat dikenali, silakan coba lagi');
          }
          
          // Tambahkan respons AI ke daftar pesan
          const aiMessage: Message = { 
            role: responseRole,
            content: responseContent,
          };
          
          setMessages(prev => [...prev, aiMessage]);
          success = true;
          console.log('Berhasil mendapatkan respons dari AI');
        } catch (err: any) {
          // Jika masih ada kesempatan coba lagi
          if (retries < MAX_RETRIES) {
            console.log(`Percobaan ke-${retries + 1} gagal, mencoba lagi...`, err);
            retries++;
          } else {
            // Jika sudah mencapai batas, tampilkan error dan buat respons fallback
            errorMsg = err.message || 'Terjadi kesalahan saat berkomunikasi dengan AI';
            console.error('Semua percobaan gagal:', errorMsg);
            
            // Tambahkan respons fallback
            const fallbackMessage: Message = {
              role: 'assistant',
              content: `Maaf, saya tidak dapat menjawab permintaan Anda saat ini karena masalah teknis. Silakan coba beberapa saat lagi.

Saat ini layanan AI sedang mengalami gangguan. Ini bisa disebabkan oleh:
1. Koneksi internet yang tidak stabil
2. Layanan OpenRouter yang sedang maintenance
3. Model AI yang diminta sedang tidak tersedia

Silakan tutup aplikasi dan coba lagi setelah beberapa menit.`
            };
            
            setMessages(prev => [...prev, fallbackMessage]);
            success = true; // Untuk keluar dari loop
          }
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Terjadi kesalahan saat berkomunikasi dengan AI';
      setError(errorMessage);
      console.error('Error saat mengirim pesan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format pesan ke tampilan HTML
  const formatMessage = (content: string, translatedContent?: string): string => {
    // Jika ada terjemahan, tampilkan terjemahan di bawah pesan asli
    if (translatedContent) {
      return `${content}<div class="mt-2 p-2 rounded-lg bg-gray-100 text-gray-800 relative animate-fadeIn" style="max-width: 100%; width: fit-content; margin-left: auto; margin-right: auto;">
        <div class="flex items-center mb-1">
          <svg class="w-3 h-3 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="currentColor"/>
          </svg>
          <span class="text-xs font-medium mr-6">Terjemahan</span>
          <button class="absolute right-2 top-2 text-gray-500 hover:text-gray-700" onclick="this.parentNode.parentNode.remove()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="text-sm whitespace-pre-wrap break-words">${translatedContent}</p>
      </div>`;
    }
    
    // Jika tidak ada terjemahan, tampilkan pesan biasa
    return content
      .replace(/\n/g, '<br>')
      .replace(/```([^`]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]*?)`/g, '<code>$1</code>');
  };

  // Handler untuk tombol enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Tampilan untuk pesan-pesan chat
  const renderMessages = () => {
    return messages.map((msg, index) => (
      <div 
        key={index} 
        className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group/message w-full`}
      >
        {/* Tombol opsi untuk pesan user di sebelah kiri bubble */}
        {msg.role === 'user' && (
          <button 
            className={`self-center mr-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 
              opacity-0 group-hover/message:opacity-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50`}
            onClick={() => toggleDropdown(index)}
            title="Opsi pesan"
            aria-label="Opsi pesan"
          >
            <FiMoreVertical size={19} />
          </button>
        )}
        
        <div className={`relative ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'} max-w-[75%]`}>
          {/* Rendered reply if exists */}
          {msg.replyTo && (
            <div className={`mb-1 max-w-full p-2 bg-gray-100 rounded text-xs text-gray-600 border-l-2 border-primary`}>
              <div className="font-medium">Membalas:</div>
              <div className="truncate">{msg.replyTo.content}</div>
            </div>
          )}
          
          <div 
            className={`relative group w-full ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-l-lg rounded-tr-lg shadow-md' 
                : 'bg-white border rounded-r-lg rounded-tl-lg shadow-sm'
            } px-3 py-2 ${markedMessages.has(index) ? 'border-2 border-yellow-400' : ''}`}
            style={{ 
              wordBreak: 'break-word'
            }}
          >
            {/* Message option button untuk pesan AI */}
            {msg.role !== 'user' && (
              <button 
                className={`absolute -right-12 top-1/2 transform -translate-y-1/2 p-2 rounded-full 
                  bg-gray-200 hover:bg-gray-300 text-gray-600 opacity-0 group-hover:opacity-100 
                  transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50`}
                onClick={() => toggleDropdown(index)}
                title="Opsi pesan"
                aria-label="Opsi pesan"
              >
                <FiMoreVertical size={19} />
              </button>
            )}
            
            {/* Dropdown menu untuk pesan */}
            {activeDropdown === index && (
              <div 
                ref={dropdownRef}
                className={`absolute ${msg.role === 'user' ? 'right-full mr-3' : 'left-full ml-3'} top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-20 overflow-hidden border border-gray-200 min-w-[200px] animate-scaleIn`}
              >
                {/* Panah indikator dropdown hanya untuk pesan user */}
                {msg.role === 'user' && (
                  <div 
                    className="absolute top-6 right-[-6px] w-3 h-3 bg-gray-50 border-t border-r border-gray-200 transform rotate-45"
                  ></div>
                )}
                
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500">Opsi Pesan</p>
                </div>
                
                <div className="py-1">
                  <button 
                    onClick={() => handleReplyMessage(index, msg.content)}
                    className="px-4 py-3 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <div className="bg-blue-50 p-1.5 rounded-full mr-3">
                      <FiCornerDownLeft className="text-blue-500" size={15} />
                    </div>
                    <span>Balas</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleMarkMessage(index)}
                    className="px-4 py-3 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <div className={`${markedMessages.has(index) ? 'bg-yellow-100' : 'bg-yellow-50'} p-1.5 rounded-full mr-3`}>
                      <FiStar className={`${markedMessages.has(index) ? 'text-yellow-500' : 'text-yellow-400'}`} size={15} />
                    </div>
                    <span>{markedMessages.has(index) ? 'Hapus Tanda' : 'Tandai'}</span>
                  </button>
                  
                  <button 
                    onClick={() => translateMessage(msg.content, index)}
                    className="px-4 py-3 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <div className="bg-indigo-50 p-1.5 rounded-full mr-3">
                      <svg className="text-indigo-500" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span>{isTranslating.get(index) ? 'Menerjemahkan...' : 'Terjemahkan'}</span>
                  </button>
                  
                  <button 
                    onClick={() => copyMessage(msg.content)}
                    className="px-4 py-3 w-full text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <div className="bg-indigo-50 p-1.5 rounded-full mr-3">
                      <FiCopy className="text-indigo-500" size={15} />
                    </div>
                    <span>Salin</span>
                  </button>
                </div>
                
                <div className="border-t border-gray-200">
                  <button 
                    onClick={() => deleteMessage(index)}
                    className="px-4 py-3 w-full text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                  >
                    <div className="bg-red-50 p-1.5 rounded-full mr-3">
                      <FiTrash2 className="text-red-500" size={15} />
                    </div>
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Konten pesan */}
            <div 
              className="message-content whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content, msg.translatedContent) }}
            />
            
            {/* Timestamp untuk pesan */}
            <div className={`mt-1 text-xs ${msg.role === 'user' ? 'text-white text-opacity-70 text-right' : 'text-gray-500'}`}>
              {msg.role === 'assistant' ? 'AI' : 'Anda'} • Saat ini
              {markedMessages.has(index) && (
                <span className="ml-1 inline-flex items-center">
                  <FiStar className="text-yellow-400" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  if (isEmbedded) {
    return (
      <div className="flex flex-col h-full overflow-visible">
        <div className="bg-gradient-to-r from-primary via-primary to-primary-dark p-3 flex items-center justify-between text-white w-full navbar-no-radius"
          style={{ 
            borderRadius: '0px', 
            overflow: 'visible'
          }}
        >
          <div className="flex items-center">
            <FiMessageSquare className="mr-2" size={18} />
            <h2 className="text-base font-medium">AI Assistant Chat</h2>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-4" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23aaaaaa' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundColor: '#e6e0d4'
        }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FiMessageSquare size={60} className="mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-medium mb-2">Selamat datang di AI Assistant</h3>
                <p className="max-w-md">
                  Mulai percakapan dengan asisten AI untuk mendapatkan bantuan, jawaban pertanyaan, atau sekadar ngobrol.
                </p>
                <p className="text-sm mt-4">
                  Model: <span className="font-medium">Qwen 3</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {renderMessages()}
              {isLoading && (
                <div className="flex justify-center my-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <div className="border-t p-4 bg-white">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center shadow-sm animate-scaleIn">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <FiCornerDownLeft className="mr-1 flex-shrink-0" size={12} />
                  <span>Membalas pesan</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{replyingTo.content}</p>
              </div>
              <button 
                onClick={cancelReply}
                className="ml-auto flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-center">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiSmile size={20} />
            </button>
            
            <div className="relative flex-1 mx-2">
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-20 right-90 z-10 border border-gray-200 shadow-lg rounded-lg overflow-hidden animate-scaleIn"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMessage((prev) => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    searchPlaceHolder="Cari emoji..."
                    width={320}
                    height={350}
                    previewConfig={{
                      showPreview: false
                    }}
                  />
                </div>
              )}
              
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                className="w-full py-2 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className={`p-2 rounded-full ${
                isLoading || !message.trim() 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm'
              }`}
            >
              {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Tampilan default modal
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center p-4 bg-black bg-opacity-50 overflow-hidden`}>
      <div className="w-full max-w-3xl h-[90vh] bg-white overflow-hidden shadow-2xl flex flex-col animate-scaleIn navbar-no-radius" style={{ borderRadius: '0px' }}>
        {/* Header dengan penghapusan lengkungan yang eksplisit */}
        <div 
          className="bg-gradient-to-r from-primary via-primary to-primary-dark p-4 flex items-center justify-between text-white w-full navbar-no-radius" 
          style={{ 
            borderRadius: '0px', 
            overflow: 'visible'
          }}
        >
          <div className="flex items-center">
            <FiMessageSquare className="mr-2" size={20} />
            <h2 className="text-lg font-medium">AI Assistant Chat</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded focus:outline-none"
            aria-label="Tutup"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-grow overflow-y-auto p-4" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23aaaaaa' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundColor: '#e6e0d4'
        }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm max-w-xl">
                <FiMessageSquare size={60} className="mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-medium mb-2">Selamat datang di AI Assistant</h3>
                <p>
                  Mulai percakapan dengan asisten AI untuk mendapatkan bantuan, jawaban pertanyaan, atau sekadar ngobrol.
                </p>
                <p className="text-sm mt-4">
                  Model: <span className="font-medium">{getModelDisplayName(model)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {renderMessages()}
              {isLoading && (
                <div className="flex justify-center my-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t p-4">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center shadow-sm animate-scaleIn">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <FiCornerDownLeft className="mr-1 flex-shrink-0" size={12} />
                  <span>Membalas pesan</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{replyingTo.content}</p>
              </div>
              <button 
                onClick={cancelReply}
                className="ml-auto flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-center">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiSmile size={20} />
            </button>
            
            <div className="relative flex-1 mx-2">
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-20 right-90 z-10 border border-gray-200 shadow-lg rounded-lg overflow-hidden animate-scaleIn"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMessage((prev) => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    searchPlaceHolder="Cari emoji..."
                    width={320}
                    height={350}
                    previewConfig={{
                      showPreview: false
                    }}
                  />
                </div>
              )}
              
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan ke AI Assistant..."
                className="w-full py-2 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className={`p-2 rounded-full ${
                isLoading || !message.trim() 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm'
              }`}
            >
              {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
} 