'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FiX, FiCornerDownLeft, FiSend, FiSmile, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import StoryProgressBar from './StoryProgressBar';

type Story = {
  id: string;
  imageUrl: string;
  timestamp: any;
  userId: string;
  caption?: string;
  resourceType?: 'image' | 'video';
  duration?: number;
};

type StoryUser = {
  id: string;
  displayName: string;
  photoURL: string;
  stories: Story[];
  viewedStories?: string[];
};

type StoryViewerProps = {
  users: StoryUser[];
  initialUserIndex: number;
  initialStoryIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onStoryDelete?: (storyId: string) => Promise<void>;
  onCaptionUpdate?: (storyId: string, caption: string) => Promise<void>;
  onStoryView?: (storyId: string) => Promise<void>;
};

const StoryViewer: React.FC<StoryViewerProps> = ({
  users,
  initialUserIndex,
  initialStoryIndex = 0,
  isOpen,
  onClose,
  currentUserId,
  onStoryDelete,
  onCaptionUpdate,
  onStoryView
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const currentUser = users[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  
  // Cek apakah pengguna yang login adalah pemilik story
  const isOwnStory = !!currentUserId && !!currentUser?.id && currentUser.id === currentUserId;
  const isVideo = currentStory?.resourceType === 'video';

  // Debug info for ownership check
  useEffect(() => {
    if (currentStory && currentUser) {
      console.log("Story ownership debug:", {
        currentUserId,
        currentUserId_type: typeof currentUserId,
        storyUserId: currentUser.id,
        storyUserId_type: typeof currentUser.id,
        isOwnStory
      });
    }
  }, [currentStory, currentUser, currentUserId, isOwnStory]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Saat pengguna mengganti story atau story index berubah, pastikan progres bar direset
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(initialStoryIndex);
      // Reset UI states ketika story berubah
      setShowMenu(false);
      setIsEditingCaption(false);
      // Jangan reset status pause di sini, biarkan itu dikelola oleh progres bar sendiri
    }
  }, [isOpen, initialUserIndex, initialStoryIndex]);

  // Saat story ditutup kemudian dibuka kembali, pastikan progres dimulai ulang
  useEffect(() => {
    if (isOpen) {
      // Reset pause state saat membuka viewer pertama kali
      setIsPaused(false);
    }
  }, [isOpen]); // Hanya jalankan ketika status isOpen berubah

  // Mark story as viewed - hanya jalankan sekali per story
  const viewedStoriesRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (isOpen && currentStory && onStoryView && !isOwnStory) {
      // Hanya tandai sebagai dilihat jika belum pernah ditandai sebelumnya
      if (!viewedStoriesRef.current.has(currentStory.id)) {
        console.log(`Marking story ${currentStory.id} as viewed (first time)`);
        viewedStoriesRef.current.add(currentStory.id);
        onStoryView(currentStory.id);
      }
    }
  }, [isOpen, currentStory?.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set edited caption
  useEffect(() => {
    if (currentStory) {
      setEditedCaption(currentStory.caption || '');
    }
  }, [currentStory]);

  // Pastikan current story ditandai sebagai dilihat jika viewer ditutup
  useEffect(() => {
    if (isOpen && currentStory && onStoryView && !isOwnStory) {
      // Set timeout untuk memastikan story ditandai sebagai dilihat setelah beberapa detik
      const timer = setTimeout(() => {
        onStoryView(currentStory.id);
      }, 2000); // Tandai setelah user melihat 2 detik
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStory, onStoryView, isOwnStory]);

  // Pause/play video saat story di-pause/resume
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Video play error:", e));
      }
    }
  }, [isPaused, isVideo]);

  // Tambahkan handler untuk video ended
  const handleVideoEnded = () => {
    handleNext();
  };

  const handlePrevious = () => {
    // Force reset progress for smooth navigation
    setIsPaused(true);
    
    if (currentStoryIndex > 0) {
      // Previous story of current user
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      // Last story of previous user
      setCurrentUserIndex(currentUserIndex - 1);
      const prevUser = users[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }

    // Reset UI states when changing story
    setShowMenu(false);
    setIsEditingCaption(false);
    
    // Resume progress after a short delay untuk memastikan komponen dirender ulang
    setTimeout(() => {
      setIsPaused(false);
    }, 50);
  };

  const handleNext = () => {
    // Force reset progress for smooth navigation
    setIsPaused(true);

    // Pastikan story saat ini ditandai sebagai telah dilihat sebelum pindah
    if (currentStory && onStoryView && !isOwnStory) {
      onStoryView(currentStory.id);
    }
    
    const user = users[currentUserIndex];
    if (currentStoryIndex < user.stories.length - 1) {
      // Next story of current user
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < users.length - 1) {
      // First story of next user
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      // End of all stories - gunakan handleClose untuk memastikan story ditandai viewed
      handleClose();
      return;
    }

    // Reset UI states when changing story
    setShowMenu(false);
    setIsEditingCaption(false);
    
    // Resume progress after a short delay untuk memastikan komponen dirender ulang
    setTimeout(() => {
      setIsPaused(false);
    }, 100); // Tambah delay dari 50ms menjadi 100ms
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Record starting position
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    // Pause progress
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Resume progress
    setIsPaused(false);
    
    // If horizontal swipe is significant, navigate stories
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
  };

  const handleMouseDown = () => {
    setIsPaused(true);
  };

  const handleMouseUp = () => {
    setIsPaused(false);
  };

  const handleLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah mousedown/up event
    handlePrevious();
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah mousedown/up event

    // Pastikan story saat ini ditandai sebagai telah dilihat saat mengklik untuk fast forward
    if (currentStory && onStoryView && !isOwnStory) {
      onStoryView(currentStory.id);
    }
    
    handleNext();
  };

  const handleProgressChange = (index: number) => {
    setCurrentStoryIndex(index);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.RelativeTimeFormat('id', { style: 'short' }).format(-1, 'day');
    } catch (error) {
      return '';
    }
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      // Kirim balasan
      console.log(`Replying to ${currentUser.displayName}'s story: ${replyText}`);
      setReplyText('');
    }
  };

  const handleDeleteStory = async () => {
    console.log("Attempting to delete story:", {
      storyId: currentStory?.id,
      isOwnStory,
      hasDeleteFunction: !!onStoryDelete
    });
    
    if (currentStory && onStoryDelete) {
      try {
        setIsPaused(true);
        await onStoryDelete(currentStory.id);
        console.log("Story deleted successfully");
        
        // Setelah menghapus, kita bisa menentukan story selanjutnya yang akan ditampilkan
        const user = users[currentUserIndex];
        
        if (user.stories.length === 1) {
          // Jika ini adalah story terakhir dari pengguna, tutup viewer
          if (users.length === 1) {
            onClose();
            return;
          }
          
          // Pindah ke pengguna lain
          if (currentUserIndex < users.length - 1) {
            setCurrentUserIndex(currentUserIndex + 1);
            setCurrentStoryIndex(0);
          } else {
            onClose();
          }
        } else if (currentStoryIndex === user.stories.length - 1) {
          // Jika ini story terakhir, pindah ke story sebelumnya
          setCurrentStoryIndex(currentStoryIndex - 1);
        }
        // Jika bukan story terakhir, tetap di indeks yang sama (akan menampilkan story selanjutnya)
        
        setShowMenu(false);
        setIsPaused(false);
      } catch (error) {
        console.error('Error deleting story:', error);
        setIsPaused(false);
      }
    } else {
      console.error("Cannot delete story - missing story ID or delete function");
    }
  };

  const handleSaveCaption = async () => {
    if (currentStory && onCaptionUpdate) {
      try {
        setIsPaused(true);
        await onCaptionUpdate(currentStory.id, editedCaption);
        setIsEditingCaption(false);
        setShowMenu(false);
        setIsPaused(false);
      } catch (error) {
        console.error('Error updating caption:', error);
        setIsPaused(false);
      }
    }
  };

  // Tandai story saat ini sebagai dilihat ketika viewer ditutup
  const handleClose = () => {
    // Pastikan story saat ini ditandai sebagai sudah dilihat
    if (currentStory && onStoryView && !isOwnStory) {
      onStoryView(currentStory.id);
    }
    onClose();
  };

  if (!isOpen || !currentUser || !currentStory) return null;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex p-2 gap-1 z-10">
            {currentUser && currentUser.stories.map((story, idx) => (
              <StoryProgressBar 
                key={story.id}
                index={idx}
                isActive={idx === currentStoryIndex}
                isPaused={isPaused}
                duration={story.resourceType === 'video' && story.duration ? story.duration * 1000 : 5000}
                onComplete={idx === currentStoryIndex ? handleNext : undefined}
                onUpdate={handleProgressChange}
              />
            ))}
          </div>

          {/* Close button */}
          <button 
            className="absolute top-2 right-2 text-white z-10 p-2"
            onClick={handleClose}
          >
            <FiX size={24} />
          </button>

          {/* Story Content */}
          <div className="w-full h-full max-w-md max-h-[80vh] relative">
            {/* Video or Image */}
            {isVideo ? (
              <video
                ref={videoRef}
                src={currentStory?.imageUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                muted={false}
                controls={false}
                onEnded={handleVideoEnded}
                onPause={() => setIsPaused(true)}
                onPlay={() => setIsPaused(false)}
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={currentStory?.imageUrl || ''}
                  alt={`Story by ${currentUser?.displayName}`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain"
                />
              </div>
            )}

            {/* Caption */}
            {isEditingCaption ? (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4">
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 text-white rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Add a caption..."
                  autoFocus
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm"
                    onClick={() => setIsEditingCaption(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                    onClick={handleSaveCaption}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              currentStory?.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 text-white">
                  {currentStory.caption}
                </div>
              )
            )}

            {/* Story Actions Menu (for own stories) */}
            {isOwnStory && (
              <div className="absolute top-6 right-12 z-50">
                <button 
                  className="p-2.5 text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-white/20 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  <FiMoreVertical size={22} />
                </button>
                
                {showMenu && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200"
                  >
                    <button 
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingCaption(true);
                        setShowMenu(false);
                        setIsPaused(true);
                      }}
                    >
                      <FiEdit2 className="mr-3" size={18} />
                      Edit Caption
                    </button>
                    <button 
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Apakah Anda yakin ingin menghapus story ini?")) {
                          handleDeleteStory();
                        }
                      }}
                    >
                      <FiTrash2 className="mr-3" size={18} />
                      Hapus Story
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation overlay left and right */}
            <div className="absolute inset-0 z-10 flex">
              {/* Left navigation area (previous) */}
              <div 
                className="w-1/3 h-full cursor-pointer"
                onClick={handleLeftClick}
              />
              
              {/* Middle area (pause/play) */}
              <div className="w-1/3 h-full" />
              
              {/* Right navigation area (next) */}
              <div 
                className="w-1/3 h-full cursor-pointer"
                onClick={handleRightClick}
              />
            </div>
            
            {/* Reply box */}
            {!isOwnStory && !isEditingCaption && (
              <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
                <div className="flex items-center bg-white rounded-full overflow-hidden p-1">
                  <button className="p-2 text-gray-600">
                    <FiSmile size={20} />
                  </button>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Balas..."
                    className="flex-1 outline-none px-2 py-1 text-sm"
                  />
                  <button 
                    className="p-2 text-primary disabled:text-gray-400"
                    disabled={!replyText.trim()}
                    onClick={handleReplySubmit}
                  >
                    <FiSend size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StoryViewer; 