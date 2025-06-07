import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/admin';

export async function PUT(request: NextRequest) {
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
    
    // Ambil data dari request body
    const data = await request.json();
    const { storyId, caption } = data;
    
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
      return NextResponse.json({ error: 'Unauthorized to update this story' }, { status: 403 });
    }
    
    // Update caption pada story
    await storyRef.update({
      caption: caption || ''
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating story caption:', error);
    return NextResponse.json({ error: 'Failed to update story caption' }, { status: 500 });
  }
} 