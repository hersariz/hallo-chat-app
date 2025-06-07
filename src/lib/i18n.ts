import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Inisialisasi i18next untuk client-side translation
// Ini dapat digunakan sebagai fallback jika API terjemahan gagal
i18n
  .use(initReactI18next)
  .init({
    resources: {
      // Indonesia (bahasa default)
      id: {
        translation: {
          // Umum
          'welcome': 'Selamat datang',
          'hello': 'Halo',
          'selectLanguage': 'Pilih bahasa',
          'loading': 'Memuat...',
          'error': 'Terjadi kesalahan',
          'retry': 'Coba lagi',
          'save': 'Simpan',
          'cancel': 'Batal',
          'delete': 'Hapus',
          'edit': 'Edit',
          'send': 'Kirim',
          'search': 'Cari',
          
          // Aplikasi
          'newChat': 'Chat Baru',
          'settings': 'Pengaturan',
          'translate': 'Terjemahkan',
          'copyToClipboard': 'Salin ke clipboard',
          'typeYourMessage': 'Ketik pesan Anda...',
          
          // Pesan status
          'messageSent': 'Pesan terkirim',
          'messageDelivered': 'Pesan tersampaikan',
          'messageRead': 'Pesan dibaca',
        }
      },
      // English
      en: {
        translation: {
          // General
          'welcome': 'Welcome',
          'hello': 'Hello',
          'selectLanguage': 'Select language',
          'loading': 'Loading...',
          'error': 'An error occurred',
          'retry': 'Retry',
          'save': 'Save',
          'cancel': 'Cancel',
          'delete': 'Delete',
          'edit': 'Edit',
          'send': 'Send',
          'search': 'Search',
          
          // Application
          'newChat': 'New Chat',
          'settings': 'Settings',
          'translate': 'Translate',
          'copyToClipboard': 'Copy to clipboard',
          'typeYourMessage': 'Type your message...',
          
          // Status messages
          'messageSent': 'Message sent',
          'messageDelivered': 'Message delivered',
          'messageRead': 'Message read',
        }
      },
      // Jawa
      jw: {
        translation: {
          // Umum
          'welcome': 'Sugeng rawuh',
          'hello': 'Halo',
          'selectLanguage': 'Pilih basa',
          'loading': 'Ngenteni...',
          'error': 'Ana kesalahan',
          'retry': 'Coba maneh',
          'save': 'Simpen',
          'cancel': 'Batal',
          'delete': 'Busak',
          'edit': 'Owahi',
          'send': 'Kirim',
          'search': 'Golek',
          
          // Aplikasi
          'newChat': 'Obrolan Anyar',
          'settings': 'Setelan',
          'translate': 'Terjemahke',
          'copyToClipboard': 'Salin kanggo clipboard',
          'typeYourMessage': 'Ketik pesen sampeyan...',
          
          // Pesan status
          'messageSent': 'Pesen dikirim',
          'messageDelivered': 'Pesen ditompo',
          'messageRead': 'Pesen diwoco',
        }
      },
    },
    fallbackLng: 'id',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // tidak perlu escape karena React sudah aman dari XSS
    }
  });

export default i18n;

// Definisi tipe untuk kamus terjemahan
interface DictionaryEntry {
  [word: string]: string;
}

interface LanguageDictionary {
  [targetLang: string]: DictionaryEntry;
}

interface SimpleDictionary {
  [sourceLang: string]: LanguageDictionary;
}

