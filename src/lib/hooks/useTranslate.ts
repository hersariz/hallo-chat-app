'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '@/lib/translate';
import { useAIConfig } from '@/lib/context';
import { TranslationResult } from '@/lib/types';

// Cache untuk menyimpan terjemahan yang sudah pernah dilakukan
const translationCache = new Map<string, TranslationResult>();

export function useTranslate() {
  const { t } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const { aiConfig } = useAIConfig();
  
  // Gunakan ref untuk menyimpan informasi request yang sedang aktif
  const activeRequests = useRef<Record<string, AbortController>>({});
  
  // Fungsi untuk membatalkan permintaan terjemahan yang sedang berlangsung
  const cancelTranslation = useCallback((messageId: string) => {
    if (activeRequests.current[messageId]) {
      activeRequests.current[messageId].abort();
      delete activeRequests.current[messageId];
    }
  }, []);
  
  // Fungsi untuk menerjemahkan pesan
  const translateMessage = useCallback(async (
    text: string,
    messageId?: string,
    customLang?: string
  ): Promise<TranslationResult | null> => {
    if (!text || text.trim() === '') {
      return null;
    }
    
    // Gunakan ID pesan jika disediakan, atau gunakan teks sebagai ID
    const id = messageId || text.substring(0, 20);
    
    // Batalkan permintaan terjemahan sebelumnya untuk pesan yang sama
    cancelTranslation(id);
    
    // Gunakan bahasa target dari aiConfig atau bahasa kustom yang diberikan
    const targetLang = customLang || aiConfig.translateLanguage || 'en';
    
    // Cek cache
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }
    
    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      // Buat controller baru untuk request ini
      const controller = new AbortController();
      activeRequests.current[id] = controller;
      
      // Panggil API terjemahan dengan timeout
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik timeout
      
      try {
        // Menggunakan translateText yang dioptimalkan hanya dengan Lingva
        const result = await translateText(text, targetLang);
        
        // Simpan di cache
        translationCache.set(cacheKey, result);
        
        // Bersihkan timeout dan controller
        clearTimeout(timeoutId);
        delete activeRequests.current[id];
        
        return result;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Request timeout atau dibatalkan
          setTranslationError('Terjemahan dibatalkan atau timeout');
          console.error('Translation aborted or timed out');
          return null;
        }
        
        // Error lainnya
        setTranslationError('Gagal menerjemahkan: ' + (error.message || 'Unknown error'));
        console.error('Translation error:', error);
        return null;
      } finally {
        // Bersihkan timeout
        clearTimeout(timeoutId);
      }
    } catch (e) {
      setTranslationError('Gagal memulai terjemahan');
      console.error('Error starting translation:', e);
      return null;
    } finally {
      setIsTranslating(false);
      // Hapus controller dari daftar aktif
      delete activeRequests.current[id];
    }
  }, [aiConfig.translateLanguage, cancelTranslation]);
  
  // Fungsi untuk auto-translate semua pesan dalam array
  const autoTranslateMessages = useCallback(async (
    messages: Array<{id: string, text: string}>,
    targetLang: string
  ) => {
    // Hanya jika fitur auto-translate diaktifkan
    if (!aiConfig.autoTranslate) {
      return {};
    }
    
    const translationResults: Record<string, TranslationResult> = {};
    
    // Gunakan Promise.all untuk terjemahan paralel yang efisien
    try {
      // Batasi jumlah permintaan paralel dengan proses batch
      const batchSize = 3;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(msg => translateMessage(msg.text, msg.id, targetLang))
        );
        
        // Proses hasil batch
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            translationResults[batch[index].id] = result.value;
          }
        });
        
        // Tunggu sebentar di antara batch untuk menghindari pembatasan API
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    } catch (error) {
      console.error('Error in auto-translate:', error);
    }
    
    return translationResults;
  }, [aiConfig.autoTranslate, translateMessage]);
  
  return {
    translateMessage,
    autoTranslateMessages,
    cancelTranslation,
    isTranslating,
    translationError,
  };
} 