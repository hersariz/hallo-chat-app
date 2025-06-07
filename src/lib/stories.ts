'use client';

import { db, auth } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  Timestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export type Story = {
  id: string;
  imageUrl: string;
  timestamp: Timestamp;
  userId: string;
  caption?: string;
  resourceType: 'image' | 'video'; // Tipe resource (image atau video)
  duration?: number; // Durasi dalam detik untuk video
};

export type StoryUser = {
  id: string;
  displayName: string;
  photoURL: string;
  stories: Story[];
  viewedStories?: string[];
};

// Mendapatkan semua stories yang belum kedaluwarsa (24 jam)
export const getRecentStories = async (): Promise<StoryUser[]> => {
  try {
    // Dapatkan token Firebase untuk otorisasi
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('User not authenticated');
    }
    
    // Fetch stories dari API route
    const response = await fetch('/api/story/list', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch stories');
    }
    
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error getting recent stories:', error);
    return [];
  }
};

// Mengunggah story baru
export const uploadStory = async (
  userId: string, 
  file: File,
  caption: string = ''
): Promise<string> => {
  try {
    // Buat form data untuk upload ke API route kita
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);
    
    // Tentukan resource_type berdasarkan tipe file
    const isVideo = file.type.startsWith('video/');
    formData.append('resourceType', isVideo ? 'video' : 'image');
    
    // Dapatkan token Firebase untuk otorisasi
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('User not authenticated');
    }
    
    // Kirim ke API route kita yang akan menghandle upload ke Cloudinary
    const response = await fetch('/api/story/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload story');
    }
    
    const data = await response.json();
    return data.storyId;
  } catch (error) {
    console.error('Error uploading story:', error);
    throw error;
  }
};

// Menghapus story
export const deleteStory = async (storyId: string): Promise<void> => {
  console.log("lib/stories: Starting delete process for story ID:", storyId);
  try {
    // Dapatkan token Firebase untuk otorisasi
    const idToken = await auth.currentUser?.getIdToken();
    console.log("lib/stories: Got Firebase token:", idToken ? "YES" : "NO");
    
    if (!idToken) {
      throw new Error('User not authenticated');
    }
    
    // Kirim ke API route untuk menghapus story
    const url = `/api/story/delete?storyId=${storyId}`;
    console.log("lib/stories: Sending delete request to:", url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    console.log("lib/stories: Delete response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete story');
    }
    
    console.log("lib/stories: Delete successful");
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

// Mengupdate caption story
export const updateStoryCaption = async (storyId: string, caption: string): Promise<void> => {
  try {
    // Dapatkan token Firebase untuk otorisasi
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('User not authenticated');
    }
    
    // Kirim ke API route untuk update caption
    const response = await fetch('/api/story/update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ storyId, caption })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update story caption');
    }
  } catch (error) {
    console.error('Error updating story caption:', error);
    throw error;
  }
};

// Menandai story sebagai sudah dilihat
export const markStoryAsViewed = async (
  userId: string,
  storyId: string
): Promise<void> => {
  try {
    console.log(`Marking story ${storyId} as viewed by user ${userId}`);
    
    // Dapatkan token Firebase untuk otorisasi
    const idToken = await auth.currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('User not authenticated');
    }
    
    // Kirim ke API route untuk menandai story sebagai sudah dilihat
    const response = await fetch('/api/story/view', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ storyId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mark story as viewed');
    }
    
    console.log(`Successfully marked story ${storyId} as viewed`);
    // Segera ambil data baru setelah menandai story sebagai dilihat
    await getRecentStories();
  } catch (error) {
    console.error('Error marking story as viewed:', error);
  }
};

// Modifikasi fungsi listenToStories untuk menggunakan polling
export const listenToStories = (callback: (users: StoryUser[]) => void): (() => void) => {
  let isMounted = true;
  let intervalId: NodeJS.Timeout;

  const fetchStories = async () => {
    try {
      // Dapatkan token Firebase untuk otorisasi
      const idToken = await auth.currentUser?.getIdToken();
      const currentUserId = auth.currentUser?.uid;
      
      if (!idToken) {
        console.error('User not authenticated');
        // Panggil callback dengan array kosong
        if (isMounted) {
          callback([]);
        }
        return;
      }
      
      // Fetch stories dari API route
      const response = await fetch('/api/story/list', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        console.error('Error fetching stories:', response.statusText);
        // Panggil callback dengan array kosong
        if (isMounted) {
          callback([]);
        }
        return;
      }
      
      try {
        const data = await response.json();
        
        if (isMounted) {
          const users = data.users || [];
          
          // Debug informasi tentang data pengguna yang diterima
          console.log("Stories data debug:", {
            totalUsers: users.length,
            currentUserInList: users.some((u: StoryUser) => u.id === currentUserId),
            userIds: users.map((u: StoryUser) => u.id),
            currentUserId
          });
          
          callback(users);
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // Panggil callback dengan array kosong jika terjadi error parsing
        if (isMounted) {
          callback([]);
        }
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      // Panggil callback dengan array kosong
      if (isMounted) {
        callback([]);
      }
    }
  };

  // Fetch stories pertama kali
  fetchStories();

  // Set up interval untuk polling
  intervalId = setInterval(fetchStories, 60000); // Poll setiap 60 detik (diubah dari 30 detik)

  // Return cleanup function
  return () => {
    isMounted = false;
    clearInterval(intervalId);
  };
}; 