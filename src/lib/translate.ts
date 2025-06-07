import { TranslationResult } from './types';
import { translateClientSide } from './i18n';

// Simple function to generate a basic translation for timeout cases
function generateBasicTranslation(text: string, targetLang: string): TranslationResult {
  return {
    originalText: text,
    translatedText: `[${targetLang.toUpperCase()}] ${text}`, 
    detectedLanguage: 'auto',
    sourceLang: 'auto',
    targetLang: targetLang
  };
}

// Tambahkan fungsi untuk mencatat terjemahan yang sering diminta
const translationCache = new Map<string, TranslationResult>();

// Translation function using our API route
export async function translateText(
  text: string,
  targetLang: string = 'en'
): Promise<TranslationResult> {
  // Jangan terjemahkan string kosong
  if (!text || text.trim() === '') {
    return generateBasicTranslation('', targetLang);
  }
  
  // Cek cache untuk terjemahan yang pernah diminta
  const cacheKey = `${text}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  try {
    // Gunakan langsung translateClientSide karena lebih handal
    console.log(`Menterjemahkan menggunakan client-side translation...`);
    try {
      // Metode client-side (Lingva) lebih handal
      const clientResult = await translateClientSide(text, targetLang);
      translationCache.set(cacheKey, clientResult);
      return clientResult;
    } catch (clientError) {
      console.error('Client-side translation failed:', clientError);
      // Fallback terakhir
      const fallbackResult = generateBasicTranslation(text, targetLang);
      return { ...fallbackResult, error: 'Terjemahan gagal' };
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback terakhir jika semua gagal
    return generateBasicTranslation(text, targetLang);
  }
} 