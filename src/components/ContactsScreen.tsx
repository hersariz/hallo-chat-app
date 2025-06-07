'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/firebase/config';
import { collection, query, where, orderBy, getDocs, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { FiSearch, FiUser, FiPhone, FiPlus, FiMoreVertical, FiArrowLeft, FiTrash2, FiEdit } from 'react-icons/fi';
import AddContactModal from './AddContactModal';

type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  createdAt: any;
};

type ContactsScreenProps = {
  user: User;
  onBack?: () => void;
  onSelectContact?: (contact: { name: string, phoneNumber: string }) => void;
  onContactSelect?: (contact: { name: string, phoneNumber: string }) => void;
  isMobileView?: boolean;
};

export default function ContactsScreen({
  user,
  onBack,
  onSelectContact,
  onContactSelect,
  isMobileView = false
}: ContactsScreenProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const contactsQuery = query(
          collection(db, 'contacts'),
          where('userId', '==', user.uid),
          orderBy('name')
        );
        
        const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
          const contactsList: Contact[] = [];
          snapshot.forEach((doc) => {
            contactsList.push({
              id: doc.id,
              ...doc.data()
            } as Contact);
          });
          
          setContacts(contactsList);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching contacts:', error);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up contacts listener:', error);
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user.uid]);

  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    
    return (
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(searchTerm)
    );
  });

  const handleAddContact = () => {
    setShowAddModal(true);
  };

  const handleContactAdded = () => {
    // Refresh akan dilakukan oleh listener onSnapshot
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      setShowActionMenu(false);
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Gagal menghapus kontak');
    }
  };

  const handleContactClick = (contact: Contact) => {
    if (onContactSelect) {
      onContactSelect({
        name: contact.name,
        phoneNumber: contact.phoneNumber
      });
    } else if (onSelectContact) {
      onSelectContact({
        name: contact.name,
        phoneNumber: contact.phoneNumber
      });
    }
  };

  const handleContactMoreClick = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation();
    setSelectedContactId(contactId);
    setActionMenuPosition({ 
      top: e.clientY, 
      left: e.clientX 
    });
    setShowActionMenu(true);
  };

  const handleOpenWhatsApp = (phoneNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-primary p-4 flex items-center text-white">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
          >
            <FiArrowLeft size={24} />
          </button>
        )}
        <h2 className="text-xl font-medium flex-1">Kontak</h2>
        <button 
          onClick={handleAddContact}
          className="p-2 rounded-full hover:bg-white hover:bg-opacity-20"
          title="Tambah Kontak"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari kontak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-500" />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Memuat kontak...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64">
            {searchTerm ? (
              <p className="text-gray-500 mb-2">Tidak ada kontak ditemukan</p>
            ) : (
              <>
                <p className="text-gray-500 mb-2">Belum ada kontak</p>
                <button
                  onClick={handleAddContact}
                  className="px-4 py-2 bg-primary text-white rounded-full"
                >
                  Tambah Kontak Baru
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="px-4 py-3 border-b flex items-center cursor-pointer hover:bg-gray-50"
              >
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  <FiUser className="text-gray-500 text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    <button
                      onClick={(e) => handleContactMoreClick(e, contact.id)}
                      className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                    >
                      <FiMoreVertical size={18} />
                    </button>
                  </div>
                  <div className="flex items-center text-green-600 mt-1">
                    <FiPhone className="mr-1" size={14} />
                    <span className="text-sm">{contact.phoneNumber}</span>
                    <button
                      onClick={(e) => handleOpenWhatsApp(contact.phoneNumber, e)}
                      className="ml-3 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          currentUserId={user.uid}
          onClose={() => setShowAddModal(false)}
          onContactAdded={handleContactAdded}
        />
      )}

      {/* Action Menu */}
      {showActionMenu && selectedContactId && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowActionMenu(false)}
          />
          <div 
            className="fixed z-50 bg-white rounded-md shadow-lg border overflow-hidden"
            style={{ 
              top: actionMenuPosition.top, 
              left: actionMenuPosition.left < window.innerWidth / 2 ? actionMenuPosition.left : 'auto',
              right: actionMenuPosition.left >= window.innerWidth / 2 ? window.innerWidth - actionMenuPosition.left : 'auto'
            }}
          >
            <button
              onClick={() => {
                // Edit logic here
                setShowActionMenu(false);
              }}
              className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              <FiEdit className="mr-2" /> Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin menghapus kontak ini?')) {
                  handleDeleteContact(selectedContactId);
                }
              }}
              className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
            >
              <FiTrash2 className="mr-2" /> Hapus
            </button>
          </div>
        </>
      )}
    </div>
  );
} 