import { NextResponse } from 'next/server';
import { TranslationResult } from '@/lib/types';

// Fallback API key jika tidak tersedia di .env.local - GUNAKAN HANYA UNTUK DEVELOPMENT!
// Pada lingkungan produksi, Anda HARUS menyediakan API key Anda sendiri di .env.local
const FALLBACK_API_KEY = '';

// Function untuk menggunakan Google Translate API (jika ada API key)
async function translateWithGoogleAPI(text: string, targetLang: string): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || FALLBACK_API_KEY;
    
    if (!apiKey) {
      throw new Error('No Google Translate API key available');
    }
    
    // Gunakan fetch untuk memanggil Google Translate API
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: 'text'
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    } else {
      throw new Error('Invalid response format from Google Translate API');
    }
  } catch (error) {
    console.error('Error calling Google Translate API:', error);
    throw error;
  }
}

// Function fallback terjemahan sederhana tanpa API
function translateWithLocalDictionary(text: string, targetLang: string, sourceLang: string = 'id'): string {
  // Kamus sederhana untuk terjemahan lokal
  const localDictionary: {[lang: string]: {[lang: string]: {[word: string]: string}}} = {
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
        'benci': 'hate',
        'bicara': 'speak/talk',
        'bahasa': 'language',
        'inggris': 'english',
        'indonesia': 'indonesian',
        'belajar': 'learn/study',
        'bantu': 'help',
        'makan': 'eat',
        'minum': 'drink',
        'tidur': 'sleep',
        'berjalan': 'walk',
        'berlari': 'run',
        'pulang': 'go home',
        'pergi': 'go',
        'datang': 'come',
        'baru': 'new',
        'lama': 'old/long time',
        'besar': 'big',
        'kecil': 'small',
        'tinggi': 'tall/high',
        'rendah': 'short/low',
        'panas': 'hot',
        'dingin': 'cold',
      },
      // Indonesia -> Jawa
      'jw': {
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
        'benci': 'sengit',
        'bicara': 'wicanten',
        'bahasa': 'basa',
        'inggris': 'inggris',
        'indonesia': 'indonesia',
        'belajar': 'sinau',
        'bantu': 'bantu',
        'makan': 'nedha',
        'minum': 'ngunjuk',
        'tidur': 'tilem',
        'berjalan': 'mlampah',
        'berlari': 'mlayu',
        'pulang': 'wangsul',
        'pergi': 'kesah',
        'datang': 'rawuh',
        'baru': 'enggal',
        'lama': 'dangu',
        'besar': 'ageng',
        'kecil': 'alit',
        'tinggi': 'inggil',
        'rendah': 'andhap',
        'panas': 'panas',
        'dingin': 'asrep',
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
        'are': 'adalah',
        'you': 'kamu',
        'i': 'saya',
        'we': 'kami',
        'they': 'mereka',
        'he': 'dia (laki-laki)',
        'she': 'dia (perempuan)',
        'it': 'itu',
        'that': 'itu',
        'this': 'ini',
        'yes': 'ya',
        'no': 'tidak',
        'thank': 'terima',
        'thanks': 'terima kasih',
        'please': 'tolong',
        'sorry': 'maaf',
        'excuse': 'permisi',
        'help': 'bantuan',
        'want': 'ingin',
        'eat': 'makan',
        'drink': 'minum',
        'sleep': 'tidur',
        'walk': 'jalan',
        'run': 'lari',
        'go': 'pergi',
        'come': 'datang',
        'can': 'bisa',
        'speak': 'bicara',
        'talk': 'bicara',
        'understand': 'mengerti',
        'know': 'tahu',
        'learn': 'belajar',
        'study': 'belajar',
        'language': 'bahasa',
        'english': 'bahasa inggris',
        'indonesian': 'bahasa indonesia',
        'what': 'apa',
        'when': 'kapan',
        'where': 'dimana',
        'why': 'mengapa',
        'who': 'siapa',
        'which': 'yang mana',
        'do': 'lakukan',
        'have': 'punya',
        'be': 'adalah',
        'and': 'dan',
        'or': 'atau',
        'but': 'tapi',
        'if': 'jika',
        'because': 'karena',
        'then': 'kemudian',
        'next': 'selanjutnya',
        'previous': 'sebelumnya',
        'now': 'sekarang',
        'later': 'nanti',
        'today': 'hari ini',
        'tomorrow': 'besok',
        'yesterday': 'kemarin',
      }
    }
  };

  // Cek apakah ada kamus untuk bahasa sumber dan target
  if (!localDictionary[sourceLang] || !localDictionary[sourceLang][targetLang]) {
    // Fallback ke label jika kamus tidak tersedia
    return `[${targetLang.toUpperCase()}] ${text}`;
  }

  // Pecah teks menjadi kata-kata
  const words = text.toLowerCase().split(/\s+/);
  const dictionary = localDictionary[sourceLang][targetLang];
  
  // Terjemahkan setiap kata jika ada di kamus
  const translatedWords = words.map(word => {
    // Bersihkan kata dari tanda baca
    const cleanWord = word.replace(/[.,?!;:()]/g, '');
    
    // Cek kamus
    if (dictionary[cleanWord]) {
      return dictionary[cleanWord];
    }
    
    // Jika tidak ditemukan, gunakan kata asli
    return word;
  });
  
  return translatedWords.join(' ');
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const data = await req.json();
    const { text, targetLang } = data;
    
    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing text or targetLang parameter' }, 
        { status: 400 }
      );
    }
    
    // Log untuk debugging
    console.log(`[API] Translating text: "${text}" to ${targetLang}`);
    
    // Deteksi bahasa (anggap selalu Bahasa Indonesia untuk sederhananya)
    const detectedLang = 'id';
    
    let translatedContent = '';
    let errorMsg = null;
    
    // Pertama coba gunakan Google API jika ada API key
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY || FALLBACK_API_KEY;
    if (googleApiKey) {
      try {
        translatedContent = await translateWithGoogleAPI(text, targetLang);
        console.log(`[API] Google Translation result: "${translatedContent}"`);
      } catch (googleError: any) {
        console.error('[API] Google Translate API error:', googleError);
        errorMsg = `Google Translate failed: ${googleError.message || 'Unknown error'}`;
        
        // Fallback ke terjemahan lokal dengan kamus
        console.log('[API] Using local dictionary translation');
        translatedContent = translateWithLocalDictionary(text, targetLang, detectedLang);
      }
    } else {
      // Jika tidak ada Google API key, langsung gunakan kamus lokal
      console.log('[API] No API key, using local dictionary translation');
      translatedContent = translateWithLocalDictionary(text, targetLang, detectedLang);
    }
    
    const result: TranslationResult = {
      originalText: text,
      translatedText: translatedContent,
      detectedLanguage: detectedLang,
      sourceLang: detectedLang,
      targetLang: targetLang,
      error: errorMsg
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Translation API error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text', details: error.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
} 