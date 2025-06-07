import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/admin';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Log debug untuk memastikan variabel environment terload
    console.log('Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set',
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set',
    });
    
    // Verifikasi token Firebase
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verifikasi token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Dapatkan data form
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = formData.get('caption') as string || '';
    const resourceType = formData.get('resourceType') as string || 'image';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Baca file sebagai buffer untuk Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const storyId = uuidv4();
    
    // Upload ke Cloudinary dengan metode alternatif (yang lebih sederhana daripada streams)
    const uploadResult = await new Promise((resolve, reject) => {
      // Convert buffer ke base64 untuk Cloudinary
      const base64Data = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64Data}`;
      
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'hallo-stories',
          public_id: `${userId}_${storyId}`,
          resource_type: resourceType === 'video' ? 'video' : 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
    });
    
    // @ts-ignore - result akan mengandung beberapa properti Cloudinary
    const url = uploadResult.secure_url;
    // @ts-ignore - untuk video, Cloudinary akan mengembalikan durasi dalam detik
    const duration = resourceType === 'video' ? uploadResult.duration : undefined;
    
    // Simpan referensi ke Firestore
    const storyRef = firestore.collection('stories').doc();
    
    // Set timestamp saat ini
    const now = new Date();
    
    // Set juga waktu kedaluwarsa (expiry) untuk memudahkan penghapusan otomatis
    const expiryTime = new Date(now);
    expiryTime.setHours(expiryTime.getHours() + 24); // Tambah 24 jam dari sekarang
    
    await storyRef.set({
      userId,
      imageUrl: url,
      caption,
      timestamp: now,
      expiryTime: expiryTime, // Waktu kedaluwarsa story untuk memudahkan penghapusan otomatis
      resourceType,
      ...(duration && { duration }),
    });
    
    // Set TTL (Time to Live) pada dokumen untuk otomatis dihapus setelah 24 jam
    // Catatan: Ini memerlukan Firestore TTL yang dikonfigurasi atau fungsi Cloud yang dijadwalkan
    
    return NextResponse.json({ success: true, storyId: storyRef.id });
  } catch (error) {
    console.error('Error uploading story:', error);
    return NextResponse.json({ error: 'Failed to upload story' }, { status: 500 });
  }
} 