'use client';

import { useState, useEffect } from 'react';
import { FiX, FiGlobe, FiSave } from 'react-icons/fi';
import { useAIConfig } from '@/lib/context';

// Daftar bahasa yang didukung untuk terjemahan
const AVAILABLE_LANGUAGES = [
  {
    code: 'en',
    name: 'Inggris'
  },
  {
    code: 'id',
    name: 'Indonesia'
  },
  {
    code: 'jw',
    name: 'Jawa'
  },
  {
    code: 'su',
    name: 'Sunda'
  },
  {
    code: 'ar',
    name: 'Arab'
  },
  {
    code: 'zh',
    name: 'Mandarin'
  },
  {
    code: 'ru',
    name: 'Rusia'
  }
];

type TranslateSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TranslateSettingsModal({
  isOpen,
  onClose
}: TranslateSettingsModalProps) {
  const { aiConfig, updateAIConfig } = useAIConfig();
  
  // State untuk pengaturan terjemahan
  const [selectedLanguage, setSelectedLanguage] = useState(aiConfig.translateLanguage || 'en');
  const [autoTranslate, setAutoTranslate] = useState(aiConfig.autoTranslate || false);
  
  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(aiConfig.translateLanguage || 'en');
      setAutoTranslate(aiConfig.autoTranslate || false);
    }
  }, [isOpen, aiConfig.translateLanguage, aiConfig.autoTranslate]);
  
  // Simpan pengaturan terjemahan
  const handleSaveSettings = () => {
    updateAIConfig({
      ...aiConfig,
      translateLanguage: selectedLanguage,
      autoTranslate: autoTranslate
    });
    
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-scaleIn">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <FiGlobe className="mr-2" />
            <h2 className="text-lg font-medium">Pengaturan Terjemahan</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bahasa Terjemahan Default
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Pesan akan diterjemahkan ke bahasa ini saat Anda menggunakan fitur terjemahan.
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="autoTranslate"
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="autoTranslate" className="ml-2 block text-sm font-medium text-gray-700">
                Terjemahkan Otomatis
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Saat diaktifkan, pesan yang diterima akan otomatis diterjemahkan ke bahasa pilihan Anda.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center"
          >
            <FiSave className="mr-2" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
} 