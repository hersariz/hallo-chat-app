'use client';

import { useState } from 'react';
import { FiX, FiUser, FiPhone, FiPlus } from 'react-icons/fi';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

type AddContactModalProps = {
  currentUserId: string;
  onClose: () => void;
  onContactAdded: () => void;
};

export default function AddContactModal({
  currentUserId,
  onClose,
  onContactAdded
}: AddContactModalProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!name.trim() || !phoneNumber.trim()) {
      setError('Nama dan nomor telepon harus diisi');
      setSaving(false);
      return;
    }

    // Validasi nomor telepon
    if (!/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
      setError('Format nomor telepon tidak valid');
      setSaving(false);
      return;
    }

    try {
      // Periksa apakah kontak dengan nomor yang sama sudah ada
      const existingContactsQuery = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUserId),
        where('phoneNumber', '==', phoneNumber.trim())
      );
      
      const existingContactsSnapshot = await getDocs(existingContactsQuery);
      if (!existingContactsSnapshot.empty) {
        setError('Kontak dengan nomor telepon ini sudah ada');
        setSaving(false);
        return;
      }

      // Simpan kontak baru
      await addDoc(collection(db, 'contacts'), {
        userId: currentUserId,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        onContactAdded();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan kontak');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Tambah Kontak Baru</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Nama
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                placeholder="Masukkan nama kontak"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FiUser className="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>

          <div className="mb-4">
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
              Format: +62xxxxxxxxxx (tanpa spasi)
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Kontak berhasil ditambahkan!
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 flex items-center"
            >
              {saving ? 'Menyimpan...' : (
                <>
                  <FiPlus className="mr-1" /> Tambah Kontak
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 