'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/firebase/config';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { FiX, FiUser, FiPhone, FiSearch, FiStar, FiMessageSquare, FiPlus } from 'react-icons/fi';

type Contact = {
  id: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  lastSeen?: any;
  isOnline?: boolean;
  photoURL?: string;
  name: string;
  isFavorite: boolean;
};

type ContactsModalProps = {
  currentUserId: string;
  onClose: () => void;
  onSelectContact: (userId: string) => void;
};

export default function ContactsModal({
  currentUserId,
  onClose,
  onSelectContact,
}: ContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        // Ambil semua pengguna dari Firestore
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('displayName'),
          limit(50)
        );
        
        const snapshot = await getDocs(usersQuery);
        
        const contactsList: Contact[] = [];
        snapshot.forEach((doc) => {
          // Jangan tampilkan pengguna saat ini
          if (doc.id !== currentUserId) {
            const userData = doc.data();
            contactsList.push({
              id: doc.id,
              displayName: userData.displayName || null,
              email: userData.email || null,
              phoneNumber: userData.phoneNumber || null,
              lastSeen: userData.lastSeen || null,
              isOnline: userData.isOnline || false,
              photoURL: userData.photoURL || undefined,
              name: userData.displayName || '',
              isFavorite: false
            });
          }
        });
        
        setContacts(contactsList);
        setFilteredContacts(contactsList);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setError('Terjadi kesalahan saat mengambil kontak');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [currentUserId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = contacts.filter((contact) => {
        const nameMatch = contact.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = contact.phoneNumber?.includes(searchTerm);
        return nameMatch || emailMatch || phoneMatch;
      });
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

  // Fungsi untuk membuka WhatsApp dengan nomor telepon
  const openWhatsApp = (phoneNumber: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Hindari memicu onSelectContact
    if (!phoneNumber) return;
    
    // Bersihkan nomor telepon (hanya angka dan +)
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const toggleFavorite = (id: string) => {
    const updatedContacts = contacts.map((contact) =>
      contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact
    );
    setContacts(updatedContacts);
    setFilteredContacts(updatedContacts);
  };

  const onAddContact = () => {
    // Implementasi untuk menambahkan kontak baru
    console.log('Menambahkan kontak baru');
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
            <h2 className="text-xl font-bold">Kontak Saya</h2>
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
          
          {/* Tabs */}
          <div className="flex mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'all' 
                ? 'text-primary border-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Semua Kontak
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-2 px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'favorites' 
                ? 'text-primary border-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Favorit
            </button>
          </div>
          
          {/* Contact list */}
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md animate-fadeIn">
              <p className="text-sm">Error: {error}</p>
              <button 
                onClick={() => setLoading(true)} // Re-trigger loading
                className="mt-2 text-primary hover:underline"
              >
                Coba lagi
              </button>
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                      {contact.photoURL ? (
                        <img 
                          src={contact.photoURL} 
                          alt={contact.name} 
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleFavorite(contact.id)}
                        className={`p-2 rounded-full ${
                          contact.isFavorite 
                          ? 'text-yellow-500 hover:bg-yellow-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <FiStar size={18} className={contact.isFavorite ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={() => onSelectContact(contact.id)}
                        className="p-2 rounded-full text-primary hover:bg-primary/10"
                      >
                        <FiMessageSquare size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FiUser className="text-gray-400" size={24} />
              </div>
              <p>Tidak ada kontak ditemukan</p>
            </div>
          )}
          
          {/* Add contact button */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={onAddContact}
              className="w-full py-3 bg-primary hover:bg-dark text-white rounded-xl transition-colors shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center"
            >
              <FiPlus className="mr-2" />
              Tambah Kontak Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 