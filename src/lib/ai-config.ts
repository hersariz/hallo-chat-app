import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AIConfig } from './types';
import { DEFAULT_MODEL } from './qwen';

// Default AI config
export const DEFAULT_AI_CONFIG: AIConfig = {
  defaultLanguage: 'id',
  autoTranslate: false,
  customInstructions: '',
  model: DEFAULT_MODEL,
};

/**
 * Mengambil konfigurasi AI dari Firestore
 */
export const getAIConfig = async (userId: string): Promise<AIConfig> => {
  try {
    const configRef = doc(db, 'users', userId, 'settings', 'ai-config');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      return configDoc.data() as AIConfig;
    }
    
    // Jika belum ada, buat dengan konfigurasi default
    await setDoc(configRef, DEFAULT_AI_CONFIG);
    return DEFAULT_AI_CONFIG;
  } catch (error) {
    console.error('Error saat mengambil konfigurasi AI:', error);
    return DEFAULT_AI_CONFIG;
  }
};

/**
 * Menyimpan konfigurasi AI ke Firestore
 */
export const saveAIConfig = async (userId: string, config: AIConfig): Promise<boolean> => {
  try {
    const configRef = doc(db, 'users', userId, 'settings', 'ai-config');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      await updateDoc(configRef, config);
    } else {
      await setDoc(configRef, config);
    }
    
    return true;
  } catch (error) {
    console.error('Error saat menyimpan konfigurasi AI:', error);
    return false;
  }
}; 