// Kamus kecil untuk kata-kata umum
const simpleDictionary: SimpleDictionary = {
  // Indonesia -> English
  id: {
    en: {
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
      'kami': 'we',
      'kita': 'we (inclusive)',
      'dan': 'and',
      'atau': 'or',
      'tapi': 'but',
      'jika': 'if',
      'maka': 'then',
      'tidak': 'no/not',
      'ya': 'yes',
      'benar': 'correct/true',
      'salah': 'wrong/false',
      'sudah': 'already',
      'belum': 'not yet',
      'akan': 'will',
      'sedang': 'currently',
      'telah': 'have',
      'bisa': 'can',
      'tolong': 'please/help',
      'maaf': 'sorry',
      'permisi': 'excuse me',
      'sampai': 'until',
      'jumpa': 'meet',
      'senang': 'happy',
      'sedih': 'sad',
      'marah': 'angry',
      'takut': 'afraid',
      'cinta': 'love',
      'benci': 'hate'
    },
    // Indonesia -> Jawa
    jw: {
      'selamat': 'sugeng',
      'pagi': 'enjing',
      'siang': 'siang',
      'malam': 'dalu',
      'halo': 'halo',
      'terima': 'matur',
      'kasih': 'nuwun',
      'bagaimana': 'pripun',
      'kabar': 'kabar',
      'baik': 'sae/becik',
      'buruk': 'awon',
      'apa': 'menapa',
      'siapa': 'sinten',
      'kapan': 'kapan',
      'dimana': 'wonten pundi',
      'mengapa': 'kenging menapa',
      'saya': 'kula',
      'kamu': 'sampeyan',
      'dia': 'piyambakipun',
      'mereka': 'piyambakipun sedaya',
      'kami': 'kita sedaya',
      'kita': 'kita sedaya',
      'dan': 'lan',
      'atau': 'utawi',
      'tapi': 'nanging',
      'jika': 'menawi',
      'maka': 'mangka',
      'tidak': 'boten',
      'ya': 'nggih',
      'benar': 'leres',
      'salah': 'lepat',
      'sudah': 'sampun',
      'belum': 'dereng',
      'akan': 'badhe',
      'sedang': 'saweg',
      'telah': 'sampun',
      'bisa': 'saged',
      'tolong': 'tulung',
      'maaf': 'nyuwun pangapunten',
      'permisi': 'nuwun sewu',
      'sampai': 'ngantos',
      'jumpa': 'panggih',
      'senang': 'seneng',
      'sedih': 'sedhih',
      'marah': 'duka',
      'takut': 'ajrih',
      'cinta': 'tresna',
      'benci': 'sengit'
    }
  }
};

// Fungsi untuk menerjemahkan kata per kata dengan simple dictionary
const translateWordByWord = (text: string, sourceLang: string, targetLang: string): string => {
  // Hanya mendukung dari bahasa Indonesia untuk saat ini
  if (sourceLang !== 'id') return text;
  
  // Pastikan dict untuk bahasa target tersedia
  if (!simpleDictionary[sourceLang]?.[targetLang]) return text;
  
  const dict = simpleDictionary[sourceLang][targetLang];
  
  // Memisahkan teks menjadi kata-kata
  const words = text.toLowerCase().split(/\s+/);
  
  // Terjemahkan setiap kata jika ada di kamus
  const translatedWords = words.map(word => {
    // Bersihkan kata dari tanda baca
    const cleanWord = word.replace(/[.,?!;:()]/g, '');
    
    // Cari terjemahan
    const translation = dict[cleanWord];
    
    // Jika ada terjemahan, gunakan. Jika tidak, gunakan kata asli
    return translation || word;
  });
  
  return translatedWords.join(' ');
};

