import { db } from '@/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Menyimpan data pengguna ke Firestore
 */
export const saveUserToFirestore = async (user: User, phoneNumber?: string) => {
  if (!user.uid) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    
    // Periksa apakah pengguna sudah ada
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Jika belum ada, simpan data pengguna dengan photoURL dari Google
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna',
        photoURL: user.photoURL || null,
        phoneNumber: phoneNumber || null,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isOnline: true
      });
    } else {
      // Jika sudah ada, selalu update photoURL jika ada dari Google (untuk memastikan selalu konsisten)
      const updateData: any = {
        lastSeen: serverTimestamp(),
        isOnline: true
      };
      
      if (user.photoURL) {
        updateData.photoURL = user.photoURL;
      }
      
      if (user.displayName) {
        updateData.displayName = user.displayName;
      }
      
      await updateDoc(userRef, updateData);
    }
  } catch (error) {
    console.error('Error menyimpan data pengguna:', error);
  }
};

/**
 * Update data pengguna termasuk nomor telepon
 */
export const updateUserProfile = async (userId: string, data: {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}) => {
  try {
    // Buat objek untuk update yang tidak berisi undefined
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    // Hanya tambahkan field yang bukan undefined
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }
    
    if (data.photoURL !== undefined) {
      updateData.photoURL = data.photoURL;
    }
    
    // Untuk phoneNumber, ganti undefined dengan null (diterima Firestore)
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber || null;
    }
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

/**
 * Update status online/offline pengguna
 */
export const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline: isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

/**
 * Mengatur status offline saat pengguna logout
 */
export const setUserOffline = async (userId: string) => {
  try {
    await updateOnlineStatus(userId, false);
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
};

/**
 * Mengatur status offline saat pengguna menutup browser
 */
export const setupOnlineStatusListeners = (userId: string) => {
  if (typeof window === 'undefined' || !userId) return;

  const handleBeforeUnload = () => {
    updateOnlineStatus(userId, false);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateOnlineStatus(userId, true);
    } else {
      updateOnlineStatus(userId, false);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Pastikan status online saat halaman aktif
  if (document.visibilityState === 'visible') {
    updateOnlineStatus(userId, true);
  }

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Mendengarkan perubahan profil pengguna secara realtime
 * 
 * @param userId ID pengguna yang ingin dipantau
 * @param onChange Callback yang akan dipanggil saat ada perubahan data pengguna
 * @returns Fungsi untuk berhenti mendengarkan (unsubscribe)
 */
export const listenToUserProfile = (
  userId: string, 
  onChange: (userData: any) => void
) => {
  if (!userId) return () => {};
  
  const userRef = doc(db, 'users', userId);
  
  // Mulai mendengarkan perubahan
  const unsubscribe = onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const userData: any = {
          id: snapshot.id,
          ...snapshot.data()
        };
        // Pastikan displayName tidak hilang
        if (!userData.displayName || userData.displayName === '') {
          userData.displayName = userData.email?.split('@')[0] || 'Pengguna';
        }
        onChange(userData);
      } else {
        // Jika dokumen tidak ada, tetap kirim data minimal
        onChange({ 
          id: userId,
          displayName: 'Pengguna',
          isOnline: false
        } as any);
      }
    },
    (error) => {
      console.error('Error listening to user profile:', error);
      // Kirim data fallback jika terjadi error
      onChange({ 
        id: userId,
        displayName: 'Pengguna',
        isOnline: false
      } as any);
    }
  );
  
  return unsubscribe;
};