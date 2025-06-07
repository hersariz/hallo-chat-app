import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/admin';

export async function POST(request: NextRequest) {
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
    
    // Ambil storyId dari request body
    const data = await request.json();
    const { storyId } = data;
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }
    
    console.log(`Marking story ${storyId} as viewed by user ${userId}`);
    
    // Dapatkan story untuk mendapatkan informasi penggunanya
    const storyDoc = await firestore.collection('stories').doc(storyId).get();
    
    if (!storyDoc.exists) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    const storyData = storyDoc.data();
    const storyOwnerId = storyData?.userId;
    
    // Tambahkan story ke koleksi viewedStories pengguna yang sedang login
    // Jika pengguna yang login adalah pemilik story, abaikan
    if (userId !== storyOwnerId) {
      // Gunakan Firestore sub-collection untuk menyimpan story yang sudah dilihat
      const viewedStoryRef = firestore
        .collection('users')
        .doc(userId)
        .collection('viewedStories')
        .doc(storyId);
      
      await viewedStoryRef.set({
        viewedAt: new Date(),
        storyOwnerId: storyOwnerId
      });
      
      // Tambahkan juga informasi view ke story untuk statistik
      const storyViewsRef = firestore
        .collection('stories')
        .doc(storyId)
        .collection('views')
        .doc(userId);
      
      await storyViewsRef.set({
        viewedAt: new Date()
      });
      
      console.log(`Story ${storyId} marked as viewed by user ${userId}`);
    } else {
      console.log(`User ${userId} is the owner of story ${storyId}, skipping view marking`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    return NextResponse.json({ error: 'Failed to mark story as viewed' }, { status: 500 });
  }
} 