'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FiLogOut, FiPlus, FiSearch, FiUser, FiPhone, FiEdit, FiMessageCircle, FiUsers, FiList, FiSettings, FiArrowLeft, FiMessageSquare, FiGlobe, FiLoader, FiImage, FiCornerDownRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import NewChatModal from './NewChatModal';
import ContactsScreen from './ContactsScreen';
import ProfileModal from './ProfileModal';
import { listenToUserProfile } from '@/lib/users';
import { StoriesContainer, CreateStoryModal, StoryViewer } from './Story';
import { uploadStory, listenToStories, markStoryAsViewed, deleteStory, updateStoryCaption, StoryUser } from '@/lib/stories';

type Chat = {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: any;
    senderId: string;
  };
  createdAt: any;
};

type SidebarProps = {
  user: User;
  chats: Chat[];
  loading: boolean;
  selectedChatId: string | null;
  setSelectedChat: (chatId: string) => void;
  onLogout: () => void;
  onContactSelect?: (contact: { name: string; phoneNumber: string }) => void;
  onOpenAIChat?: () => void;
  onOpenTranslateSettings?: () => void;
  onOpenAISettings?: () => void;
};

// Helper untuk memformat timestamp dengan cara yang aman
const safeFormatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'HH:mm', { locale: id });
    } else if (timestamp.seconds) {
      return format(new Date(timestamp.seconds * 1000), 'HH:mm', { locale: id });
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
  }
  
  return '';
};

