'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSettings, FiSave } from 'react-icons/fi';
import { AIConfig } from '@/lib/types';
import { getModelDisplayName } from '@/lib/qwen';

// Daftar bahasa yang didukung
const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Indonesia' },
  { code: 'en', name: 'Inggris' },
  { code: 'jw', name: 'Jawa' },
  { code: 'ja', name: 'Jepang' },
  { code: 'ko', name: 'Korea' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'ar', name: 'Arab' },
  { code: 'es', name: 'Spanyol' },
  { code: 'fr', name: 'Prancis' },
  { code: 'de', name: 'Jerman' },
  { code: 'ru', name: 'Rusia' },
];

// Daftar model yang didukung
const SUPPORTED_MODELS = [
  { id: 'qwen/qwen1.5-32b-chat', name: 'Qwen 1.5 32B', available: true },
  { id: 'qwen/qwen3-32b:free', name: 'Qwen 3 32B', available: true },
];

type AISettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
};

export default function AISettingsModal({
  isOpen,
  onClose,
  config,
  onSave,
}: AISettingsModalProps) {
  // State untuk konfigurasi lokal
  const [localConfig, setLocalConfig] = useState<AIConfig>({
    defaultLanguage: 'id',
    customInstructions: '',
    model: 'qwen/qwen3-32b:free',
    translateLanguage: 'en',
    autoTranslate: false,
  });

  // Set konfigurasi dari prop saat modal dibuka
  useEffect(() => {
    if (isOpen && config) {
      setLocalConfig({
        ...config,
        // Pastikan nilai default jika tidak ada
        defaultLanguage: config.defaultLanguage || 'id',
        model: config.model || 'qwen/qwen3-32b:free',
        translateLanguage: config.translateLanguage || 'en',
        autoTranslate: config.autoTranslate || false
      });
    }
  }, [isOpen, config]);

  // Handle perubahan bahasa default
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig({
      ...localConfig,
      defaultLanguage: e.target.value,
    });
  };

  // Handle perubahan instruksi kustom
  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalConfig({
      ...localConfig,
      customInstructions: e.target.value,
    });
  };

  // Handle perubahan model
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig({
      ...localConfig,
      model: e.target.value,
    });
  };

  // Handle simpan pengaturan
  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary text-white">
          <h2 className="text-xl font-semibold flex items-center">
            <FiSettings className="mr-2" />
            Pengaturan AI
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-full"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model AI
            </label>
            <select
              value={localConfig.model}
              onChange={handleModelChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SUPPORTED_MODELS.map((model) => (
                <option 
                  key={model.id} 
                  value={model.id}
                  disabled={!model.available}
                >
                  {model.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Model menentukan kemampuan dan kecepatan respons AI
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Menggunakan: {getModelDisplayName(localConfig.model)}
            </p>
          </div>

          {/* Default Language */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bahasa Default
            </label>
            <select
              value={localConfig.defaultLanguage}
              onChange={handleLanguageChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Bahasa yang akan digunakan AI untuk menjawab pertanyaan kamu
            </p>
          </div>

          {/* Custom Instructions */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instruksi Khusus untuk AI
            </label>
            <textarea
              value={localConfig.customInstructions}
              onChange={handleCustomInstructionsChange}
              placeholder="Tambahkan instruksi khusus untuk AI, seperti: 'Selalu jawab dalam bahasa Indonesia' atau 'Bicara dengan gaya informal'"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
            <p className="mt-1 text-sm text-gray-500">
              Instruksi ini akan digunakan untuk semua percakapan dengan AI
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary flex items-center"
          >
            <FiSave className="mr-2" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
} 