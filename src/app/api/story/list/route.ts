import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/admin';

export async function GET(request: NextRequest) {
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
    
    // Set waktu sekarang untuk filter
    const now = new Date();
    
    // Ambil semua stories yang belum kedaluwarsa (yang expiry time-nya masih lebih besar dari waktu sekarang)
    // Ini lebih akurat daripada menggunakan waktu 24 jam yang lalu
    const storiesSnapshot = await firestore
      .collection('stories')
      .where('expiryTime', '>', now)
      .get();
    
    // Jika expiryTime tidak ada di beberapa story lama, tetap gunakan filter timestamp 24 jam
    if (storiesSnapshot.empty) {
      console.log('Using fallback timestamp filter for stories');
      // Set waktu 24 jam yang lalu sebagai fallback
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const fallbackSnapshot = await firestore
        .collection('stories')
        .where('timestamp', '>', oneDayAgo)
        .get();
        
      if (fallbackSnapshot.empty) {
        return NextResponse.json({ users: [] });
      }
    }
    
    // Ambil semua ID pengguna yang memiliki stories
    const userIds = new Set<string>();
    const storiesData: { [key: string]: any }[] = [];
    
    storiesSnapshot.forEach(doc => {
      const storyData = doc.data();
      storiesData.push({
        id: doc.id,
        ...storyData,
        resourceType: storyData.resourceType || 'image', // Default to 'image' if not specified
        duration: storyData.duration || null, // Include duration for video
        timestamp: storyData.timestamp.toDate().toISOString(), // Convert timestamp ke ISO string
        expiryTime: storyData.expiryTime?.toDate().toISOString() || null
      });
      userIds.add(storyData.userId);
    });
    
    // Tambahkan userid pengguna saat ini juga, bahkan jika tidak ada story
    // Ini untuk memastikan pengguna saat ini selalu ada dalam daftar
    userIds.add(userId);
    
    // Ambil data pengguna untuk semua user yang memiliki stories
    const usersData: { [key: string]: any } = {};
    const usersPromises = Array.from(userIds).map(async uid => {
      const userDoc = await firestore.collection('users').doc(uid).get();
      if (userDoc.exists) {
        usersData[uid] = {
          id: uid,
          ...userDoc.data()
        };
      } else {
        // Jika data pengguna tidak ada, gunakan data default
        usersData[uid] = {
          id: uid,
          displayName: 'Pengguna',
          photoURL: null
        };
      }
    });
    
    await Promise.all(usersPromises);
    
    // Ambil data story yang sudah dilihat oleh pengguna menggunakan sub-collection
    const viewedStoriesRef = firestore
      .collection('users')
      .doc(userId)
      .collection('viewedStories');

    const viewedSnapshot = await viewedStoriesRef.get();

    const viewedStories: string[] = [];
    viewedSnapshot.forEach(doc => {
      viewedStories.push(doc.id); // doc.id adalah storyId
    });

    console.log(`User ${userId} has viewed ${viewedStories.length} stories`);
    
    // Kelompokkan stories berdasarkan userId
    const groupedStories: { [key: string]: any[] } = {};
    storiesData.forEach(story => {
      if (!groupedStories[story.userId]) {
        groupedStories[story.userId] = [];
      }
      groupedStories[story.userId].push(story);
    });
    
    // Format data dalam bentuk yang diharapkan
    const formattedUsers = Object.keys(usersData).map(uid => {
      return {
        ...usersData[uid],
        stories: groupedStories[uid] || [],
        viewedStories: uid === userId ? viewedStories : []
      };
    });
    
    // Filter users yang memiliki stories atau user saat ini
    const filteredUsers = formattedUsers.filter(user => 
      user.stories.length > 0 || user.id === userId
    );
    
    // Log info debug
    console.log(`Story API: Returning data for ${filteredUsers.length} users. Current user: ${userId}`);
    console.log(`Story API: User has ${filteredUsers.find(u => u.id === userId)?.stories?.length || 0} stories`);
    
    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('Error retrieving stories:', error);
    return NextResponse.json({ error: 'Failed to retrieve stories' }, { status: 500 });
  }
} 