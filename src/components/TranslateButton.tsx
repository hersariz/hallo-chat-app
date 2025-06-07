'use client';

import { useState } from 'react';
import { FiGlobe, FiLoader, FiX } from 'react-icons/fi';
import { useAIConfig } from '@/lib/context';

interface TranslateButtonProps {
  text: string;
  targetLang?: string;
  className?: string;
}

// Kamus sederhana untuk terjemahan lokal - hanya terbatas pada kata-kata yang sangat umum
const localDictionary: {[sourceLang: string]: {[targetLang: string]: {[word: string]: string}}} = {
  // Indonesia -> English
  'id': {
    'en': {
      'selamat': 'welcome',
      'pagi': 'morning',
      'siang': 'afternoon',
      'malam': 'evening/night',
      'halo': 'hello',
      'hai': 'hi',
      'terima': 'thank',
      'kasih': 'you',
      'bagaimana': 'how',
      'kabar': 'news/condition',
      'baik': 'good',
      'buruk': 'bad',
      'apa': 'what',
      'siapa': 'who',
      'kapan': 'when',
      'dimana': 'where',
      'mengapa': 'why',
      'saya': 'I/me',
      'kamu': 'you',
      'dia': 'he/she',
      'mereka': 'they',
      'tidak': 'no/not',
      'ya': 'yes',
      'tolong': 'please/help',
      'maaf': 'sorry'
    }
  },
  // English -> Indonesia
  'en': {
    'id': {
      'hello': 'halo',
      'hi': 'hai',
      'good': 'baik',
      'morning': 'pagi',
      'afternoon': 'siang',
      'evening': 'malam',
      'night': 'malam',
      'how': 'bagaimana',
      'you': 'kamu',
      'i': 'saya',
      'thank': 'terima kasih',
      'please': 'tolong',
      'sorry': 'maaf',
      'yes': 'ya',
      'no': 'tidak'
    }
  }
};

// Alternatif: Frasa sehari-hari - terbatas hanya pada frasa paling umum
const commonPhrases: {[sourceLang: string]: {[targetLang: string]: {[phrase: string]: string}}} = {
  'id': {
    'en': {
      'selamat pagi': 'good morning',
      'selamat siang': 'good afternoon',
      'selamat malam': 'good evening',
      'terima kasih': 'thank you',
      'apa kabar': 'how are you',
      'saya baik': 'I am fine'
    }
  },
  'en': {
    'id': {
      'good morning': 'selamat pagi',
      'good afternoon': 'selamat siang',
      'good evening': 'selamat malam',
      'thank you': 'terima kasih',
      'how are you': 'apa kabar',
      'i am fine': 'saya baik'
    }
  }
};

// Fungsi terjemahan lokal dengan pendekatan optimasi memori
function translateLocally(text: string, sourceLang: string = 'id', targetLang: string = 'en'): string {
  if (sourceLang === targetLang) return text;
  
  // 1. Pertama, periksa apakah ini adalah frasa yang umum
  const lowerText = text.toLowerCase();
  const phrases = commonPhrases[sourceLang]?.[targetLang];
  if (phrases) {
    for (const [phrase, translation] of Object.entries(phrases)) {
      if (lowerText.includes(phrase)) {
        return text.replace(new RegExp(phrase, 'i'), translation);
      }
    }
  }
  
  // 2. Pecah teks menjadi kata-kata dan terjemahkan maksimal 5 kata pertama saja
  // untuk menghemat proses dan memori
  const words = text.toLowerCase().split(/\s+/).slice(0, 5);
  const dictionary = localDictionary[sourceLang]?.[targetLang];
  
  if (!dictionary) return `[${targetLang.toUpperCase()}] ${text}`;
  
  let hasTranslation = false;
  const translatedWords = words.map(word => {
    // Bersihkan kata dari tanda baca
    const cleanWord = word.replace(/[.,?!;:()]/g, '');
    const punctuation = word.match(/[.,?!;:()]/g) || [];
    
    // Cek kamus
    const translation = dictionary[cleanWord];
    
    // Tandai bahwa setidaknya ada satu kata yang berhasil diterjemahkan
    if (translation) hasTranslation = true;
    
    // Kembalikan terjemahan dengan tanda baca asli
    return translation 
      ? translation + punctuation.join('') 
      : word;
  });
  
  // Jika tidak ada kata yang berhasil diterjemahkan, kembalikan format standar
  if (!hasTranslation) {
    return `[${targetLang.toUpperCase()}] ${text}`;
  }
  
  // Gabungkan kata yang diterjemahkan dengan sisa teks asli
  const restOfText = text.split(/\s+/).slice(5).join(' ');
  return translatedWords.join(' ') + (restOfText ? ' ' + restOfText : '');
}

