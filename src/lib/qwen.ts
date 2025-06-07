import { AIMessage } from './types';

// Konfigurasi untuk OpenRouter dengan model Qwen
const QWEN_API_ENDPOINT = process.env.NEXT_QWEN_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
const QWEN_API_KEY = process.env.NEXT_QWEN_API_KEY || '';

// Model default - gunakan model gratis dari OpenRouter
// Pastikan menggunakan model yang tersedia di OpenRouter
const DEFAULT_MODEL = 'qwen/qwen3-32b:free';

/**
 * Fungsi untuk mendapatkan nama yang lebih user-friendly dari model ID
 */
export function getModelDisplayName(modelId: string): string {
  // Penyederhanaan nama model
  if (modelId.includes('qwen1.5-32b')) {
    return 'Qwen 1.5 32B';
  } else if (modelId.includes('qwen3-32b')) {
    return 'Qwen 3 32B';
  }
  
  // Default jika tidak ada yang cocok
  return 'Qwen AI';
}

// Fungsi untuk menunda eksekusi
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fungsi untuk mengirim pesan ke API Qwen melalui OpenRouter
 * Dengan penanganan error yang lebih baik dan retries
 */
export async function sendMessageToQwen(messages: AIMessage[], model: string = DEFAULT_MODEL) {
  // Jumlah maksimum percobaan
  const MAX_RETRIES = 2;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= MAX_RETRIES) {
    try {
      // Periksa API key
      if (!QWEN_API_KEY) {
        throw new Error('API key OpenRouter tidak tersedia. Periksa konfigurasi .env.local.');
      }

      console.log('Mencoba mengirim pesan ke model:', model);
      console.log('API Endpoint:', QWEN_API_ENDPOINT);

      // Format permintaan sesuai dokumentasi OpenRouter terbaru
      const requestBody = {
        model: model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 3000,
        stream: false
      };
      
      const response = await fetch(QWEN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://hallo-app.com',
          'X-Title': 'Hallo App',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `Error ${response.status}: ${response.statusText}`);
        } catch (e) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }
      
      const responseData = await response.json();
      console.log('Respons API berhasil:', JSON.stringify(responseData).substring(0, 100) + '...');
      
      // Memeriksa berbagai format respon yang mungkin dari OpenRouter
      if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
        return responseData.choices[0].message;
      } else if (responseData.message) {
        return {
          role: responseData.message.role || 'assistant',
          content: responseData.message.content
        };
      } else if (responseData.response) {
        return {
          role: 'assistant',
          content: responseData.response
        };
      } else if (responseData.content || typeof responseData.content === 'string') {
        return {
          role: 'assistant',
          content: responseData.content
        };
      } else {
        throw new Error('Format respons tidak valid dari OpenRouter.');
      }
    } catch (error: any) {
      lastError = error;
      console.error(`Percobaan ${retries + 1}/${MAX_RETRIES + 1} gagal:`, error);
      
      // Jika masih ada percobaan tersisa, tunggu sebentar sebelum mencoba lagi
      if (retries < MAX_RETRIES) {
        // Tunggu semakin lama untuk setiap percobaan (1s, 2s)
        await sleep(1000 * (retries + 1));
        retries++;
      } else {
        // Jika sudah mencapai batas percobaan, lempar error
        console.error('Semua percobaan gagal:', lastError);
        throw lastError;
      }
    }
  }

  // Ini seharusnya tidak pernah terjangkau, tetapi TypeScript memerlukan return
  throw lastError || new Error('Tidak dapat menghubungi API OpenRouter');
}

// Fungsi untuk fallback ke respons statis jika API tidak tersedia
export function getStaticResponse(prompt: string): string {
  return `Maaf, saya tidak dapat terhubung ke layanan AI saat ini. Silakan coba lagi nanti atau hubungi dukungan teknis jika masalah berlanjut.

Pertanyaan Anda: "${prompt}"`;
}

export { DEFAULT_MODEL }; 