export default function Sidebar({ 
  user, 
  chats, 
  loading, 
  selectedChatId, 
  setSelectedChat,
  onLogout,
  onContactSelect,
  onOpenAIChat,
  onOpenTranslateSettings,
  onOpenAISettings
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showContactsScreen, setShowContactsScreen] = useState(false);
  const [chatPartners, setChatPartners] = useState<{[key: string]: any}>({});
  const [view, setView] = useState<'chats' | 'story' | 'contacts'>('chats');
  const [showProfileModal, setShowProfileModal] = useState(false);
  // State untuk menyimpan data pengguna realtime
  const [currentUserData, setCurrentUserData] = useState<{
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    isOnline?: boolean;
  }>({});
  const [currentUserImageError, setCurrentUserImageError] = useState(false);
  const [partnerImageErrors, setPartnerImageErrors] = useState<{[key: string]: boolean}>({});
  // State untuk Story
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // State untuk melacak chat yang belum dibaca
  const [unreadChats, setUnreadChats] = useState<{[key: string]: number}>({});
  
  const router = useRouter();

  // Ambil informasi pengguna aktif secara realtime
  useEffect(() => {
    const unsubscribe = listenToUserProfile(user.uid, (userData) => {
      setCurrentUserData(userData);
    });
    
    return () => unsubscribe();
  }, [user.uid]);

  // Ambil informasi story secara realtime
  useEffect(() => {
    const unsubscribe = listenToStories((users) => {
      setStoryUsers(users);
    });
    
    return () => unsubscribe();
  }, []);

  // Ambil informasi pengguna untuk setiap chat
  useEffect(() => {
    const fetchChatPartners = async () => {
      const partners: {[key: string]: any} = {};
      const partnerIds: string[] = [];
      
      for (const chat of chats) {
        const partnerId = chat.participants.find(id => id !== user.uid);
        if (partnerId) {
          partnerIds.push(partnerId);
        }
      }
      
      // Langsung setup listeners realtime untuk semua partner
      const unsubscribers = partnerIds.map(partnerId => 
        onSnapshot(doc(db, 'users', partnerId), (userDoc) => {
          if (userDoc.exists()) {
            setChatPartners(prev => ({
              ...prev,
              [partnerId]: userDoc.data()
            }));
          } else {
            setChatPartners(prev => ({
              ...prev,
              [partnerId]: { displayName: 'Pengguna', email: partnerId }
            }));
          }
        })
      );
      
      // Return cleanup function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    };

    if (chats.length > 0) {
      const unsubscribePartners = fetchChatPartners();
      // Clean up listener
      return () => {
        unsubscribePartners.then(unsub => {
          if (unsub) unsub();
        });
      };
    } else {
      // Reset chatPartners saat tidak ada chat
      setChatPartners({});
    }
  }, [chats, user.uid]);

  // Dalam komponen Sidebar, tambahkan hooks untuk memperbarui timestamp saat pesan dibaca
  useEffect(() => {
    // Fungsi untuk menangani event ketika pesan dibaca
    const handleMessageRead = (event: CustomEvent) => {
      const { chatId } = event.detail;
      // Perbarui timestamp terakhir dibaca
      const currentTime = Date.now();
      localStorage.setItem(`lastRead_${chatId}`, currentTime.toString());
      
      // Hapus dari daftar unread
      setUnreadChats(prev => {
        if (!prev[chatId]) return prev;
        
        const updated = { ...prev };
        delete updated[chatId];
        
        // Simpan ke localStorage
        try {
          localStorage.setItem('unreadChats', JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving unread chats to localStorage:', error);
        }
        
        return updated;
      });
    };
    
    // Tambahkan event listener
    window.addEventListener('messageRead', handleMessageRead as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('messageRead', handleMessageRead as EventListener);
    };
  }, []);

  // Ubah mekanisme pendeteksi pesan yang belum dibaca
  useEffect(() => {
    // Buat fungsi untuk membaca unreadChats dari localStorage
    const loadUnreadChats = () => {
      try {
        const storedUnreadChats = localStorage.getItem('unreadChats');
        if (storedUnreadChats) {
          setUnreadChats(JSON.parse(storedUnreadChats));
        }
      } catch (error) {
        console.error('Error loading unread chats from localStorage:', error);
      }
    };
    
    // Muat unreadChats saat komponen dipasang
    loadUnreadChats();
    
    // Listen untuk perubahan pesan di setiap chat
    const unsubscribers = chats.map(chat => {
      const chatId = chat.id;
      
      return onSnapshot(
        query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'desc')
          // Hapus limit(10) karena membatasi jumlah pesan yang diperiksa
        ),
        (snapshot) => {
          // Hanya update jika chat ini bukan yang sedang aktif
          if (chatId !== selectedChatId) {
            const lastReadTimestamp = localStorage.getItem(`lastRead_${chatId}`);
            
            // Jika tidak ada timestamp terakhir dibaca, set timestamp saat ini untuk semua chat
            // Ini mencegah notifikasi saat aplikasi pertama kali dibuka
            if (!lastReadTimestamp) {
              localStorage.setItem(`lastRead_${chatId}`, Date.now().toString());
              return; // Tidak perlu memeriksa pesan karena kita tandai semuanya sebagai dibaca
            }
            
            let unreadCount = 0;
            
            snapshot.docChanges().forEach(change => {
              // Hanya perhatikan pesan yang baru ditambahkan
              if (change.type === 'added') {
                const message = change.doc.data();
                
                // Hanya hitung pesan dari pengguna lain
                if (message.senderId !== user.uid) {
                  // Jika ada timestamp terakhir dibaca, bandingkan
                  const lastReadTime = parseInt(lastReadTimestamp, 10);
                  const messageTime = message.timestamp?.seconds 
                    ? message.timestamp.seconds * 1000 
                    : message.timestamp?.toMillis 
                      ? message.timestamp.toMillis() 
                      : Date.now();
                  
                  // Jika pesan lebih baru dari terakhir dibaca, tandai sebagai belum dibaca
                  if (messageTime > lastReadTime) {
                    unreadCount++;
                  }
                }
              }
            });
            
            // Jika ada perubahan dalam pesan yang belum dibaca
            if (unreadCount > 0) {
              setUnreadChats(prev => {
                const updated = { ...prev, [chatId]: unreadCount };
                
                // Simpan ke localStorage
                try {
                  localStorage.setItem('unreadChats', JSON.stringify(updated));
                } catch (error) {
                  console.error('Error saving unread chats to localStorage:', error);
                }
                
                return updated;
              });
            } else {
              // Jika tidak ada pesan yang belum dibaca, pastikan chat dihapus dari unreadChats
              setUnreadChats(prev => {
                if (!prev[chatId]) return prev;
                
                const updated = { ...prev };
                delete updated[chatId];
                
                // Simpan ke localStorage
                try {
                  localStorage.setItem('unreadChats', JSON.stringify(updated));
                } catch (error) {
                  console.error('Error saving unread chats to localStorage:', error);
                }
                
                return updated;
              });
            }
          }
        }
      );
    });
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [chats, user.uid, selectedChatId]);

  // Perbaiki useEffect untuk memperbarui timestamp saat chat dipilih
  useEffect(() => {
    if (selectedChatId) {
      // Simpan timestamp terakhir dibaca
      const currentTime = Date.now();
      localStorage.setItem(`lastRead_${selectedChatId}`, currentTime.toString());
      
      // Dispatch event untuk memberi tahu komponen lain
      const event = new CustomEvent('messageRead', { 
        detail: { chatId: selectedChatId }
      });
      window.dispatchEvent(event);
      
      // Hapus dari daftar unread
      if (unreadChats[selectedChatId]) {
        setUnreadChats(prev => {
          const updated = { ...prev };
          delete updated[selectedChatId];
          
          // Simpan ke localStorage
          try {
            localStorage.setItem('unreadChats', JSON.stringify(updated));
          } catch (error) {
            console.error('Error saving unread chats to localStorage:', error);
          }
          
          return updated;
        });
      }
    }
  }, [selectedChatId, unreadChats]);

  const filteredChats = chats.filter(chat => {
    // Implementasi pencarian sederhana
    if (!searchTerm) return true;
    
    const partnerId = chat.participants.find(id => id !== user.uid);
    const partner = partnerId ? chatPartners[partnerId] : null;
    const partnerName = partner?.displayName?.toLowerCase() || '';
    
    // Cari berdasarkan nama kontak atau isi pesan
    return partnerName.includes(searchTerm.toLowerCase()) || 
           chat.lastMessage?.text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Urutkan chat berdasarkan nama kontak jika ada pencarian
  const sortedFilteredChats = [...filteredChats].sort((a, b) => {
    if (searchTerm) {
      // Jika ada pencarian, urutkan berdasarkan nama
      const partnerIdA = a.participants.find(id => id !== user.uid);
      const partnerA = partnerIdA ? chatPartners[partnerIdA] : null;
      const partnerNameA = partnerA?.displayName?.toLowerCase() || '';
      
      const partnerIdB = b.participants.find(id => id !== user.uid);
      const partnerB = partnerIdB ? chatPartners[partnerIdB] : null;
      const partnerNameB = partnerB?.displayName?.toLowerCase() || '';
      
      return partnerNameA.localeCompare(partnerNameB);
    } else {
      // Jika tidak ada pencarian, gunakan urutan default berdasarkan waktu pesan terakhir (terbaru di atas)
      const timestampA = a.lastMessage?.timestamp || a.createdAt;
      const timestampB = b.lastMessage?.timestamp || b.createdAt;
      
      // Fungsi untuk mendapatkan ms dari timestamp
      const getMs = (timestamp: any) => {
        if (!timestamp) return 0;
        if (timestamp.toMillis) return timestamp.toMillis();
        if (timestamp.seconds) return timestamp.seconds * 1000;
        return 0;
      };
      
      return getMs(timestampB) - getMs(timestampA);
    }
  });

  const handleCreateNewChat = async (selectedUserId: string) => {
    try {
      // Periksa apakah chat sudah ada
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const existingChats = await getDocs(existingChatQuery);
      
      let existingChatId = null;
      existingChats.forEach(doc => {
        const chatData = doc.data();
        if (chatData.participants.includes(selectedUserId)) {
          existingChatId = doc.id;
        }
      });
      
      if (existingChatId) {
        // Jika chat sudah ada, pilih yang sudah ada
        setSelectedChat(existingChatId);
      } else {
        // Jika belum, buat chat baru
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, selectedUserId],
          createdAt: serverTimestamp(),
        });
        
        setSelectedChat(newChatRef.id);
      }
      
      // Tutup modal
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Gagal membuat chat baru. Silakan coba lagi.');
    }
  };

  // Menampilkan kontak yang dipilih dari modal kontak
  const handleContactSelect = async (contact: { name: string, phoneNumber: string }) => {
    console.log('Kontak dipilih:', contact);
    
    if (onContactSelect) {
      onContactSelect(contact);
    } else {
      // Coba cari pengguna dengan nomor telepon yang sama
      const q = query(
        collection(db, 'users'),
        where('phoneNumber', '==', contact.phoneNumber)
      );
      
      const userSnapshot = await getDocs(q);
      
      if (!userSnapshot.empty) {
        const selectedUserId = userSnapshot.docs[0].id;
        await handleCreateNewChat(selectedUserId);
      } else {
        // Handle jika kontak tidak terdaftar
        alert('Pengguna belum terdaftar di Hallo. Ajak mereka untuk menginstal aplikasi ini!');
      }
    }
    
    setShowContactsScreen(false);
  };

  // Buka modal profil
  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
  };

  const handleAddStory = () => {
    setShowCreateStoryModal(true);
  };

  const handleSubmitStory = async (file: File, caption: string) => {
    try {
      setIsUploadingStory(true);
      await uploadStory(user.uid, file, caption);
      setShowCreateStoryModal(false);
    } catch (error) {
      console.error('Error uploading story:', error);
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    console.log("Sidebar: Attempting to delete story with ID:", storyId);
    try {
      await deleteStory(storyId);
      console.log("Sidebar: Story deleted successfully");
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const handleUpdateCaption = async (storyId: string, caption: string) => {
    try {
      await updateStoryCaption(storyId, caption);
    } catch (error) {
      console.error('Error updating story caption:', error);
    }
  };

  const handleViewStory = async (storyId: string) => {
    try {
      await markStoryAsViewed(user.uid, storyId);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-primary shadow-md flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleOpenProfileModal} 
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors"
          >
            {currentUserData?.photoURL && !currentUserImageError ? (
              <img 
                src={currentUserData.photoURL} 
                alt={currentUserData?.displayName || 'User Avatar'} 
                className="w-9 h-9 rounded-full object-cover"
                onError={() => setCurrentUserImageError(true)}
              />
            ) : (
              <span className="text-white font-medium">
                {(currentUserData?.displayName || user.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${currentUserData?.isOnline ? 'bg-green-400' : 'bg-gray-400'} border-2 border-primary`}></span>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium truncate">
              {currentUserData?.displayName || user.email?.split('@')[0] || 'User'}
            </h2>
          </div>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={onOpenAIChat}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Chat dengan AI"
          >
            <FiMessageSquare size={20} />
          </button>
          <button 
            onClick={onOpenTranslateSettings}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Pengaturan Terjemahan"
          >
            <FiGlobe size={20} />
          </button>
          <button 
            onClick={onOpenAISettings}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Pengaturan AI"
          >
            <FiSettings size={20} />
          </button>
          <button 
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Keluar"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 pt-3 pb-2 flex border-b border-gray-200">
        <button 
          onClick={() => setView('chats')}
          className={`flex-1 py-2 px-3 rounded-xl font-medium flex justify-center items-center transition-colors ${
            view === 'chats' 
            ? 'bg-primary text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiMessageCircle className={`mr-1 ${view === 'chats' ? 'text-white' : 'text-primary'}`} />
          Pesan
        </button>
        <button 
          onClick={() => setView('story')}
          className={`flex-1 py-2 px-3 rounded-xl font-medium flex justify-center items-center transition-colors ${
            view === 'story' 
            ? 'bg-primary text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiImage className={`mr-1 ${view === 'story' ? 'text-white' : 'text-primary'}`} />
          Story
        </button>
        <button 
          onClick={() => setView('contacts')}
          className={`flex-1 py-2 px-3 rounded-xl font-medium flex justify-center items-center transition-colors ${
            view === 'contacts' 
            ? 'bg-primary text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiUsers className={`mr-1 ${view === 'contacts' ? 'text-white' : 'text-primary'}`} />
          Kontak
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative w-full">
          <input
            type="text"
            className="w-full bg-gray-100 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
            placeholder={view === 'chats' ? 'Cari percakapan...' : view === 'contacts' ? 'Cari kontak...' : 'Cari story...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Content based on view */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {view === 'chats' && (
          <>
            {/* Chats list */}
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : sortedFilteredChats.length > 0 ? (
              <div className="space-y-1 p-2">
                {sortedFilteredChats.map(chat => {
                  const partnerId = chat.participants.find(id => id !== user.uid);
                  const partner = partnerId ? chatPartners[partnerId] : null;
                  const partnerName = partner?.displayName || 'Pengguna';
                  const imageError = partnerId ? partnerImageErrors[partnerId] : false;
                  const unreadCount = unreadChats[chat.id] || 0;
                  const isUnread = unreadCount > 0;
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`w-full flex items-center p-2 hover:bg-gray-100 rounded-xl transition-colors 
                        ${selectedChatId === chat.id ? 'bg-primary/10' : ''}
                        ${isUnread ? 'unread-chat-notification' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white">
                          {partner?.photoURL && !imageError ? (
                            <img 
                              src={partner.photoURL} 
                              alt={partnerName} 
                              className="w-full h-full object-cover"
                              onError={() => {
                                setPartnerImageErrors(prev => ({...prev, [partnerId!]: true}));
                              }}
                            />
                          ) : (
                            <span className="text-lg font-medium">{partnerName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        {partner?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0 text-left">
                        <div className="flex justify-between">
                          <h3 className={`font-medium truncate ${isUnread ? 'text-primary font-semibold' : 'text-gray-900'}`}>
                            {partnerName}
                          </h3>
                          {chat.lastMessage?.timestamp && (
                            <span className={`text-xs ${isUnread ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                              {safeFormatTimestamp(chat.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {chat.lastMessage ? (
                            chat.lastMessage.senderId === user.uid ? (
                              <span className="flex items-center">
                                <FiCornerDownRight className="mr-1 text-primary flex-shrink-0" size={12} />
                                {chat.lastMessage.text}
                              </span>
                            ) : (
                              chat.lastMessage.text
                            )
                          ) : (
                            <span className="italic text-gray-400">Belum ada pesan</span>
                          )}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="ml-2 min-w-[20px] h-5 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium px-1.5">
                          {unreadCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiMessageSquare className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Belum ada chat</h3>
                <p className="text-gray-500 text-sm mb-4">Mulai percakapan baru dengan kontak Anda</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 bg-primary hover:bg-dark text-white rounded-xl transition-colors shadow-md"
                >
                  Mulai Chat Baru
                </button>
              </div>
            )}
            
            {/* Floating action button */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary hover:bg-dark text-white shadow-lg flex items-center justify-center transition-colors"
            >
              <FiPlus size={24} />
            </button>
          </>
        )}
        
        {view === 'story' && (
          <StoriesContainer 
            users={storyUsers} 
            currentUserId={user.uid}
            onAddStory={handleAddStory} 
            onStoryView={(storyId: string) => {
              if (storyId) {
                // Handle story view logic
                return handleViewStory(storyId);
              }
              return Promise.resolve();
            }}
          />
        )}
        
        {view === 'contacts' && (
          <ContactsScreen 
            user={user} 
            onContactSelect={handleContactSelect}
          />
        )}
      </div>
      
      {/* Modals */}
      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)} 
          onCreateChat={handleCreateNewChat}
          currentUserId={user.uid}
        />
      )}
      
      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
      
      {showCreateStoryModal && (
        <CreateStoryModal
          isOpen={true}
          onClose={() => setShowCreateStoryModal(false)}
          onSubmit={handleSubmitStory}
          isLoading={isUploadingStory}
        />
      )}
      
      {isViewerOpen && (
        <StoryViewer
          users={storyUsers}
          initialUserIndex={selectedUserIndex}
          isOpen={true}
          onClose={() => setIsViewerOpen(false)}
          currentUserId={user.uid}
          onStoryDelete={handleDeleteStory}
          onCaptionUpdate={handleUpdateCaption}
          onStoryView={handleViewStory}
        />
      )}
    </div>
  );
} 