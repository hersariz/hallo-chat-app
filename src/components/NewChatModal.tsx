'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { FiSearch, FiUser, FiX, FiPhone, FiUsers, FiMessageSquare, FiPlus } from 'react-icons/fi';

type User = {
  id: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL?: string;
  isOnline?: boolean;
};

type NewChatModalProps = {
  onClose: () => void;
  onCreateChat?: (userId: string) => void;
  currentUserId?: string;
  userId?: string;
  onContactSelect?: (contact: { name: string, phoneNumber: string }) => void;
};

export default function NewChatModal({
  onClose,
  onCreateChat,
  currentUserId,
  userId,
  onContactSelect
}: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showContactsScreen, setShowContactsScreen] = useState(false);

  // Gunakan userId atau currentUserId (untuk kompatibilitas)
  const activeUserId = userId || currentUserId || '';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm || searchTerm.length < 3) return;
      
      setLoading(true);
      setErrorMessage('');
      
      try {
        console.log('Searching for users with term:', searchTerm);
        
        // Gunakan query sederhana untuk menghindari kebutuhan indeks komposit
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('email'),
          limit(20)
        );
        
        const snapshot = await getDocs(usersQuery);
        console.log('Found users:', snapshot.size);
        
        const usersData: User[] = [];
        
        // Filter hasil di sisi klien untuk mencocokkan searchTerm dengan email atau nomor telepon
        snapshot.forEach((doc) => {
          const userData = doc.data();
          if (doc.id !== activeUserId && 
              ((userData.email && userData.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (userData.phoneNumber && userData.phoneNumber.includes(searchTerm)))) {
            usersData.push({
              id: doc.id,
              displayName: userData.displayName || null,
              email: userData.email || null,
              phoneNumber: userData.phoneNumber || null,
              photoURL: userData.photoURL,
              isOnline: userData.isOnline
            });
          }
        });
        
        setUsers(usersData.slice(0, 10)); // Batasi hingga 10 hasil
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setErrorMessage(error.message || 'Terjadi kesalahan saat mencari pengguna');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, activeUserId]);

  // Handler untuk menangani pilihan pengguna
  const handleUserSelect = (user: User) => {
    if (onCreateChat) {
      onCreateChat(user.id);
    } else if (onContactSelect && user.phoneNumber) {
      onContactSelect({
        name: user.displayName || 'Pengguna',
        phoneNumber: user.phoneNumber
      });
    }
  };

  // Fungsi untuk membuka WhatsApp dengan nomor telepon
  const openWhatsApp = (phoneNumber: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Hindari memicu onCreateChat
    if (!phoneNumber) return;
    
    // Bersihkan nomor telepon (hanya angka dan +)
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white/90 backdrop-blur-md w-full max-w-md mx-4 rounded-2xl shadow-xl animate-scaleIn overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark via-primary to-secondary p-5 text-white relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex justify-between items-center">
            <h2 className="text-xl font-bold">{showContactsScreen ? 'Pilih Kontak' : 'Chat Baru'}</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md animate-fadeIn">
              <p className="text-sm">Error: {errorMessage}</p>
              <button 
                onClick={() => {
                  setLoading(true);
                  setSearchTerm(searchTerm);
                }}
                className="mt-2 text-primary hover:underline"
              >
                Coba lagi
              </button>
            </div>
          ) : showContactsScreen ? (
            <>
              {/* Search */}
              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="Cari kontak..."
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              
              {/* Contact list */}
              <div className="max-h-96 overflow-y-auto rounded-xl">
                {users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="font-medium">
                              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {user.displayName || user.email?.split('@')[0] || 'User'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                        </div>
                        {user.isOnline && (
                          <span className="ml-auto w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiUsers className="text-gray-400" size={24} />
                    </div>
                    <p>Tidak ada kontak ditemukan</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <FiMessageSquare className="text-primary" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Mulai Percakapan Baru</h3>
                <p className="text-gray-500 text-sm mb-6">Pilih cara untuk memulai percakapan baru</p>
                
                <button
                  onClick={() => setShowContactsScreen(true)}
                  className="w-full py-3 mb-3 bg-primary hover:bg-dark text-white rounded-xl transition-colors shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center"
                >
                  <FiUsers className="mr-2" />
                  Pilih dari Daftar Kontak
                </button>
                
                <p className="text-center text-gray-500 text-sm my-2">atau</p>
                
                <button
                  onClick={() => {
                    // Implementasi menambahkan kontak baru
                  }}
                  className="w-full py-3 border border-primary text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center"
                >
                  <FiPlus className="mr-2" />
                  Tambah Kontak Baru
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 