import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/admin';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(request: NextRequest) {
  try {
    // Verifikasi token Firebase
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verifikasi token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Ambil storyId dari URL query params
    const url = new URL(request.url);
    const storyId = url.searchParams.get('storyId');
    
    if (!storyId) {
      return NextResponse.json({ error: 'No story ID provided' }, { status: 400 });
    }
    
    // Periksa apakah story dimiliki oleh pengguna yang sedang login
    const storyRef = firestore.collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    const storyData = storyDoc.data();
    
    if (storyData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this story' }, { status: 403 });
    }
    
    // Hapus gambar dari Cloudinary jika URL mengandung Cloudinary
    if (storyData?.imageUrl && storyData.imageUrl.includes('cloudinary')) {
      try {
        // Extract public_id dari URL Cloudinary
        const urlParts = storyData.imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const publicId = `hallo-stories/${fileName.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Lanjutkan proses meskipun gagal menghapus dari Cloudinary
      }
    }
    
    // Hapus story dari Firestore
    await storyRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
  }
} 