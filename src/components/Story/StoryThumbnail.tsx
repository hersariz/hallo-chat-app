'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type StoryThumbnailProps = {
  imageUrl: string;
  name: string;
  isViewed: boolean;
  onClick: () => void;
  isCurrentUser?: boolean;
};

const StoryThumbnail: React.FC<StoryThumbnailProps> = ({
  imageUrl,
  name,
  isViewed,
  onClick,
  isCurrentUser = false
}) => {
  // State untuk menyimpan status view
  const [viewed, setViewed] = useState(isViewed);
  // State untuk menyimpan status error gambar
  const [imageError, setImageError] = useState(false);
  
  // Effect untuk memperbarui state lokal saat prop berubah
  useEffect(() => {
    // Jika status viewed berubah menjadi true, simpan status tersebut
    if (isViewed) {
      setViewed(true);
    }
  }, [isViewed]);
  
  // Ukuran standar untuk semua foto profil (lebih kecil dari sebelumnya)
  const imageSize = isCurrentUser ? 12 : 10; // 12 = 48px, 10 = 40px dengan base 4px

  // Fungsi untuk menampilkan inisial dari nama pengguna
  const getInitial = () => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };
  
  return (
    <button 
      className={`flex flex-col items-center gap-1 min-w-16 focus:outline-none ${isCurrentUser ? 'w-18' : 'w-16'}`}
      onClick={onClick}
    >
      <div className={`relative p-[2px] rounded-full ${
        !viewed ? 'bg-gradient-to-tr from-primary to-secondary' : 'bg-gray-400'
      }`}>
        <div className="bg-white p-[2px] rounded-full">
          <div className={`relative rounded-full overflow-hidden ${isCurrentUser ? 'h-12 w-12' : 'h-10 w-10'}`}>
            {!imageError && imageUrl ? (
              <>
                {/* Fallback div selalu ada di belakang gambar */}
                <div className={`absolute inset-0 flex items-center justify-center bg-gray-300 z-0`}>
                  <span className="text-gray-600 font-medium">
                    {getInitial()}
                  </span>
                </div>
                <Image 
                  src={imageUrl} 
                  alt={name || 'User'}
                  fill
                  sizes={isCurrentUser ? "48px" : "40px"}
                  className="object-cover relative z-10"
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div className={`flex items-center justify-center bg-gray-300 h-full w-full`}>
                <span className="text-gray-600 font-medium">
                  {getInitial()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="text-xs text-center truncate w-full">{name}</span>
    </button>
  );
};

export default StoryThumbnail; 