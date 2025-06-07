import { NextRequest, NextResponse } from 'next/server';
// Deklarasi type untuk cloudinary
// @ts-ignore
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL gambar diperlukan' }, { status: 400 });
    }

    // Upload gambar dari URL
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'hallo-chat',
      resource_type: 'image'
    });

    return NextResponse.json({ 
      url: result.secure_url,
      success: true
    });
  } catch (error: any) {
    console.error('Error upload gambar:', error);
    return NextResponse.json({ 
      error: 'Gagal mengupload gambar', 
      message: error.message 
    }, { status: 500 });
  }
} 