import { NextRequest, NextResponse } from 'next/server';
import { AIMessage } from '@/lib/types';
import { sendMessageToQwen, DEFAULT_MODEL, getStaticResponse } from '@/lib/qwen';

export async function POST(request: NextRequest) {
  try {
    // Periksa apakah API key tersedia
    const apiKey = process.env.NEXT_QWEN_API_KEY;
    if (!apiKey) {
      console.error('API key tidak tersedia - pastikan .env.local dimuat dengan benar');
      return NextResponse.json(
        { error: 'Konfigurasi API tidak tersedia. Silakan coba lagi nanti.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, customInstructions, model } = body;

    // Validasi input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Pesan tidak valid' },
        { status: 400 }
      );
    }

    // Dapatkan pesan terakhir untuk keperluan fallback
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const lastUserContent = lastUserMessage ? lastUserMessage.content : '';

    // Tambahkan instruksi kustom sebagai pesan sistem jika ada
    const allMessages: AIMessage[] = customInstructions 
      ? [{ role: 'system', content: customInstructions }, ...messages]
      : messages;
    
    // Panggil API Qwen melalui OpenRouter
    try {
      const aiResponse = await sendMessageToQwen(allMessages, model || DEFAULT_MODEL);
      
      // Pastikan struktur respons konsisten
      let responseContent = '';
      let responseRole = 'assistant';
      
      if (typeof aiResponse === 'string') {
        // Jika respons hanya berupa string
        responseContent = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object') {
        // Jika respons adalah objek dengan struktur standar
        if (aiResponse.content !== undefined) {
          responseContent = aiResponse.content;
        }
        if (aiResponse.role !== undefined) {
          responseRole = aiResponse.role;
        }
      }
      
      return NextResponse.json({ 
        response: responseContent || 'Maaf, tidak ada respons yang dapat diproses',
        role: responseRole,
      });
    } catch (aiError: any) {
      console.error('Error dari OpenRouter:', aiError);
      
      // Jika error 404 atau 500, gunakan fallback respons
      if (aiError.message && (aiError.message.includes('404') || aiError.message.includes('500'))) {
        console.log('Model atau endpoint tidak tersedia, menggunakan fallback...');
        
        // Gunakan fallback respons statis
        const fallbackResponse = getStaticResponse(lastUserContent);
        
        return NextResponse.json({ 
          response: fallbackResponse,
          role: 'assistant',
        });
      }
      
      return NextResponse.json(
        { error: aiError.message || 'Terjadi kesalahan pada layanan OpenRouter' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error umum di API route:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada layanan AI' },
      { status: 500 }
    );
  }
} 