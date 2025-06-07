import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Definisi tipe untuk result dari Cloudinary
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file ke Cloudinary menggunakan buffer
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      // Menggunakan tipe callback yang sesuai dengan API Cloudinary
      cloudinary.uploader.upload_stream(
        {
          folder: 'hallo-chat',
          resource_type: 'auto',
        },
        (err?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (err || !result) reject(err || new Error('Upload failed'));
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      success: true
    });
  } catch (error: any) {
    console.error('Error upload file:', error);
    return NextResponse.json({
      error: 'Gagal mengupload file',
      message: error.message
    }, { status: 500 });
  }
} 