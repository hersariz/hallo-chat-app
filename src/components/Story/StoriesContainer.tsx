'use client';

import React, { useState, useRef, useEffect } from 'react';
import StoryThumbnail from './StoryThumbnail';
import StoryViewer from './StoryViewer';
import { FiPlus } from 'react-icons/fi';
import Image from 'next/image';

type Story = {
  id: string;
  imageUrl: string;
  timestamp: any;
  userId: string;
  caption?: string;
};

type StoryUser = {
  id: string;
  displayName: string;
  photoURL: string;
  stories: Story[];
  viewedStories?: string[]; // array of story IDs that have been viewed
};

type StoriesContainerProps = {
  users: StoryUser[];
  currentUserId: string;
  onAddStory?: () => void;
  onStoryDelete?: (storyId: string) => Promise<void>;
  onCaptionUpdate?: (storyId: string, caption: string) => Promise<void>;
  onStoryView?: (storyId: string) => Promise<void>;
};

const StoriesContainer: React.FC<StoriesContainerProps> = ({
  users,
  currentUserId,
  onAddStory,
  onStoryDelete,
  onCaptionUpdate,
  onStoryView
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [viewCurrentUserStory, setViewCurrentUserStory] = useState(false);
  
  // Dapatkan data pengguna saat ini
  const currentUser = users.find(user => user.id === currentUserId);
  const hasCurrentUserStory = currentUser?.stories && currentUser.stories.length > 0;
  
  // Debug untuk melihat data users dan currentUser
  console.log("StoriesContainer debug:", {
    currentUserId,
    allUserIds: users.map(u => u.id),
    currentUserStories: currentUser?.stories?.length || 0,
    totalUsers: users.length
  });
  
  // Filter dan urutkan users: current user pertama, kemudian user lain
  const sortedUsers = users.sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return 0;
  });
  
  // Users untuk story viewer (termasuk current user jika memiliki story)
  const viewerUsers = sortedUsers.filter(user => user.stories.length > 0);
  
  // Penggunaan yang lebih sederhana untuk memantau story yang dilihat
  const [viewTimestamp, setViewTimestamp] = useState(Date.now());
  const viewedStoriesRef = useRef<{[key: string]: boolean}>({});
  
  // Load viewed stories dari localStorage saat komponen dipasang
  useEffect(() => {
    try {
      const storedViewedStories = localStorage.getItem('viewedStories');
      if (storedViewedStories) {
        viewedStoriesRef.current = JSON.parse(storedViewedStories);
        // Picu render ulang untuk menampilkan status yang benar
        setViewTimestamp(Date.now());
      }
    } catch (error) {
      console.error('Error loading viewed stories from localStorage:', error);
    }
  }, []);
  
  const handleUserClick = (index: number) => {
    if (viewCurrentUserStory) {
      // Jika melihat story sendiri
      setSelectedUserIndex(0); // currentUser selalu indeks 0 dalam viewerUsers
    } else {
      // Indeks untuk users lain (tanpa current user)
      // Perlu penyesuaian jika current user memiliki story
      const adjustedIndex = hasCurrentUserStory ? index + 1 : index;
      setSelectedUserIndex(adjustedIndex);
    }
    setIsViewerOpen(true);
  };

  const handleCurrentUserStoryClick = () => {
    // Pastikan current user berada di indeks 0 dalam viewerUsers
    setSelectedUserIndex(0);
    setViewCurrentUserStory(true);
    setIsViewerOpen(true);
  };

  const handleAddStory = () => {
    if (onAddStory) {
      onAddStory();
    }
  };

  const handleStoryView = async (storyId: string) => {
    // Tandai story sebagai dilihat secara lokal
    viewedStoriesRef.current[storyId] = true;
    
    // Simpan ke localStorage untuk persistensi
    try {
      localStorage.setItem('viewedStories', JSON.stringify(viewedStoriesRef.current));
    } catch (error) {
      console.error('Error saving viewed stories to localStorage:', error);
    }
    
    // Perbarui timestamp untuk memicu render ulang
    setViewTimestamp(Date.now());
    
    // Panggil API untuk menandai sebagai dilihat
    if (onStoryView) {
      try {
        await onStoryView(storyId);
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }
  };

  // Helper sederhana untuk memeriksa apakah story sudah dilihat
  const isStoryViewed = (storyId: string) => {
    return viewedStoriesRef.current[storyId] || false;
  };

  return (
    <div className="py-3">
      <div className="flex gap-3 overflow-x-auto px-2 pb-2 scrollbar-none">
        {/* Tombol Add Story untuk user saat ini */}
        {!hasCurrentUserStory ? (
          <button 
            className="flex flex-col items-center gap-1 min-w-16 focus:outline-none"
            onClick={handleAddStory}
          >
            <div className="relative bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center">
              {currentUser?.photoURL ? (
                <div className="relative h-14 w-14 rounded-full overflow-hidden">
                  {/* Div fallback yang muncul jika gambar error */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                    <span className="text-gray-600 font-medium text-sm">
                      {currentUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <Image 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'User'}
                    fill
                    sizes="56px"
                    className="object-cover"
                    onError={(e) => {
                      // Fallback ke elemen dengan inisial jika gambar gagal dimuat
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {currentUser?.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md">
                <FiPlus size={16} />
              </div>
            </div>
            <span className="text-xs text-center truncate w-full">Cerita Anda</span>
          </button>
        ) : (
          /* Tampilkan story pengguna saat ini jika ada */
          <button 
            className="flex flex-col items-center gap-1 min-w-16 focus:outline-none"
            onClick={handleCurrentUserStoryClick}
          >
            <div className="relative">
              <div className={`${hasCurrentUserStory ? 'bg-gradient-to-tr from-primary to-secondary' : 'bg-gray-200'} p-[2px] rounded-full`}>
                <div className="bg-white p-[2px] rounded-full">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    {currentUser?.photoURL ? (
                      <>
                        {/* Fallback div yang ditampilkan di belakang gambar */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                          <span className="text-gray-600 font-medium text-sm">
                            {currentUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <Image 
                          src={currentUser.photoURL} 
                          alt={currentUser.displayName || 'User'}
                          fill
                          sizes="48px"
                          className="object-cover"
                          onError={(e) => {
                            // Fallback ke elemen dengan inisial jika gambar gagal dimuat
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {currentUser?.displayName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div 
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddStory();
                }}
              >
                <FiPlus size={14} />
              </div>
            </div>
            <span className="text-xs text-center truncate w-full">Cerita Anda</span>
          </button>
        )}
        
        {/* Story thumbnails dari pengguna lain */}
        {sortedUsers
          .filter(user => user.id !== currentUserId && user.stories.length > 0)
          .map((user, index) => {
            // Periksa apakah semua story dari user ini sudah dilihat
            const allStoriesViewed = user.stories.every(story => 
              user.viewedStories?.includes(story.id) || isStoryViewed(story.id)
            );
            
            return (
              <StoryThumbnail
                key={user.id}
                imageUrl={user.photoURL}
                name={user.displayName}
                isViewed={allStoriesViewed}
                onClick={() => handleUserClick(index)}
                isCurrentUser={false}
              />
            );
          })
        }
      </div>
      
      {/* Story viewer */}
      <StoryViewer
        users={viewerUsers}
        initialUserIndex={selectedUserIndex}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewCurrentUserStory(false);
        }}
        currentUserId={currentUserId}
        onStoryDelete={onStoryDelete}
        onCaptionUpdate={onCaptionUpdate}
        onStoryView={handleStoryView}
      />
    </div>
  );
};

export default StoriesContainer; 