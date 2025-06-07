'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Howl } from 'howler';

type IncomingCallModalProps = {
  isOpen: boolean;
  onAccept: (callId: string, isVideoCall: boolean) => void;
  onReject: () => void;
  user: User;
  callId: string;
};

// Helper untuk mengupdate status panggilan di Firestore
const updateCallStatus = async (callId: string, status: string) => {
  try {
    await updateDoc(doc(db, 'calls', callId), {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'ended' || status === 'declined' ? { endedAt: new Date().toISOString() } : {})
    });
    return true;
  } catch (error) {
    console.error('Error updating call status in Firestore:', error);
    return false;
  }
};

// Gunakan file ringtone statis dari folder public
const RINGTONE_FILE_PATH = '/sounds/ringtone.mp3';

export default function IncomingCallModal({
  isOpen,
  onAccept,
  onReject,
  user,
  callId
}: IncomingCallModalProps) {
  const [callerName, setCallerName] = useState<string>('');
  const [isVideoCall, setIsVideoCall] = useState<boolean>(false);
  const [callRinging, setCallRinging] = useState<boolean>(true);
  const ringtoneRef = useRef<Howl | null>(null);
  const audioFallbackRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef<boolean>(false);
  const hasActionTakenRef = useRef<boolean>(false);
  const actionInProgressRef = useRef<boolean>(false);
  
  // Reset state ketika modal terbuka (untuk panggilan baru)
  useEffect(() => {
    if (isOpen) {
      console.log('IncomingCallModal opened, resetting state');
      hasActionTakenRef.current = false;
      actionInProgressRef.current = false;
    } else {
      // Tandai tidak aktif saat ditutup
      mountedRef.current = false;
    }
  }, [isOpen]);
  
  // Membunyikan nada dering
  useEffect(() => {
    // Tandai component mounted
    mountedRef.current = true;
    
    // Fungsi untuk membersihkan audio
    const cleanupAudio = () => {
      // Bersihkan Howler
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current.unload();
        ringtoneRef.current = null;
      }
      
      // Bersihkan audio fallback
      if (audioFallbackRef.current) {
        audioFallbackRef.current.pause();
        audioFallbackRef.current.src = '';
        audioFallbackRef.current = null;
      }
    };
    
    // Hanya putar ringtone jika modal terbuka dan belum mengambil tindakan
    if (isOpen && callRinging && !hasActionTakenRef.current) {
      try {
        // Bersihkan dulu audio lama jika ada
        cleanupAudio();
        
        // Coba mainkan dengan Howler
        const sound = new Howl({
          src: [RINGTONE_FILE_PATH],
          autoplay: false,
          loop: true,
          volume: 0.7,
          html5: true,
          preload: true,
          format: ['mp3', 'wav'],
          onloaderror: function(id, err) {
            console.error('Error loading ringtone:', err);
            playFallbackAudio();
          }
        });
        
        // Simpan referensi
        ringtoneRef.current = sound;
        
        // Coba mainkan
        try {
          sound.play();
          console.log('Playing ringtone with Howler');
        } catch (playError) {
          console.error('Error playing ringtone with Howler:', playError);
          playFallbackAudio();
        }
      } catch (error) {
        console.error('Error setting up ringtone:', error);
        playFallbackAudio();
      }
    }
    
    // Fallback ke Audio API jika Howler gagal
    function playFallbackAudio() {
      try {
        const audio = new Audio(RINGTONE_FILE_PATH);
        audio.loop = true;
        audio.volume = 0.7;
        
        audioFallbackRef.current = audio;
        
        // Coba mainkan dengan penanganan error
        audio.play().catch((e) => {
          console.log('Fallback audio autoplay failed:', e);
          
          // Butuh interaksi pengguna - tambahkan event listeners
          const playOnUserInteraction = () => {
            if (audioFallbackRef.current && mountedRef.current) {
              audioFallbackRef.current.play().catch(e => 
                console.error('Still failed to play audio after interaction:', e)
              );
            }
            
            // Hapus listener setelah berhasil
            document.removeEventListener('click', playOnUserInteraction);
            document.removeEventListener('touchstart', playOnUserInteraction);
          };
          
          document.addEventListener('click', playOnUserInteraction, { once: true });
          document.addEventListener('touchstart', playOnUserInteraction, { once: true });
        });
      } catch (audioError) {
        console.error('All audio playback attempts failed:', audioError);
      }
    }
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      cleanupAudio();
    };
  }, [isOpen, callRinging]);
  
  // Mendapatkan informasi panggilan dan setup listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const fetchCallInfo = async () => {
      if (!callId || !isOpen) return;
      
      try {
        console.log('Setting up call listener for ID:', callId);
        
        // Setup real-time listener untuk dokumen panggilan
        unsubscribe = onSnapshot(doc(db, 'calls', callId), async (docSnapshot) => {
          if (!mountedRef.current) return;
          
          if (!docSnapshot.exists()) {
            console.log('Call document not found');
            setCallRinging(false);
            hasActionTakenRef.current = true;
            onReject();
            return;
          }
          
          const callData = docSnapshot.data();
          setIsVideoCall(callData.type === 'video');
          
          // Periksa status panggilan
          if (callData.status === 'ended' || callData.status === 'declined') {
            console.log('Call ended remotely');
            setCallRinging(false);
            hasActionTakenRef.current = true;
            
            // Hentikan ringtone
            if (ringtoneRef.current) {
              ringtoneRef.current.stop();
            }
            
            if (audioFallbackRef.current) {
              audioFallbackRef.current.pause();
            }
            
            onReject();
            return;
          }
          
          // Ambil informasi penelepon
          if (callData.initiatorId && !callerName) {
            try {
              const callerDoc = await getDoc(doc(db, 'users', callData.initiatorId));
              if (callerDoc.exists()) {
                setCallerName(callerDoc.data().displayName || 'Pengguna');
              } else {
                // Fallback ke localStorage jika ada
                try {
                  const users = JSON.parse(localStorage.getItem('hallo_users') || '{}');
                  const callerData = users[callData.initiatorId];
                  
                  if (callerData) {
                    setCallerName(callerData.displayName || 'Pengguna');
                  } else {
                    setCallerName('Pengguna');
                  }
                } catch (storageError) {
                  console.error('Error accessing localStorage:', storageError);
                  setCallerName('Pengguna');
                }
              }
            } catch (error) {
              console.error('Error fetching caller info:', error);
              setCallerName('Pengguna');
            }
          }
          
          // Verifikasi status panggilan
          if (callData.startedAt) {
            // Cek apakah panggilan masih valid (tidak lebih dari 60 detik)
            const startTime = new Date(callData.startedAt).getTime();
            const now = new Date().getTime();
            const callAge = now - startTime;
            
            if (callAge > 60000 && callData.status === 'ringing') {
              console.log('Call is too old (> 60s), auto-declining');
              
              // Hindari multiple decline jika sudah ditandai
              if (!hasActionTakenRef.current && !actionInProgressRef.current) {
                handleReject();
              }
            }
          }
        });
      } catch (error) {
        console.error('Error setting up call listener:', error);
        setCallRinging(false);
        onReject();
      }
    };
    
    if (isOpen && callId) {
      fetchCallInfo();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOpen, callId, onReject, user.uid, callerName]);
  
  const handleAccept = async () => {
    // Tandai tindakan sudah diambil untuk mencegah multiple calls
    if (hasActionTakenRef.current || actionInProgressRef.current) {
      console.log('Action already taken or in progress, ignoring accept call');
      return;
    }
    
    // Tandai aksi sedang berlangsung
    actionInProgressRef.current = true;
    
    // Hentikan ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
    }
    
    if (audioFallbackRef.current) {
      audioFallbackRef.current.pause();
    }
    
    setCallRinging(false);
    
    try {
      console.log('Accepting call:', callId);
      
      // Update status panggilan ke 'answered'
      await updateCallStatus(callId, 'answered');
      
      // Tandai tindakan sudah selesai
      hasActionTakenRef.current = true;
      
      // Tambahkan delay singkat sebelum meneruskan ke VideoCallModal
      // untuk memastikan status firestore sudah diupdate lebih dulu
      setTimeout(() => {
        if (mountedRef.current) {
          // Reset action in progress flag
          actionInProgressRef.current = false;
          onAccept(callId, isVideoCall);
        }
      }, 300);
    } catch (error) {
      console.error('Error accepting call:', error);
      // Reset flags dan tolak panggilan jika gagal
      hasActionTakenRef.current = true;
      actionInProgressRef.current = false;
      onReject();
    }
  };
  
  const handleReject = async () => {
    // Tandai tindakan sudah diambil untuk mencegah multiple calls
    if (hasActionTakenRef.current || actionInProgressRef.current) {
      console.log('Action already taken or in progress, ignoring reject call');
      return;
    }
    
    // Tandai aksi sedang berlangsung
    actionInProgressRef.current = true;
    
    // Hentikan ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
    }
    
    if (audioFallbackRef.current) {
      audioFallbackRef.current.pause();
    }
    
    setCallRinging(false);
    
    try {
      console.log('Rejecting call:', callId);
      
      // Update status panggilan
      await updateCallStatus(callId, 'declined');
      
      // Tandai tindakan sudah diambil setelah berhasil update status
      hasActionTakenRef.current = true;
      
      // Panggil callback onReject setelah delay singkat
      // untuk memastikan status firestore sudah terupdate
      setTimeout(() => {
        // Reset action in progress flag
        actionInProgressRef.current = false;
        onReject();
      }, 200);
    } catch (error) {
      console.error('Error rejecting call:', error);
      // Reset flags tetapi masih panggil callback reject
      hasActionTakenRef.current = true;
      actionInProgressRef.current = false;
      onReject();
    }
  };
  
  // Jika modal tidak terbuka, jangan render apa-apa
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-4 bg-primary text-white text-center">
          <h3 className="text-xl font-semibold">
            Panggilan Masuk
          </h3>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4 animate-pulse">
            {isVideoCall ? (
              <FiVideo size={40} className="text-white" />
            ) : (
              <FiPhone size={40} className="text-white" />
            )}
          </div>
          
          <p className="text-lg font-medium mb-1">{callerName || 'Pengguna'}</p>
          <p className="text-gray-500 mb-6">{isVideoCall ? 'Video Call' : 'Audio Call'}</p>
          
          <div className="flex space-x-10">
            <button 
              onClick={handleReject}
              className="flex flex-col items-center focus:outline-none transition-transform hover:scale-105"
              disabled={hasActionTakenRef.current || actionInProgressRef.current}
            >
              <div className="rounded-full p-4 bg-red-500 text-white mb-2 shadow-lg shadow-red-300">
                <FiPhoneOff size={28} />
              </div>
              <span className="text-sm font-medium">Tolak</span>
            </button>
            
            <button 
              onClick={handleAccept}
              className="flex flex-col items-center focus:outline-none transition-transform hover:scale-105"
              disabled={hasActionTakenRef.current || actionInProgressRef.current}
            >
              <div className="rounded-full p-4 bg-green-500 text-white mb-2 shadow-lg shadow-green-300">
                <FiPhone size={28} />
              </div>
              <span className="text-sm font-medium">Terima</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 