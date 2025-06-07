'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { FiX, FiUser, FiPhone, FiSave, FiCamera } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateUserProfile } from '@/lib/users';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';

// Konstanta untuk ukuran maksimum gambar
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB (sesuai permintaan)
const IMAGE_DIMENSION = 96; // 96px (ukuran umum untuk avatar)
const MIN_IMAGE_DIMENSION = 48; // Ukuran minimum jika perlu

// Fungsi untuk memperkecil ukuran gambar
const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Max resolution
    const MAX_WIDTH = 500;
    const MAX_HEIGHT = 500;
    
    // Ukuran maksimum file (500KB)
    const MAX_IMAGE_SIZE = 500 * 1024;
    
    img.onload = () => {
      // Set ukuran canvas persis ke ukuran avatar yang diinginkan
      const canvas = document.createElement('canvas');
      
      // Pertahankan rasio aspek, tapi batasi ukuran
      let width = img.width;
      let height = img.height;
      
      // Resize jika melebihi dimensi maksimum
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      
      if (height > MAX_HEIGHT) {
        width = Math.round(width * (MAX_HEIGHT / height));
        height = MAX_HEIGHT;
      }
      
      // Set ukuran canvas
      canvas.width = width;
      canvas.height = height;
      
      // Gambar ke canvas dengan ukuran baru
      const ctx = canvas.getContext('2d');
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Konversi ke blob dengan kualitas rendah untuk meminimalkan ukuran
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Jika ukuran masih terlalu besar, coba lagi dengan kualitas lebih rendah
            if (blob.size > MAX_IMAGE_SIZE) {
              canvas.toBlob(
                (smallerBlob) => {
                  if (smallerBlob) {
                    resolve(smallerBlob);
                  } else {
                    reject(new Error('Gagal mengkonversi gambar'));
                  }
                },
                'image/jpeg',
                0.5  // Kualitas lebih rendah
              );
            } else {
              resolve(blob);
            }
          } else {
            reject(new Error('Gagal mengkonversi gambar'));
          }
        },
        'image/jpeg',
        0.7  // Kualitas medium-high
      );
    };
    
    img.onerror = () => {
      reject(new Error('Gagal memuat gambar'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Fungsi untuk upload gambar ke Cloudinary melalui API route kita
const uploadToCloudinary = async (imageDataUrl: string): Promise<string> => {
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: imageDataUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal upload ke Cloudinary');
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error('Error upload ke Cloudinary:', error);
    throw new Error('Gagal mengupload foto: ' + error.message);
  }
};

type ProfileModalProps = {
  user: User;
  onClose: () => void;
  isOpen?: boolean;  // Tambahkan prop isOpen (opsional untuk backward compatibility)
};

export default function ProfileModal({ user, onClose, isOpen = true }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [photoURL, setPhotoURL] = useState<string>(user.photoURL || '');
  const [originalPhotoURL, setOriginalPhotoURL] = useState<string>(user.photoURL || '');
  const [photoError, setPhotoError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.phoneNumber) {
            setPhoneNumber(userData.phoneNumber);
          }
          if (userData.photoURL) {
            setPhotoURL(userData.photoURL);
            setOriginalPhotoURL(userData.photoURL);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [user.uid]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    if (photoChanged) {
      console.log("Membatalkan perubahan foto profil, kembali ke:", originalPhotoURL);
      // Kembalikan foto ke nilai asli
      if (user.photoURL !== originalPhotoURL) {
        updateProfile(user, { photoURL: originalPhotoURL });
      }
      
      // Setel kembali foto di Firestore
      updateUserProfile(user.uid, { photoURL: originalPhotoURL });
    }
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validasi tipe file
    if (!file.type.includes('image/')) {
      setError('Mohon pilih file gambar (JPG, PNG, dll)');
      return;
    }
    
    // Simpan URL foto original untuk dikembalikan jika gagal
    const originalPhotoURL = photoURL;
    
    try {
      setUploadingPhoto(true);
      setPhotoChanged(true);
      setUploadStatus('Memproses gambar...');
      
      // Resize gambar sebelum upload
      const resizedImage = await resizeImage(file);
      
      // Buat URL preview sementara
      const previewURL = URL.createObjectURL(resizedImage);
      setPhotoURL(previewURL);
      
      // Upload ke storage
      setUploadStatus('Mengunggah...');
      
      // Buat reference ke storage
      const storageRef = ref(storage, `avatars/${user.uid}`);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, resizedImage);
      
      // Monitor progress upload
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadStatus(`Mengunggah... ${Math.round(progress)}%`);
        },
        (error) => {
          setError('Gagal mengunggah foto profil');
          setPhotoURL(originalPhotoURL); // Kembalikan ke foto asli jika gagal
          setPhotoChanged(false);
          throw error;
        },
        async () => {
          // Upload berhasil, dapatkan URL download
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update URL di state
          setPhotoURL(downloadURL);
          
          // Update di Firestore
          const success = await updateUserProfile(user.uid, {
            photoURL: downloadURL
          });
          
          if (!success) {
            throw new Error('Gagal memperbarui foto profil di database');
          }
          
          setSuccess(true);
          setUploadStatus('');
          
          // Buat elemen notifikasi sukses yang akan dihapus setelah beberapa detik
          const successMessage = document.createElement('div');
          successMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 fixed bottom-4 right-4 z-50 animate-fadeIn shadow-lg';
          successMessage.innerHTML = 'Foto profil berhasil diperbarui!';
          document.body.appendChild(successMessage);
          
          // Hapus notifikasi setelah 3 detik
          setTimeout(() => {
            if (document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
            setSuccess(false);
          }, 3000);
        }
      );
    } catch (err: any) {
      let errorMessage = 'Gagal mengubah foto profil. Silakan coba lagi dengan foto yang lebih kecil.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setPhotoURL(originalPhotoURL); // Kembalikan ke foto awal jika gagal
      setPhotoChanged(false); // Reset state perubahan
    } finally {
      // Selalu bersihkan
      setUploadingPhoto(false);
      setUploadStatus('');
      
      // Reset file input agar bisa upload file yang sama
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Validasi nomor telepon
      if (phoneNumber && !/^\+?[0-9\s-]{10,15}$/.test(phoneNumber)) {
        throw new Error('Format nomor telepon tidak valid');
      }

      // Jika ada perubahan foto, simpan perubahan tersebut
      if (photoChanged) {
        console.log("Menyimpan perubahan foto profil:", photoURL);
        // Update foto URL di Auth jika berubah
        if (user.photoURL !== photoURL) {
          await updateProfile(user, { photoURL: photoURL });
        }
      }

      // Update profil di Firestore
      const result = await updateUserProfile(user.uid, {
        displayName: displayName.trim() || user.email?.split('@')[0] || 'Pengguna',
        phoneNumber: phoneNumber.trim() || undefined,
        photoURL: photoChanged ? photoURL : undefined // Hanya update foto jika berubah
      });

      if (result) {
        // Update profil di Auth jika nama berubah
        if (user.displayName !== displayName && displayName.trim()) {
          await updateProfile(user, {
            displayName: displayName.trim()
          });
        }
        
        // Set original foto ke nilai baru karena sudah disimpan
        setOriginalPhotoURL(photoURL);
        setPhotoChanged(false);
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error('Gagal menyimpan profil');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white/90 backdrop-blur-md w-full max-w-md mx-4 rounded-2xl shadow-xl animate-scaleIn overflow-hidden">
        {/* Header dengan gradien */}
        <div className="bg-gradient-to-r from-primary-dark via-primary to-secondary p-6 text-white relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Profil Saya</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-4 border-white/30 shadow-lg">
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-10">
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                      <p className="text-white text-xs text-center px-1">{uploadStatus}</p>
                    </div>
                  )}
                  
                  {photoURL && !photoError ? (
                    <img
                      src={photoURL}
                      alt="Foto profil"
                      className="w-full h-full object-cover"
                      onError={() => {
                        // Jika ada error loading gambar
                        console.error("Error loading profile image");
                        setPhotoError(true);
                      }}
                    />
                  ) : (
                    <div className="h-24 w-24 flex items-center justify-center text-primary text-4xl font-bold">
                      {(displayName || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="profile-image-upload" 
                  className={`absolute bottom-0 right-0 ${
                    uploadingPhoto 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary-dark'
                  } text-white p-2 rounded-full shadow-md transition-colors duration-200`}
                  onClick={handlePhotoClick}
                  title={uploadingPhoto ? uploadStatus : "Ubah Foto Profil"}
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <FiCamera size={18} />
                  )}
                </label>
                <input 
                  id="profile-image-upload"
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Petunjuk Upload Foto */}
        <div className="text-xs text-gray-500 text-center mb-4 px-4">
          <p>Ukuran maksimal foto: 2MB</p>
          <p>Format yang didukung: JPG, PNG, GIF</p>
          <p className="mt-1 italic">Ukuran optimal: 96x96 pixel untuk avatar</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mb-4 text-sm">
            <strong className="font-bold">Gagal: </strong>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
              Nama Tampilan
            </label>
            <div className="relative">
              <input
                id="displayName"
                type="text"
                placeholder="Masukkan nama tampilan Anda"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FiUser className="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
              Nomor Telepon
            </label>
            <div className="relative">
              <input
                id="phoneNumber"
                type="text"
                placeholder="Cth: +6281234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FiPhone className="absolute left-3 top-3 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: +62xxxxxxxxxx (dengan kode negara)
            </p>
          </div>

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Profil berhasil disimpan!
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="mr-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition-colors duration-200"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Simpan Profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 