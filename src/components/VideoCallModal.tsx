'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, FiWifi, FiWifiOff } from 'react-icons/fi';
import SimplePeer from 'simple-peer';
import { collection, doc, setDoc, onSnapshot, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config'; // Pastikan ini sudah benar sesuai struktur folder Anda

// Konstanta untuk mode testing satu perangkat
const SINGLE_DEVICE_TESTING = false; // Set ke false untuk deployment

// Konstanta delay untuk stabilitas timing
const MODAL_INIT_DELAY = 300;       // Waktu tunggu sebelum inisialisasi koneksi
const SIGNALING_LOCK_RELEASE = 2000; // Waktu untuk membuka signaling lock
const CALL_TIMEOUT = 30000;          // Waktu maksimum menunggu jawaban panggilan
const ANSWER_TIMEOUT = 15000;        // Waktu tunggu setelah panggilan dijawab
const RETRY_BASE_DELAY = 1500;       // Delay dasar untuk retry
const MAX_RETRIES = 3;               // Batas maksimum retry

type VideoCallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  chatId: string;
  recipientId: string;
  isVideoCall?: boolean;
  incomingCallId?: string | null; // Tambahkan prop untuk menandai panggilan masuk
};

// Helper untuk menyimpan data call ke Firestore
const saveCallToFirestore = async (callId: string, callData: any) => {
  try {
    await setDoc(doc(db, 'calls', callId), {
      ...callData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error saving call data to Firestore:', error);
    return false;
  }
};

// Helper untuk mengupdate status panggilan di Firestore
const updateCallStatus = async (callId: string, status: string) => {
  try {
    await updateDoc(doc(db, 'calls', callId), {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'ended' ? { endedAt: serverTimestamp() } : {})
    });
    return true;
  } catch (error) {
    console.error('Error updating call status in Firestore:', error);
    return false;
  }
};

export default function VideoCallModal({
  isOpen,
  onClose,
  user,
  chatId,
  recipientId,
  isVideoCall = true,
  incomingCallId = null // Nilai default null untuk panggilan keluar
}: VideoCallModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended' | 'failed'>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [recipientName, setRecipientName] = useState<string>('');
  const [isCallInitiator, setIsCallInitiator] = useState<boolean>(false);
  const [isModalReady, setIsModalReady] = useState<boolean>(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'medium' | 'poor' | 'unknown'>('unknown');
  const [showNetworkToast, setShowNetworkToast] = useState<boolean>(false);
  const [latestIceStats, setLatestIceStats] = useState<{
    RTT?: number,
    packetsLost?: number,
    jitter?: number
  }>({});
  
  // Referensi untuk berbagai objek dan status
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const callDocRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callInitializedRef = useRef<boolean>(false);
  const connectingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);
  const lastProcessedSignalRef = useRef<{offer?: string, answer?: string}>({});
  const signalingLockRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const iceStatsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Penanganan tambahan untuk skenario pengujian dua browser di perangkat yang sama
  useEffect(() => {
    // Fungsi ini untuk mendeteksi apakah pengguna aktif di tab/window saat ini
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab tidak aktif, tandai untuk menghindari konflik hardware
        console.log('Tab inactive, marking call as background');
      } else {
        // Tab aktif kembali, periksa status
        console.log('Tab active again, checking call status');
        if (connectingRef.current && callStatus === 'connecting' && peerRef.current === null) {
          // Mungkin koneksi hilang saat tab tidak aktif, mencoba restart
          console.log('Connection lost while tab inactive, trying to restart');
        }
      }
    };

    // Tambahkan listener untuk visibilitas dokumen
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callStatus]);
  
  // Mendapatkan info recipient
  useEffect(() => {
    const fetchRecipientInfo = async () => {
      if (!recipientId) {
        setRecipientName('Pengguna');
        return;
      }
      
      try {
        // Coba dapatkan info pengguna dari Firestore
        const userDoc = await getDoc(doc(db, 'users', recipientId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const name = userData.displayName || 'Pengguna';
          setRecipientName(name);
        } else {
          // Fallback ke localStorage jika ada
          try {
            const users = JSON.parse(localStorage.getItem('hallo_users') || '{}');
            const userData = users[recipientId];
            
            if (userData && userData.displayName) {
              setRecipientName(userData.displayName);
            } else {
              setRecipientName('Pengguna');
            }
          } catch (storageError) {
            console.error('Error accessing localStorage:', storageError);
            setRecipientName('Pengguna');
          }
        }
      } catch (error) {
        console.error('Error fetching recipient info:', error);
        setRecipientName('Pengguna');
      }
    };
    
    fetchRecipientInfo();
  }, [recipientId]);
  
  // Effect untuk menandai modal sudah siap setelah mounting
  useEffect(() => {
    console.log('VideoCallModal component mounted');
    if (isOpen) {
      // Tandai modal sudah siap setelah rendering pertama selesai
      setIsModalReady(true);
    }
    return () => {
      console.log('VideoCallModal component will unmount');
    };
  }, [isOpen]);
  
  // Effect untuk reset state saat modal tertutup
  useEffect(() => {
    // Reset state saat modal ditutup
    if (!isOpen && callInitializedRef.current) {
      console.log('Modal closed, resetting initialized state');
      // Hanya reset setelah timeout untuk mencegah race condition
      const resetTimer = setTimeout(() => {
        callInitializedRef.current = false;
        // Reset state lainnya
        signalingLockRef.current = false;
        retryCountRef.current = 0;
        lastProcessedSignalRef.current = {};
      }, SIGNALING_LOCK_RELEASE / 2);
      
      return () => {
        clearTimeout(resetTimer);
      };
    }
  }, [isOpen]);
  
  // Memulai media stream dan setup panggilan
  useEffect(() => {
    // Skip jika modal tidak terbuka atau belum siap
    if (!isOpen || !isModalReady) {
      return;
    }
    
    // Tandai komponen sebagai terpasang
    mountedRef.current = true;
    console.log('VideoCallModal mounted, isOpen:', isOpen, 'isModalReady:', isModalReady);
    
    // Guard clause - hanya inisialisasi sekali dan saat modal terbuka
    if (callInitializedRef.current) {
      console.log('Skipping initialization: already initialized');
      return;
    }
    
    // Tandai proses sudah dimulai
    callInitializedRef.current = true;
    connectingRef.current = true;
    
    // Reset state signaling
    signalingLockRef.current = false;
    retryCountRef.current = 0;
    lastProcessedSignalRef.current = {};
    
    // Setup timeout untuk panggilan yang tidak terjawab
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && connectingRef.current && callStatus === 'connecting') {
        console.log('Call timed out after 30 seconds');
        endCall();
      }
    }, CALL_TIMEOUT);
    
    const initializeCall = async () => {
      try {
        console.log('Initializing call and requesting media access');
        
        // Request media access with appropriate constraints
        const constraints = {
          video: isVideoCall ? {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } : false,
          audio: {
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true
          }
        };
        
        // Mode testing satu perangkat
        if (SINGLE_DEVICE_TESTING) {
          console.log('Running in single-device testing mode');
          
          // Delay lebih lama untuk memberi waktu browser melepaskan media
          await new Promise(resolve => setTimeout(resolve, 700));
          
          // Constraint lebih sederhana untuk mengurangi konflik
          if (isVideoCall) {
            constraints.video = true;
          }
        } else {
          // Delay kecil untuk produksi normal
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaError) {
          console.error('Error accessing media devices:', mediaError);
          
          // Coba lagi dengan constraints yang lebih sederhana jika gagal
          if (isVideoCall) {
            console.log('Retrying with simplified video constraints');
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            });
          } else {
            throw mediaError; // re-throw jika bukan video call
          }
        }
        
        // Guard check if component unmounted during async operation
        if (!mountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        console.log('Media access granted');
        
        // Set local stream
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }
        
        // Logic for incoming call
        if (incomingCallId) {
          await handleIncomingCall(incomingCallId, stream);
        } 
        // Logic for outgoing call
        else {
          await handleOutgoingCall(stream);
        }
      } catch (error) {
        console.error('Error in call setup:', error);
        
        if (mountedRef.current) {
          setCallStatus('failed');
        }
      }
    };
    
    // Gunakan setTimeout untuk memastikan komponen sudah benar-benar dimuat
    // sebelum memulai proses inisialisasi
    const initTimer = setTimeout(() => {
      console.log('Starting call initialization with delay');
      initializeCall();
    }, MODAL_INIT_DELAY);
    
    // Cleanup function
    return () => {
      console.log('VideoCallModal call setup cleanup, status:', callStatus);
      clearTimeout(initTimer);
      mountedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Hanya bersihkan jika masih dalam proses (bukan setelah selesai normal)
      if (callStatus !== 'ended' && callStatus !== 'failed') {
        endCall();
      }
    };
  }, [isOpen, isModalReady, incomingCallId, isVideoCall, chatId, recipientId, user.uid]);
  
  // Effect untuk memonitor kualitas koneksi
  useEffect(() => {
    if (callStatus === 'connected' && peerRef.current) {
      // Mulai monitoring stats setelah terhubung
      const monitorConnectionQuality = () => {
        if (!peerRef.current) {
          return;
        }
        
        console.log('Starting connection quality monitoring');
        
        // Bersihkan interval yang ada
        if (iceStatsIntervalRef.current) {
          clearInterval(iceStatsIntervalRef.current);
        }
        
        // Setup interval untuk mengecek kualitas koneksi
        iceStatsIntervalRef.current = setInterval(async () => {
          if (!peerRef.current || !mountedRef.current) {
            if (iceStatsIntervalRef.current) {
              clearInterval(iceStatsIntervalRef.current);
              iceStatsIntervalRef.current = null;
            }
            return;
          }
          
          try {
            // Ambil WebRTC stats dengan type casting untuk mengatasi error TypeScript
            // getStats() adalah metode standar di WebRTC RTCPeerConnection
            // @ts-ignore - cast SimplePeer instance ke any untuk akses WebRTC stats
            const stats = await (peerRef.current as any).getStats();
            
            if (!stats) return;
            
            let currentRTT = 0;
            let packetsLost = 0;
            let packetsReceived = 0;
            let jitter = 0;
            let statsCount = 0;
            
            // Parse WebRTC stats
            stats.forEach((stat: any) => {
              if (stat.type === 'inbound-rtp' || stat.type === 'remote-inbound-rtp') {
                statsCount++;
                
                if (stat.roundTripTime) {
                  currentRTT += stat.roundTripTime * 1000; // Convert to ms
                }
                
                if (stat.packetsLost) {
                  packetsLost += stat.packetsLost;
                }
                
                if (stat.packetsReceived) {
                  packetsReceived += stat.packetsReceived;
                }
                
                if (stat.jitter) {
                  jitter += stat.jitter * 1000; // Convert to ms
                }
              }
            });
            
            // Hitung rata-rata jika ada data
            if (statsCount > 0) {
              currentRTT = currentRTT / statsCount;
              jitter = jitter / statsCount;
              
              const iceStats = {
                RTT: Math.round(currentRTT),
                packetsLost,
                jitter: Math.round(jitter)
              };
              
              setLatestIceStats(iceStats);
              
              // Evaluasi kualitas berdasarkan metrics
              let quality: 'good' | 'medium' | 'poor' = 'good';
              
              // Evaluasi RTT (ping)
              if (currentRTT > 300) {
                quality = 'poor';
              } else if (currentRTT > 150) {
                quality = 'medium';
              }
              
              // Evaluasi packet loss rate jika ada packet yang diterima
              if (packetsReceived > 0) {
                const lossRate = packetsLost / (packetsLost + packetsReceived);
                if (lossRate > 0.05) { // >5% packet loss
                  quality = 'poor';
                } else if (lossRate > 0.02) { // >2% packet loss
                  quality = quality === 'poor' ? 'poor' : 'medium';
                }
              }
              
              // Evaluasi jitter (consistency)
              if (jitter > 50) {
                quality = 'poor';
              } else if (jitter > 30) {
                quality = quality === 'poor' ? 'poor' : 'medium';
              }
              
              // Set kualitas koneksi
              setConnectionQuality(quality);
              
              // Tampilkan toast jika kualitas buruk
              if (quality === 'poor' && !showNetworkToast) {
                setShowNetworkToast(true);
                // Sembunyikan toast setelah 5 detik
                setTimeout(() => {
                  if (mountedRef.current) {
                    setShowNetworkToast(false);
                  }
                }, 5000);
              }
            }
          } catch (error) {
            console.error('Error getting WebRTC stats:', error);
          }
        }, 3000); // Cek setiap 3 detik
      };
      
      // Mulai monitoring setelah koneksi
      monitorConnectionQuality();
      
      return () => {
        if (iceStatsIntervalRef.current) {
          clearInterval(iceStatsIntervalRef.current);
          iceStatsIntervalRef.current = null;
        }
      };
    }
  }, [callStatus]);
  
  // Fungsi untuk membuat peer connection
  const createPeer = (stream: MediaStream, initiator: boolean) => {
    console.log('Creating SimplePeer connection, initiator:', initiator);
    
    // Cegah pembuatan peer ganda
    if (peerRef.current) {
      console.log('Peer instance already exists, destroying old one first');
      try {
        peerRef.current.destroy();
        peerRef.current = null;
      } catch (e) {
        console.error('Error destroying existing peer:', e);
      }
    }
    
    // Reset signaling lock when creating a new peer
    signalingLockRef.current = false;
    
    // Konfigurasi ICE servers yang lebih lengkap
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { 
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:global.turn.twilio.com:3478?transport=udp',
        username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe923f24a',
        credential: 'myL7nn4CuLV0GPPwoP9NMb02MsCl6FKoJP5Y800kC1I='
      }
    ];
    
    // Buat peer dengan konfigurasi yang lebih stabil
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: { 
        iceServers,
        iceTransportPolicy: 'all',
        sdpSemantics: 'unified-plan'
      },
      objectMode: true
    });
    
    // Handle signal events
    peer.on('signal', async (data) => {
      if (!callDocRef.current || !mountedRef.current) return;
      
      const callId = callDocRef.current;
      
      try {
        // Jika signaling lock aktif, skip pengiriman sinyal
        if (signalingLockRef.current) {
          console.log('Signaling locked, skipping signal');
          return;
        }
        
        // Handle different signal types
        if (data.type === 'offer' && initiator) {
          console.log('Sending offer to peer');
          const offerTimestamp = new Date().toISOString();
          
          // Simpan timestamp untuk mencegah pemrosesan ganda
          lastProcessedSignalRef.current.offer = offerTimestamp;
          
          await updateDoc(doc(db, 'calls', callId), {
            offer: JSON.stringify(data),
            offerTimestamp
          });
        }
        else if (data.type === 'answer' && !initiator) {
          console.log('Sending answer to peer');
          const answerTimestamp = new Date().toISOString();
          
          // Simpan timestamp untuk mencegah pemrosesan ganda
          lastProcessedSignalRef.current.answer = answerTimestamp;
          
          // Kunci signaling setelah answer dikirim untuk mencegah race condition
          signalingLockRef.current = true;
          
          await updateDoc(doc(db, 'calls', callId), {
            answer: JSON.stringify(data),
            answerTimestamp,
            status: 'connected'
          });
          
          // Buka kembali signaling lock setelah 2 detik
          setTimeout(() => {
            signalingLockRef.current = false;
          }, 2000);
        }
        else if (data.candidate) {
          // Skip ICE candidate jika signaling lock aktif
          if (signalingLockRef.current) return;
          
          // Catat ICE candidate dengan format yang lebih efisien
          const callDoc = await getDoc(doc(db, 'calls', callId));
          if (!callDoc.exists()) return;
          
          const currentData = callDoc.data();
          const iceUpdateCounter = (currentData.iceUpdateCounter || 0) + 1;
          
          // Batasi jumlah ICE candidates yang disimpan
          if (iceUpdateCounter <= 50) {
            const fieldName = initiator ? `ice_init_${iceUpdateCounter}` : `ice_recv_${iceUpdateCounter}`;
            
            const updateData: any = { iceUpdateCounter };
            updateData[fieldName] = JSON.stringify(data);
            
            await updateDoc(doc(db, 'calls', callId), updateData);
          }
        }
      } catch (error) {
        console.error('Error updating signal data:', error);
      }
    });
    
    // Handle successful connection
    peer.on('connect', () => {
      console.log('Peer connection established');
      
      if (!mountedRef.current) return;
      
      // Update status in component and Firestore
      connectingRef.current = false;
      setCallStatus('connected');
      startCallTimer();
      
      // Clear connection timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Update Firestore status
      if (callDocRef.current) {
        updateDoc(doc(db, 'calls', callDocRef.current), {
          status: 'connected'
        }).catch(err => {
          console.error('Error updating connected status:', err);
        });
      }
    });
    
    // Handle remote stream
    peer.on('stream', (stream) => {
      console.log('Received remote stream');
      
      if (!mountedRef.current) return;
      
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        
        // Ensure video plays with better error handling
        remoteVideoRef.current.play().catch(err => {
          console.warn('Autoplay failed, adding interaction handlers');
          
          const playOnInteraction = () => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play()
                .then(() => {
                  document.removeEventListener('click', playOnInteraction);
                  document.removeEventListener('touchstart', playOnInteraction);
                })
                .catch(e => console.error('Still cannot play video:', e));
            }
          };
          
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
        });
      }
    });
    
    // Handle errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      
      if (!mountedRef.current) return;
      
      // If connected, try to maintain connection
      if (callStatus === 'connected') {
        console.log('Error occurred while connected, attempting to continue');
      } else {
        // For connection errors, fail after a timeout if it's not an invalid state error
        // which can happen during race conditions when both peers signal at once
        const errorString = err.toString();
        
        if (errorString.includes('InvalidStateError')) {
          console.log('Invalid state error detected, likely due to simultaneous signaling');
          
          // Increment retry counter
          retryCountRef.current += 1;
          
          // Try to recover by recreating peer with a delay if it was the initiator
          // but limit number of retries to prevent infinite loops
          if (initiator && retryCountRef.current < 3) {
            console.log(`Recreating peer connection after invalid state error (retry ${retryCountRef.current}/3)`);
            
            // Set signaling lock immediately
            signalingLockRef.current = true;
            
            // Use a longer delay for each retry attempt
            const retryDelay = RETRY_BASE_DELAY + (retryCountRef.current * RETRY_BASE_DELAY);
            
            setTimeout(() => {
              // Release signaling lock
              signalingLockRef.current = false;
              
              if (mountedRef.current && callStatus === 'connecting' && peerRef.current === peer) {
                console.log('Recreating peer connection after invalid state error');
                peerRef.current = null;
                const newPeer = createPeer(stream, true);
                peerRef.current = newPeer;
              }
            }, retryDelay);
          } else if (retryCountRef.current >= 3) {
            console.log('Too many retries, setting call as failed');
            setCallStatus('failed');
          }
        } else if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current && callStatus === 'connecting') {
              console.log('Connection failed');
              setCallStatus('failed');
            }
          }, 8000);
        }
      }
    });
    
    // Handle close
    peer.on('close', () => {
      console.log('Peer connection closed');
      
      if (!mountedRef.current) return;
      
      if (callStatus !== 'ended') {
        endCall();
      }
    });
    
    return peer;
  };
  
  // Mulai timer durasi panggilan
  const startCallTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    let seconds = 0;
    intervalRef.current = setInterval(() => {
      seconds += 1;
      if (mountedRef.current) {
        setCallDuration(seconds);
      } else {
        // Cleanup jika komponen sudah unmount
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, 1000);
  };
  
  // Format durasi panggilan untuk tampilan
  const formatCallDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle camera on/off
  const toggleCamera = () => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      const enabled = !videoTracks[0].enabled;
      videoTracks[0].enabled = enabled;
      setIsCameraOn(enabled);
    }
  };
  
  // Toggle mic on/off
  const toggleMic = () => {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const enabled = !audioTracks[0].enabled;
      audioTracks[0].enabled = enabled;
      setIsMicOn(enabled);
    }
  };
  
  // Clean end call with proper cleanup
  const endCall = async () => {
    console.log('Ending call, status:', callStatus);
    
    // Prevent multiple calls to endCall
    if (callStatus === 'ended') {
      console.log('Call already ended, skipping endCall');
      return;
    }
    
    // Set status to ended immediately
    setCallStatus('ended');
    connectingRef.current = false;
    
    // Clear timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Stop interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Stop stats monitoring
    if (iceStatsIntervalRef.current) {
      clearInterval(iceStatsIntervalRef.current);
      iceStatsIntervalRef.current = null;
    }
    
    // Stop local stream
    if (localStream) {
      try {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
        setLocalStream(null);
      } catch (e) {
        console.error('Error stopping local stream:', e);
      }
    }
    
    // Stop remote stream
    if (remoteStream) {
      try {
        remoteStream.getTracks().forEach(track => {
          track.stop();
        });
        setRemoteStream(null);
      } catch (e) {
        console.error('Error stopping remote stream:', e);
      }
    }
    
    // Destroy peer
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
        peerRef.current = null;
      } catch (e) {
        console.error('Error destroying peer:', e);
      }
    }
    
    // Unsubscribe from Firestore
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      } catch (e) {
        console.error('Error unsubscribing from Firestore:', e);
      }
    }
    
    // Update call status in Firestore
    if (callDocRef.current) {
      try {
        // Tambahkan guard untuk mencegah multiple update ke Firestore
        const callId = callDocRef.current;
        callDocRef.current = null;
        
        await updateDoc(doc(db, 'calls', callId), {
          status: 'ended',
          endedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error updating call status:', e);
      }
    }
    
    // Reset refs
    callInitializedRef.current = false;
    
    // Close modal with delay
    setTimeout(() => {
      if (mountedRef.current) {
        setCallDuration(0);
        console.log('Closing modal after call ended');
        onClose();
      }
    }, 500);
  };
  
  // Handler untuk panggilan masuk
  const handleIncomingCall = async (callId: string, stream: MediaStream) => {
    console.log('Handling incoming call:', callId);
    callDocRef.current = callId;
    
    try {
      // Get call data
      const callDoc = await getDoc(doc(db, 'calls', callId));
      if (!callDoc.exists()) {
        console.error('Call document not found');
        setCallStatus('failed');
        return;
      }
      
      const callData = callDoc.data();
      setIsCallInitiator(false);
      
      // Reset retry counter for a fresh call
      retryCountRef.current = 0;
      
      // Setup firestore listener untuk signaling dan status panggilan
      const unsubscribe = onSnapshot(doc(db, 'calls', callId), (docSnapshot) => {
        if (!mountedRef.current) return;
        
        if (!docSnapshot.exists()) {
          console.log('Call document deleted');
          endCall();
          return;
        }
        
        const callData = docSnapshot.data();
        
        // Check call status
        if (callData.status === 'ended' || callData.status === 'declined') {
          console.log('Call ended by other party');
          endCall();
          return;
        }
        
        // Process offer jika ada dan kita belum punya peer
        // Atau jika offerTimestamp lebih baru dari offer terakhir yang kita proses
        if (callData.offer && 
            (!peerRef.current || 
            (callData.offerTimestamp && 
             (!lastProcessedSignalRef.current.offer || 
              callData.offerTimestamp > lastProcessedSignalRef.current.offer)))) {
          
          // Skip jika signaling lock aktif
          if (signalingLockRef.current) {
            console.log('Signaling locked, skipping offer processing');
            return;
          }
          
          console.log('Received offer, initializing peer connection');
          
          // Simpan timestamp untuk mencegah pemrosesan ganda
          lastProcessedSignalRef.current.offer = callData.offerTimestamp;
          
          // Cek apakah peer sudah ada, jika ada refresh
          if (peerRef.current) {
            console.log('Refreshing existing peer connection for incoming call');
            refreshConnection(stream, false);
          } else {
            // Buat dan simpan peer connection baru
            const peer = createPeer(stream, false);
            peerRef.current = peer;
          }
          
          // Proses offer dari penelepon dalam try-catch untuk penanganan error yang lebih baik
          try {
            const offer = JSON.parse(callData.offer);
            
            // Delay singkat sebelum proses offer untuk memastikan peer siap
            setTimeout(() => {
              if (peerRef.current && mountedRef.current) {
                try {
                  peerRef.current.signal(offer);
                } catch (signalError) {
                  console.error('Error processing offer signal:', signalError);
                  
                  // Jika terjadi error, coba refresh connection setelah delay
                  if (mountedRef.current) {
                    setTimeout(() => {
                      if (mountedRef.current) {
                        console.log('Attempting to recover from signal error');
                        const newPeer = refreshConnection(stream, false);
                        setTimeout(() => {
                          if (newPeer && mountedRef.current) {
                            try {
                              newPeer.signal(offer);
                            } catch (retryError) {
                              console.error('Failed to recover from signal error:', retryError);
                            }
                          }
                        }, 500);
                      }
                    }, 1000);
                  }
                }
              }
            }, 100);
            
          } catch (error) {
            console.error('Error processing offer:', error);
          }
        }
      });
      
      unsubscribeRef.current = unsubscribe;
      
      // Update call status ke 'answered'
      await updateDoc(doc(db, 'calls', callId), {
        status: 'answered',
        answeredAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in handling incoming call:', error);
      setCallStatus('failed');
    }
  };
  
  // Handler untuk panggilan keluar
  const handleOutgoingCall = async (stream: MediaStream) => {
    console.log('Handling outgoing call');
    
    try {
      // Buat ID panggilan baru
      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      callDocRef.current = newCallId;
      setIsCallInitiator(true);
      
      // Reset retry counter for a fresh call
      retryCountRef.current = 0;
      
      // Data panggilan awal
      const callData = {
        chatId,
        initiatorId: user.uid,
        recipientId,
        status: 'ringing',
        type: isVideoCall ? 'video' : 'audio',
        startedAt: new Date().toISOString(),
        endedAt: null,
        offer: null,
        answer: null,
        offerTimestamp: null,
        answerTimestamp: null,
        iceUpdateCounter: 0,
        callClientId: Math.random().toString(36).substring(2, 15)
      };
      
      // Simpan dokumen panggilan
      await setDoc(doc(db, 'calls', newCallId), callData);
      console.log('Call document created:', newCallId);
      
      // Setup listener untuk update panggilan
      const unsubscribe = onSnapshot(doc(db, 'calls', newCallId), (docSnapshot) => {
        if (!mountedRef.current) return;
        
        if (!docSnapshot.exists()) {
          console.log('Call document deleted');
          endCall();
          return;
        }
        
        const callData = docSnapshot.data();
        
        // Check call status updates
        if (callData.status === 'declined') {
          console.log('Call declined by recipient');
          endCall();
          return;
        } 
        else if (callData.status === 'answered' && callStatus === 'connecting') {
          console.log('Call answered, waiting for connection...');
          // Reset timeout since call was answered
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              if (callStatus === 'connecting' && mountedRef.current) {
                console.log('Call answered but failed to connect');
                endCall();
              }
            }, ANSWER_TIMEOUT);
          }
        }
        else if (callData.status === 'ended') {
          console.log('Call ended by recipient');
          endCall();
          return;
        }
        
        // Process answer jika tersedia dan lebih baru dari yang sebelumnya
        if (callData.answer && peerRef.current && 
            (!lastProcessedSignalRef.current.answer || 
            (callData.answerTimestamp && callData.answerTimestamp > lastProcessedSignalRef.current.answer))) {
          
          // Skip jika signaling lock aktif
          if (signalingLockRef.current) {
            console.log('Signaling locked, skipping answer processing');
            return;
          }
          
          try {
            console.log('Received answer from peer');
            const answer = JSON.parse(callData.answer);
            
            // Simpan timestamp untuk mencegah pemrosesan ganda
            lastProcessedSignalRef.current.answer = callData.answerTimestamp;
            
            // Kunci signaling selama pemrosesan answer untuk mencegah race condition
            signalingLockRef.current = true;
            
            // Wrap dalam try-catch untuk menangani error "Called in wrong state: stable"
            try {
              peerRef.current.signal(answer);
              
              // Jika tidak ada error, buka kembali signaling lock setelah delay
              setTimeout(() => {
                signalingLockRef.current = false;
              }, SIGNALING_LOCK_RELEASE / 2);
            } catch (err) {
              console.error('Error processing answer, will retry:', err);
              
              // Jika terjadi error, coba refresh connection dan kemudian coba lagi
              setTimeout(() => {
                if (stream && mountedRef.current) {
                  try {
                    // Refresh connection dan coba lagi dengan signaling yang sama
                    console.log('Refreshing connection after signaling error');
                    const newPeer = refreshConnection(stream, true);
                    
                    // Tunggu sebentar, kemudian coba set signal lagi
                    setTimeout(() => {
                      if (newPeer && mountedRef.current) {
                        try {
                          newPeer.signal(answer);
                        } catch (retryErr) {
                          console.error('Final error processing answer after refresh:', retryErr);
                          
                          // Buka signaling lock setelah lebih lama
                          setTimeout(() => {
                            signalingLockRef.current = false;
                          }, SIGNALING_LOCK_RELEASE);
                          
                          // Increment retry counter
                          retryCountRef.current += 1;
                          
                          // Jika sudah mencoba beberapa kali, tandai panggilan gagal
                          if (retryCountRef.current >= MAX_RETRIES) {
                            console.log('Too many signal processing errors, failing call');
                            setCallStatus('failed');
                          }
                        }
                      } else {
                        // Peer sudah tidak ada, buka signaling lock
                        signalingLockRef.current = false;
                      }
                    }, 500);
                  } catch (refreshErr) {
                    console.error('Error refreshing connection:', refreshErr);
                    signalingLockRef.current = false;
                    setCallStatus('failed');
                  }
                } else {
                  // Stream tidak tersedia, buka signaling lock
                  signalingLockRef.current = false;
                }
              }, RETRY_BASE_DELAY);
            }
          } catch (error) {
            console.error('Error parsing answer:', error);
            // Buka kembali signaling lock jika terjadi error parsing
            signalingLockRef.current = false;
          }
        }
      });
      
      unsubscribeRef.current = unsubscribe;
      
      // Buat peer connection sebagai inisiator
      const peer = createPeer(stream, true);
      peerRef.current = peer;
      
    } catch (error) {
      console.error('Error in outgoing call:', error);
      setCallStatus('failed');
    }
  };
  
  // Fungsi untuk me-refresh koneksi jika terjadi kegagalan
  const refreshConnection = (stream: MediaStream, isInitiator: boolean) => {
    console.log('Refreshing peer connection');
    
    // Bersihkan peer connection yang ada
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
        peerRef.current = null;
      } catch (e) {
        console.error('Error destroying existing peer during refresh:', e);
      }
    }
    
    // Reset signaling lock
    signalingLockRef.current = false;
    
    // Buat peer connection baru
    const newPeer = createPeer(stream, isInitiator);
    peerRef.current = newPeer;
    
    // Jika belum terhubung, set status ke connecting
    if (callStatus !== 'connected') {
      setCallStatus('connecting');
    }
    
    return newPeer;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">
            {isVideoCall ? 'Video Call' : 'Audio Call'} dengan {recipientName}
          </h3>
          <div className="flex items-center">
            {callStatus === 'connected' && (
              <>
                <span className="text-sm mr-2">{formatCallDuration(callDuration)}</span>
                {/* Connection Quality Indicator */}
                {connectionQuality !== 'unknown' && (
                  <div 
                    className="h-6 w-6 rounded-full flex items-center justify-center mr-1"
                    title={`Kualitas koneksi: ${
                      connectionQuality === 'good' ? 'Baik' : 
                      connectionQuality === 'medium' ? 'Sedang' : 'Buruk'
                    }`}
                  >
                    {connectionQuality === 'good' && <FiWifi className="text-green-300" size={16} />}
                    {connectionQuality === 'medium' && <FiWifi className="text-yellow-300" size={16} />}
                    {connectionQuality === 'poor' && <FiWifiOff className="text-red-300" size={16} />}
                  </div>
                )}
              </>
            )}
            {callStatus === 'connecting' && (
              <span className="text-sm">Menghubungkan...</span>
            )}
          </div>
        </div>
        
        {/* Notifikasi kualitas jaringan buruk */}
        {showNetworkToast && (
          <div className="bg-red-500 text-white text-xs p-2 text-center animate-pulse">
            Koneksi internet lemah. Kualitas panggilan mungkin terpengaruh.
          </div>
        )}
        
        <div className="video-container relative">
          {(isVideoCall && callStatus === 'connected') && (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 w-24 h-24 bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {callStatus === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4">
                {isVideoCall ? <FiVideo size={32} className="text-white" /> : <FiPhone size={32} className="text-white" />}
              </div>
              <p className="text-lg font-medium">Menghubungi {recipientName}...</p>
              <div className="mt-4 flex space-x-2 items-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '250ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '500ms' }}></div>
              </div>
            </div>
          )}
          
          {(!isVideoCall && callStatus === 'connected') && (
            <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-r from-primary/10 to-primary-dark/10">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4">
                <FiPhone size={40} className="text-white" />
              </div>
              <p className="text-xl">Audio Call dengan {recipientName}</p>
              <p className="text-gray-500 mt-2">{formatCallDuration(callDuration)}</p>
            </div>
          )}
          
          {/* Failed Call Status */}
          {callStatus === 'failed' && (
            <div className="flex flex-col items-center justify-center py-8 bg-red-50">
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-4">
                <FiPhone size={32} className="text-white transform rotate-135" />
              </div>
              <p className="text-lg font-medium text-red-700">Panggilan Gagal</p>
              <p className="text-gray-500 mt-1 mb-4 text-center px-6">
                Tidak dapat menghubungkan panggilan.<br />Periksa koneksi internet Anda.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
        
        {(callStatus === 'connected' || localStream) && (
          <div className="p-4 flex justify-center space-x-4 bg-gray-100">
            {isVideoCall && (
              <button
                onClick={toggleCamera}
                className={`rounded-full p-3 ${isCameraOn ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'}`}
              >
                {isCameraOn ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
              </button>
            )}
            <button
              onClick={toggleMic}
              className={`rounded-full p-3 ${isMicOn ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'}`}
            >
              {isMicOn ? <FiMic size={22} /> : <FiMicOff size={22} />}
            </button>
            <button
              onClick={endCall}
              className="rounded-full p-3 bg-red-500 text-white"
            >
              <FiPhone size={22} className="transform rotate-135" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 