// Fungsi alternatif menggunakan Lingva Translate (tidak perlu API key dan lebih stabil)
const translateWithLingva = async (text: string, targetLang: string, sourceLang: string = 'id'): Promise<string> => {
  try {
    // Lingva instances dan alternatif lain yang sejenis
    const alternateInstances = [
      'https://lingva.ml',
      'https://lingva.pussthecat.org',
      'https://translate.argosopentech.com'
    ];
    
    // Coba beberapa instance secara berurutan jika gagal
    let lastError = null;
    
    for (const instance of alternateInstances) {
      try {
        console.log(`Mencoba Lingva instance: ${instance}`);
        
        // Coba gunakan API Lingva
        const isLingvaInstance = instance.includes('lingva');
        if (isLingvaInstance) {
          const url = `${instance}/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            // Timeout 8 detik
            signal: AbortSignal.timeout(8000),
          });
          
          if (!response.ok) {
            throw new Error(`Lingva API error: ${response.status}`);
          }
          
          const data = await response.json();
          if (data && data.translation) {
            return data.translation;
          }
          
          throw new Error('Invalid response from Lingva');
        } else {
          // Jika bukan Lingva instance, coba gunakan sebagai proxy translator
          const url = `${instance}/api/translate`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: text,
              source: sourceLang,
              target: targetLang,
            }),
            signal: AbortSignal.timeout(8000),
          });
          
          if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
          }
          
          const data = await response.json();
          if (data && (data.translation || data.translatedText)) {
            return data.translation || data.translatedText;
          }
          
          throw new Error('Invalid response from translation API');
        }
      } catch (instanceError) {
        console.warn(`Error with translation instance ${instance}:`, instanceError);
        lastError = instanceError;
        // Coba instance berikutnya
        continue;
      }
    }
    
    // Jika semua instance gagal
    throw lastError || new Error('All translation services failed');
  } catch (error) {
    console.error('Error calling translation services from client:', error);
    throw error;
  }
};

// Alternatif lain: Simulasi terjemahan sederhana dengan kamus statis
const translateWithDictionary = (text: string, targetLang: string): string => {
  // Ini hanya contoh sederhana
  if (targetLang === 'en') {
    // Kamus sederhana Indonesia ke Inggris
    const dictIdEn: {[key: string]: string} = {
      'halo': 'hello',
      'selamat': 'congratulations',
      'pagi': 'morning',
      'siang': 'afternoon',
      'malam': 'evening/night',
      'terima kasih': 'thank you',
      'bagaimana kabarmu': 'how are you',
      'baik': 'good',
      'ya': 'yes',
      'tidak': 'no',
      'tolong': 'please',
      'maaf': 'sorry',
      'saya': 'I',
      'kamu': 'you'
    };
    
    return text.split(' ').map(word => {
      const lowerWord = word.toLowerCase().replace(/[.,!?;:]/, '');
      return dictIdEn[lowerWord] || word;
    }).join(' ');
  } else if (targetLang === 'id') {
    // Kamus sederhana Inggris ke Indonesia
    const dictEnId: {[key: string]: string} = {
      'hello': 'halo',
      'hi': 'hai',
      'good': 'baik',
      'morning': 'pagi',
      'afternoon': 'siang',
      'evening': 'malam',
      'night': 'malam',
      'thank you': 'terima kasih',
      'how are you': 'bagaimana kabarmu',
      'yes': 'ya',
      'no': 'tidak',
      'please': 'tolong',
      'sorry': 'maaf',
      'i': 'saya',
      'you': 'kamu'
    };
    
    return text.split(' ').map(word => {
      const lowerWord = word.toLowerCase().replace(/[.,!?;:]/, '');
      return dictEnId[lowerWord] || word;
    }).join(' ');
  }
  
  // Default: kembalikan teks asli dengan label
  return `[${targetLang.toUpperCase()}] ${text}`;
};

// Fungsi untuk menerjemahkan teks secara client-side
export const translateClientSide = async (
  text: string, 
  targetLang: string = 'en'
): Promise<{
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  sourceLang: string;
  targetLang: string;
  error?: string | null;
}> => {
  // Deteksi bahasa (anggap selalu Bahasa Indonesia untuk sederhananya)
  const detectedLang = 'id';
  
  try {
    // Strategi 1: Coba terjemahkan menggunakan kamus statis i18next
    const keys = Object.keys(i18n.getDataByLanguage('id')?.translation || {});
    const matchedKey = keys.find(key => 
      i18n.getDataByLanguage('id')?.translation?.[key] === text
    );
    
    if (matchedKey) {
      // Jika ditemukan, ambil terjemahan dari bahasa target
      const translatedText = i18n.getDataByLanguage(targetLang)?.translation?.[matchedKey];
      if (translatedText) {
        return {
          originalText: text,
          translatedText,
          detectedLanguage: detectedLang,
          sourceLang: detectedLang,
          targetLang
        };
      }
    }
    
    // Strategi 2: Coba terjemahkan kata per kata dengan kamus sederhana 
    const wordByWordTranslation = translateWordByWord(text, detectedLang, targetLang);
    
    // Cek apakah hasil terjemahan kata per kata berbeda dari aslinya
    // Jika berbeda, artinya ada beberapa kata yang berhasil diterjemahkan
    if (wordByWordTranslation.toLowerCase() !== text.toLowerCase()) {
      return {
        originalText: text,
        translatedText: wordByWordTranslation,
        detectedLanguage: detectedLang,
        sourceLang: detectedLang,
        targetLang,
        error: null
      };
    }
    
    // Strategi 3: Coba gunakan Lingva Translate API
    try {
      console.log('Mencoba terjemahan dengan Lingva API...');
      const lingvaTranslation = await translateWithLingva(text, targetLang, detectedLang);
      return {
        originalText: text,
        translatedText: lingvaTranslation,
        detectedLanguage: detectedLang, 
        sourceLang: detectedLang,
        targetLang,
        error: null
      };
    } catch (lingvaError) {
      console.error('Lingva API error:', lingvaError);
      // Lanjut ke strategi berikutnya jika Lingva gagal
    }
    
    // Jika Lingva gagal, gunakan terjemahan kamus
    console.log('Menggunakan terjemahan kamus sederhana...');
    const dictionaryTranslation = translateWithDictionary(text, targetLang);
    return {
      originalText: text,
      translatedText: dictionaryTranslation,
      detectedLanguage: detectedLang,
      sourceLang: detectedLang,
      targetLang,
      error: null
    };
  } catch (error) {
    console.error('Client-side translation error:', error);
    
    // Fallback final: Gunakan label sederhana
    return {
      originalText: text,
      translatedText: `[${targetLang.toUpperCase()}] ${text}`,
      detectedLanguage: detectedLang,
      sourceLang: detectedLang, 
      targetLang,
      error: null // Tidak menampilkan error kepada pengguna
    };
  }
}; 