// Deteksi bahasa lebih akurat
function detectLanguage(text: string): string {
  // Untuk teks pendek yang jelas berbahasa Inggris, langsung kembalikan 'en'
  const lowerText = text.toLowerCase();
  
  // Pattern umum bahasa Inggris: can you, do you, I am, etc.
  const englishPatterns = [
    'can you', 'do you', 'i am', 'how are', 'what is', 'thank you',
    'hello', 'good morning', 'good afternoon', 'good evening', 'please'
  ];
  
  for (const pattern of englishPatterns) {
    if (lowerText.includes(pattern)) {
      return 'en';
    }
  }
  
  // Pattern umum bahasa Indonesia
  const indonesianPatterns = [
    'apa kabar', 'selamat', 'terima kasih', 'tolong', 'bagaimana',
    'boleh', 'saya', 'kamu', 'bisa'
  ];
  
  for (const pattern of indonesianPatterns) {
    if (lowerText.includes(pattern)) {
      return 'id';
    }
  }
  
  // Jika tidak ada pattern yang cocok, gunakan metode perhitungan kata
  const words = text.toLowerCase().split(/\s+/).slice(0, 5);
  let idCount = 0;
  let enCount = 0;
  
  for (const word of words) {
    const cleanWord = word.replace(/[.,?!;:()]/g, '');
    
    if (localDictionary.id?.en?.[cleanWord]) {
      idCount++;
    }
    
    if (localDictionary.en?.id?.[cleanWord]) {
      enCount++;
    }
  }
  
  return idCount >= enCount ? 'id' : 'en';
}

export default function TranslateButton({ text, targetLang, className = '' }: TranslateButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const { aiConfig } = useAIConfig();
  
  const handleTranslate = async () => {
    if (isTranslating) return;
    
    try {
      setIsTranslating(true);
      setTranslatedText("Menerjemahkan...");
      setShowTranslation(true);
      
      // Batasi teks untuk mengurangi beban
      const textToTranslate = text.length > 500 ? text.substring(0, 500) + '...' : text;
      
      // Deteksi bahasa sumber
      const sourceLang = detectLanguage(textToTranslate);
      console.log(`Bahasa terdeteksi: ${sourceLang}`);
      
      // Tentukan bahasa target
      const lang = targetLang || aiConfig.translateLanguage || 'en';
      
      // Jika bahasa sumber sama dengan target, tidak perlu terjemahan
      if (sourceLang === lang) {
        setTranslatedText(textToTranslate);
        setIsTranslating(false);
        return;
      }
      
      // Jika sudah gagal beberapa kali, langsung gunakan terjemahan lokal
      if (errorCount >= 2) {
        console.log('Terlalu banyak error, langsung menggunakan terjemahan lokal');
        const result = translateLocally(textToTranslate, sourceLang, lang);
        setTranslatedText(result);
        setIsTranslating(false);
        return;
      }
      
      // Coba gunakan LibreTranslate API cloud dengan penanganan error yang lebih baik
      try {
        console.log(`Mencoba menggunakan LibreTranslate dari ${sourceLang} ke ${lang}`);
        // Gunakan LibreTranslate sebagai layanan cloud (gratis dan open-source)
        // https://libretranslate.com/ atau instans publik lainnya
        const endpoint = 'https://translate.argosopentech.com/translate';
        
        // Buat controller untuk abort
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({
              q: textToTranslate,
              source: sourceLang,
              target: lang,
              format: 'text'
            }),
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.translatedText) {
              setTranslatedText(data.translatedText);
              setErrorCount(0); // Reset error counter on success
              setIsTranslating(false);
              return;
            }
          }
          // Jika gagal, lanjut ke fallback berikutnya
          throw new Error('Cloud translation failed');
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (cloudError) {
        console.warn('Cloud translation failed, using fallback:', cloudError);
        setErrorCount(prev => prev + 1);
        
        // Coba gunakan Lingva Translate API sebagai alternatif cloud
        try {
          console.log(`Mencoba menggunakan Lingva dari ${sourceLang} ke ${lang}`);
          // Ganti endpoint Lingva yang mungkin lebih stabil
          const endpoint = `https://lingva.ml/api/v1/${encodeURIComponent(sourceLang)}/${encodeURIComponent(lang)}/${encodeURIComponent(textToTranslate)}`;
          
          // Buat controller untuk abort
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const response = await fetch(endpoint, {
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              if (data && data.translation) {
                setTranslatedText(data.translation);
                setErrorCount(0); // Reset error counter on success
                setIsTranslating(false);
                return;
              }
            }
            // Jika masih gagal, gunakan terjemahan lokal
            throw new Error('Alternative cloud translation failed');
          } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
          }
        } catch (alternativeError) {
          console.warn('Alternative cloud translation failed, using local:', alternativeError);
          setErrorCount(prev => prev + 1);
          
          // Gunakan terjemahan lokal sebagai fallback terakhir
          const result = translateLocally(textToTranslate, sourceLang, lang);
          setTranslatedText(result);
        }
      }
    } catch (error) {
      console.error('Gagal menerjemahkan:', error);
      setErrorCount(prev => prev + 1);
      
      // Gunakan terjemahan lokal sebagai fallback akhir
      const sourceLang = detectLanguage(text);
      const lang = targetLang || aiConfig.translateLanguage || 'en';
      const result = translateLocally(text, sourceLang, lang);
      setTranslatedText(result);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleClose = () => {
    setShowTranslation(false);
    setTranslatedText(null);
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleTranslate}
        disabled={isTranslating}
        className={`flex items-center px-2 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition ${className} ${isTranslating ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isTranslating ? (
          <FiLoader className="animate-spin mr-1" />
        ) : (
          <FiGlobe className="mr-1" />
        )}
        {isTranslating ? 'Menerjemahkan...' : 'Terjemahkan'}
      </button>
      
      {showTranslation && translatedText && (
        <div className="mt-2 p-3 bg-gray-100 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold flex items-center">
              <FiGlobe className="mr-1" size={12} />
              Terjemahan
            </span>
            <button 
              onClick={handleClose} 
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              <FiX size={14} />
            </button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{translatedText}</p>
        </div>
      )}
    </div>
  );
} 