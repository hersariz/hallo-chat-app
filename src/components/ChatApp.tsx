'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { setUserOffline } from '@/lib/users';
import { useRouter } from 'next/navigation';
import AIChatModal from './AIChatModal';
import TranslateSettingsModal from './TranslateSettingsModal';
import AISettingsModal from './AISettingsModal';
import { AIConfig } from '@/lib/types';
import { getAIConfig, saveAIConfig, DEFAULT_AI_CONFIG } from '@/lib/ai-config';
import { FiArrowLeft } from 'react-icons/fi';
import { FiMessageSquare } from 'react-icons/fi';
import { getModelDisplayName } from '@/lib/qwen';
import { useAIConfig } from '@/lib/context';
import NewChatModal from './NewChatModal';
import IncomingCallModal from './IncomingCallModal';
import VideoCallModal from './VideoCallModal';

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

export default function ChatApp({ user }: { user: User }) {
  const { aiConfig, updateAIConfig } = useAIConfig();
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [usingContact, setUsingContact] = useState(false);
  const [currentContact, setCurrentContact] = useState<{name: string, phoneNumber: string} | null>(null);
  const router = useRouter();
  
  // State untuk modal AI
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [showTranslateSettingsModal, setShowTranslateSettingsModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  // Tambahkan state untuk AI chat di main window
  const [isAIChatActive, setIsAIChatActive] = useState(false);
  
  const [showIncomingCallModal, setShowIncomingCallModal] = useState<boolean>(false);
  const [incomingCallId, setIncomingCallId] = useState<string | null>(null);
  const [incomingCallChatId, setIncomingCallChatId] = useState<string | null>(null);
  const [showVideoCallModal, setShowVideoCallModal] = useState<boolean>(false);
  const [showAudioCallModal, setShowAudioCallModal] = useState<boolean>(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingChats(true);
        // Build a simple query without orderBy to avoid requiring indexes
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        
        // Setup realtime listener for chat updates
        const unsubscribe = onSnapshot(chatsQuery, 
          (snapshot) => {
            const chatsData: Chat[] = [];
            snapshot.forEach((doc) => {
              chatsData.push({
                id: doc.id,
                ...doc.data()
              } as Chat);
            });
            
            // Sort chats manually by updatedAt (most recent first)
            chatsData.sort((a, b) => {
              const aTime = a.lastMessage?.timestamp || a.createdAt;
              const bTime = b.lastMessage?.timestamp || b.createdAt;
              
              if (!aTime) return 1;  // null timestamps at the end
              if (!bTime) return -1;
              
              // Handle Firestore timestamps
              const aMillis = aTime.seconds ? (aTime.seconds * 1000) : 0;
              const bMillis = bTime.seconds ? (bTime.seconds * 1000) : 0;
              
              return bMillis - aMillis;  // descending order (newest first)
            });
            
            setChatList(chatsData);
            setLoadingChats(false);
          },
          (error) => {
            console.error('Error in chat listener:', error);
            setLoadingChats(false);
          }
        );
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up chat listener:', error);
        setLoadingChats(false);
      }
    };

    const unsubscribe = fetchChats();
    
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => {
          if (unsub) unsub();
        });
      }
    };
  }, [user.uid]);

  useEffect(() => {
    if (!user.uid) return;
    
    // Fungsi untuk memeriksa panggilan masuk dari Firestore
    const listenForIncomingCalls = () => {
      // Setup query untuk panggilan masuk
      const callsQuery = query(
        collection(db, 'calls'),
        where('recipientId', '==', user.uid),
        where('status', '==', 'ringing')
      );
      
      // Gunakan onSnapshot untuk mendapatkan update real-time
      const unsubscribe = onSnapshot(callsQuery, async (snapshot) => {
        try {
          // Jika sudah ada modal panggilan aktif, tolak panggilan baru secara otomatis
          if (showIncomingCallModal || showVideoCallModal || showAudioCallModal) {
            // Check for any new calls while a call is in progress
            const newCalls = snapshot.docs
              .filter(doc => {
                const callData = doc.data();
                // Hanya proses panggilan yang <30 detik
                return new Date().getTime() - new Date(callData.startedAt).getTime() < 30000;
              });
            
            // Tolak secara otomatis panggilan baru saat sudah ada panggilan aktif
            newCalls.forEach(async (doc) => {
              if (doc.id !== incomingCallId) {
                console.log('Call already in progress, automatically declining new call:', doc.id);
                await updateDoc(doc.ref, {
                  status: 'declined',
                  endedAt: new Date().toISOString()
                });
              }
            });
            
            return;
          }
          
          // Filter panggilan yang masih baru (kurang dari 30 detik)
          const incomingCalls = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() as any }))
            .filter(call => 
              new Date().getTime() - new Date(call.startedAt).getTime() < 30000
            );
          
          // Jika ada panggilan masuk, tampilkan modal
          if (incomingCalls.length > 0) {
            const latestCall = incomingCalls[0];
            
            // Tampilkan modal panggilan masuk
            setIncomingCallId(latestCall.id);
            setIncomingCallChatId(latestCall.chatId);
            setShowIncomingCallModal(true);
            
            // Mainkan suara notifikasi panggilan masuk
            try {
              // Gunakan file audio statis dari folder public
              const ringtoneSrc = '/sounds/ringtone.mp3';
              
              // Buat dan konfigurasi audio
              const audio = new Audio(ringtoneSrc);
              audio.volume = 0.7;
              audio.load();
              
              let audioPlayed = false;
              
              // Fungsi untuk memainkan audio
              const playAudio = () => {
                if (audioPlayed) return;
                
                // Coba putar dengan timeout
                setTimeout(() => {
                  audio.play().then(() => {
                    audioPlayed = true;
                    console.log('Notification sound playing successfully');
                  }).catch(err => {
                    console.error('Error playing notification:', err);
                    
                    // Jalankan audio dengan user interaction jika gagal autoplay
                    const playOnce = function() {
                      if (!audioPlayed) {
                        audio.play().then(() => {
                          audioPlayed = true;
                          console.log('Notification sound playing on user interaction');
                        }).catch(e => {
                          console.warn('Still cannot play audio:', e);
                          // Final fallback - beep jika didukung
                          try {
                            if (window.HTMLAudioElement) {
                              console.log('Trying window.beep as last resort');
                              // @ts-ignore
                              window.beep && window.beep();
                            }
                          } catch (err) {
                            console.error('All audio playback methods failed');
                          }
                        });
                      }
                      document.removeEventListener('click', playOnce);
                      document.removeEventListener('touchstart', playOnce);
                    };
                    
                    document.addEventListener('click', playOnce, { once: true });
                    document.addEventListener('touchstart', playOnce, { once: true });
                  });
                }, 100); // Delay lebih lama (100ms)
              };
              
              // Coba putar audio tanpa delay
              playAudio();
            }
            catch (error) {
              console.error('Error with notification sound:', error);
            }
          } else if (incomingCallId && showIncomingCallModal) {
            // Jika tidak ada panggilan masuk tapi modal masih terbuka, tutup modal
            setShowIncomingCallModal(false);
            setIncomingCallId(null);
            setIncomingCallChatId(null);
          }
          
          // Bersihkan panggilan yang sudah terlalu lama (lebih dari 30 detik masih 'ringing')
          const expiredCallsQuery = query(
            collection(db, 'calls'),
            where('recipientId', '==', user.uid),
            where('status', '==', 'ringing')
          );
          
          const expiredCallsSnapshot = await getDocs(expiredCallsQuery);
          
          expiredCallsSnapshot.docs.forEach(async (doc) => {
            const callData = doc.data();
            if (new Date().getTime() - new Date(callData.startedAt).getTime() >= 30000) {
              await updateDoc(doc.ref, {
                status: 'missed',
                endedAt: new Date().toISOString()
              });
            }
          });
        } catch (error) {
          console.error('Error handling incoming calls:', error);
        }
      });
      
      // Return unsubscribe function
      return unsubscribe;
    };
    
    const unsubscribeCalls = listenForIncomingCalls();
    
    return () => {
      if (unsubscribeCalls) {
        unsubscribeCalls();
      }
    };
  }, [user.uid, showIncomingCallModal, showVideoCallModal, showAudioCallModal, incomingCallId]);

  const handleLogout = async () => {
    try {
      // Set user offline status
      await setUserOffline(user.uid);
      // Then sign out
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      }
    };

    handleResize(); // Initialize on mount
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fungsi untuk memulai chat baru dengan kontak
  const handleContactSelect = async (contact: { name: string; phoneNumber: string }) => {
    try {
      // Cari user dengan nomor telepon yang sama
      const usersQuery = query(
        collection(db, 'users'),
        where('phoneNumber', '==', contact.phoneNumber)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        // Jika ada user dengan nomor telepon yang sama
        const userId = usersSnapshot.docs[0].id;
        
        // Cek apakah sudah ada chat dengan user tersebut
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        
        const chatsSnapshot = await getDocs(chatsQuery);
        let existingChatId = null;
        
        chatsSnapshot.forEach((doc) => {
          const chatData = doc.data();
          if (chatData.participants.includes(userId)) {
            existingChatId = doc.id;
          }
        });
        
        if (existingChatId) {
          // Jika chat sudah ada, buka chat tersebut
          setSelectedChat(existingChatId);
          setUsingContact(false);
          setCurrentContact(null);
        } else {
          // Jika belum ada chat, buat chat baru
          const newChatRef = await addDoc(collection(db, 'chats'), {
            participants: [user.uid, userId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          setSelectedChat(newChatRef.id);
          setUsingContact(false);
          setCurrentContact(null);
        }
      } else {
        // Jika tidak ada user dengan nomor telepon yang sama
        // Gunakan kontak langsung
        setUsingContact(true);
        setCurrentContact(contact);
        setSelectedChat(null);
      }
      
      if (isMobileView) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error starting chat with contact:', error);
    }
  };

  // Fungsi untuk menyimpan pengaturan AI
  const handleSaveAIConfig = async (config: AIConfig) => {
    try {
      updateAIConfig(config);
      
      // Simpan juga ke firestore untuk backup
      await saveAIConfig(user.uid, config);
    } catch (error) {
      console.error('Error saving AI config:', error);
    }
  };
  
  // Handle AI Chat dari sidebar
  const handleAIChatSelect = () => {
    // Nonaktifkan chat yang dipilih
    setSelectedChat(null);
    setIsAIChatActive(true);
    if (isMobileView) {
      setShowSidebar(false);
    }
  };

  const handleAcceptCall = (callId: string, isVideoCall: boolean) => {
    console.log('Accepting call:', callId);
    
    // Simpan ID panggilan masuk terlebih dahulu, lalu baru tutup modal
    setIncomingCallId(callId);
    
    // Set tipe panggilan berdasarkan jenis panggilan yang diterima
    setCallType(isVideoCall ? 'video' : 'audio');
    
    // Tutup modal panggilan masuk
    setShowIncomingCallModal(false);
    
    // Berikan delay kecil sebelum membuka VideoCallModal
    // untuk memastikan IncomingCallModal sudah benar-benar tertutup
    setTimeout(() => {
      // Handle panggilan dengan timer yang lebih tepat
      const openVideoCallModal = () => {
        console.log('Opening VideoCallModal for call:', callId);
        
        // Pastikan bahwa ketika kita membuka VideoCallModal, itu tidak langsung tertutup
        setShowVideoCallModal(true);
      };
      
      // Jika panggilan berasal dari chat yang sedang aktif
      if (incomingCallChatId === selectedChat) {
        // Gunakan timer untuk memastikan status chat sudah diupdate
        setTimeout(openVideoCallModal, 300);
      } else {
        // Jika dari chat lain, pindah ke chat tersebut dulu, lalu buka modal
        setSelectedChat(incomingCallChatId);
        
        // Gunakan timeout yang lebih lama untuk memastikan UI sudah diupdate sepenuhnya
        setTimeout(openVideoCallModal, 700);
      }
    }, 300); // Tambahkan delay lebih lama untuk memastikan state sudah diupdate
  };
  
  const handleRejectCall = async () => {
    console.log('Rejecting call:', incomingCallId);
    
    // Jika ada ID panggilan, update status di Firestore
    if (incomingCallId) {
      try {
        await updateDoc(doc(db, 'calls', incomingCallId), {
          status: 'declined',
          endedAt: new Date().toISOString() // Gunakan nilai klien untuk respons lebih cepat
        });
        console.log('Call declined successfully');
      } catch (error) {
        console.error('Error declining call:', error);
      }
    }
    
    // Tutup modal dan reset state
    setShowIncomingCallModal(false);
    
    // Delay sedikit reset state untuk mencegah race condition
    setTimeout(() => {
      setIncomingCallId(null);
      setIncomingCallChatId(null);
    }, 300);
  };
  
  // Handler untuk menutup modal video call
  const handleVideoCallClose = () => {
    console.log('Video call modal closed');
    setShowVideoCallModal(false);
    
    // Delay singkat untuk memastikan tidak ada race condition
    setTimeout(() => {
      setIncomingCallId(null);
      setIncomingCallChatId(null);
    }, 300);
  };

  // Simpan data user saat login ke localStorage
  useEffect(() => {
    // Simpan data user ke localStorage untuk penggunaan offline
    if (user && user.uid) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna',
        photoURL: user.photoURL || null,
        lastSeen: new Date().toISOString(),
        isOnline: true
      };
      
      const users = JSON.parse(localStorage.getItem('hallo_users') || '{}');
      users[user.uid] = userData;
      localStorage.setItem('hallo_users', JSON.stringify(users));
    }
  }, [user]);

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 w-64 h-64 bg-light/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content container */}
      <div className="flex w-full h-full z-10">
        {/* Mobile back button */}
        {isMobileView && selectedChat && !showSidebar && (
          <button 
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <FiArrowLeft size={24} className="text-primary" />
          </button>
        )}

        {/* Sidebar */}
        {(showSidebar || !selectedChat) && (
          <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-white/90 backdrop-blur-md z-20 shadow-xl animate-slideIn overflow-hidden">
            <Sidebar 
              user={user}
              chats={chatList}
              loading={loadingChats}
              selectedChatId={selectedChat}
              setSelectedChat={(chatId) => {
                setSelectedChat(chatId);
                if (isMobileView) {
                  setShowSidebar(false);
                }
              }}
              onLogout={handleLogout}
              onContactSelect={handleContactSelect}
              onOpenAIChat={handleAIChatSelect}
              onOpenTranslateSettings={() => setShowTranslateSettingsModal(true)}
              onOpenAISettings={() => setShowAISettingsModal(true)}
            />
          </div>
        )}

        {/* Chat Window or Empty State */}
        <div className={`${showSidebar && !isMobileView ? 'w-2/3 lg:w-3/4' : 'w-full'} h-full relative ${!selectedChat && !isMobileView ? 'flex items-center justify-center' : ''}`}>
          {selectedChat ? (
            <div className="w-full h-full bg-white/80 backdrop-blur-md shadow-lg no-border-radius overflow-hidden">
              <ChatWindow 
                user={user} 
                chatId={selectedChat}
                onBackClick={isMobileView ? toggleSidebar : undefined}
              />
            </div>
          ) : isAIChatActive ? (
            <div className="w-full h-full bg-white/80 backdrop-blur-md shadow-lg no-border-radius overflow-hidden">
              <AIChatModal 
                isOpen={true}
                onClose={() => setIsAIChatActive(false)}
                customInstructions={aiConfig.customInstructions}
                model={aiConfig.model}
                defaultLanguage={aiConfig.defaultLanguage}
                isEmbedded={true}
              />
            </div>
          ) : usingContact && currentContact ? (
            <div className="w-full h-full bg-white/80 backdrop-blur-md shadow-lg no-border-radius overflow-hidden">
              <ChatWindow 
                user={user} 
                chatId={null}
                onBackClick={isMobileView ? toggleSidebar : undefined}
                contact={currentContact}
                usingContact={true}
              />
            </div>
          ) : (
            !isMobileView && (
              <div className="p-8 text-center bg-white/60 backdrop-blur-md no-border-radius shadow-xl max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center">
                  <FiMessageSquare className="text-3xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-4">Selamat Datang di Hallo</h2>
                <p className="text-gray-600 mb-6">
                  Pilih chat di samping atau mulai percakapan baru untuk memulai.
                </p>
                <button 
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 bg-primary hover:bg-dark text-white font-medium rounded-xl transition-colors shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                >
                  Mulai Chat Baru
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {showAIChatModal && (
        <AIChatModal 
          isOpen={true}
          onClose={() => setShowAIChatModal(false)}
          customInstructions={aiConfig.customInstructions}
          model={aiConfig.model}
          defaultLanguage={aiConfig.defaultLanguage}
        />
      )}

      {showTranslateSettingsModal && (
        <TranslateSettingsModal 
          isOpen={true}
          onClose={() => setShowTranslateSettingsModal(false)}
        />
      )}

      {showAISettingsModal && (
        <AISettingsModal 
          isOpen={true}
          onClose={() => setShowAISettingsModal(false)}
          config={aiConfig}
          onSave={handleSaveAIConfig}
        />
      )}
      
      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)} 
          onCreateChat={(userId) => {
            handleContactSelect({ name: "", phoneNumber: userId });
            setShowNewChatModal(false);
          }}
          currentUserId={user.uid}
        />
      )}

      {/* Modal panggilan video */}
      {showVideoCallModal && incomingCallId && (
        <VideoCallModal
          isOpen={showVideoCallModal}
          onClose={handleVideoCallClose}
          user={user}
          chatId={selectedChat || ''}
          recipientId={selectedChat ? 
            // Temukan ID penerima dari chat saat ini (bukan penelepon)
            chatList.find(c => c.id === selectedChat)?.participants.find(p => p !== user.uid) || '' : 
            ''
          }
          isVideoCall={callType === 'video'}
          incomingCallId={incomingCallId}
        />
      )}
      
      {/* Modal panggilan masuk */}
      {showIncomingCallModal && incomingCallId && (
        <IncomingCallModal
          isOpen={showIncomingCallModal}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          user={user}
          callId={incomingCallId}
        />
      )}
    </div>
  );
} 