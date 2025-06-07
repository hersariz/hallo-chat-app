'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUploadCloud, FiCheckCircle, FiCamera, FiVideo, FiClock, FiScissors } from 'react-icons/fi';
import Image from 'next/image';

type CreateStoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, caption: string) => Promise<void>;
  isLoading?: boolean;
};

type VideoTrimState = {
  start: number;
  end: number;
  duration: number;
};

const MAX_VIDEO_DURATION = 30; // Durasi maksimal 30 detik

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [videoTrim, setVideoTrim] = useState<VideoTrimState>({ start: 0, end: 0, duration: 0 });
  const [showTrimControls, setShowTrimControls] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startThumbRef = useRef<HTMLDivElement>(null);
  const endThumbRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      setErrorMessage('');
    } else {
      setTimeout(() => {
        setShowModal(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset form saat modal ditutup
    if (!isOpen) {
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
        setIsVideo(false);
        setVideoTrim({ start: 0, end: 0, duration: 0 });
        setShowTrimControls(false);
        setVideoDuration(0);
        setErrorMessage('');
      }, 300);
    }
  }, [isOpen]);

  // Handle ketika durasi video dimuat
  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      setVideoTrim({ 
        start: 0, 
        end: Math.min(duration, MAX_VIDEO_DURATION), 
        duration: Math.min(duration, MAX_VIDEO_DURATION) 
      });
      
      // Tampilkan pesan jika video lebih dari 30 detik
      if (duration > MAX_VIDEO_DURATION) {
        setErrorMessage(`Video terlalu panjang (${Math.round(duration)}s). Maksimal ${MAX_VIDEO_DURATION} detik. Gunakan fitur trim untuk mengaturnya.`);
        setShowTrimControls(true);
      } else {
        setErrorMessage('');
      }
    }
  };

  if (!isOpen && !showModal) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Deteksi apakah file adalah video
      const isVideoFile = file.type.startsWith('video/');
      setIsVideo(isVideoFile);
      
      if (isVideoFile) {
        // Untuk video, kita perlu cek durasinya
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        videoElement.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoElement.src);
          
          // Jika video lebih dari MAX_VIDEO_DURATION detik, kita akan memungkinkan trim
          if (videoElement.duration > MAX_VIDEO_DURATION) {
            setErrorMessage(`Video terlalu panjang (${Math.round(videoElement.duration)}s). Maksimal ${MAX_VIDEO_DURATION} detik. Gunakan fitur trim untuk mengaturnya.`);
            setShowTrimControls(true);
          } else {
            setErrorMessage('');
            setShowTrimControls(false);
          }
          
          // Tetap izinkan file dipilih, pengguna akan di-prompt untuk memotongnya
          setSelectedFile(file);
          
          // Buat URL untuk preview
          const reader = new FileReader();
          reader.onload = () => {
            setPreviewUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
        };
        
        videoElement.src = URL.createObjectURL(file);
      } else {
        // Untuk gambar, langsung set file dan buat preview
        setSelectedFile(file);
        setErrorMessage('');
        setShowTrimControls(false);
        
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      if (isVideo && videoDuration > MAX_VIDEO_DURATION && !showTrimControls) {
        setErrorMessage(`Video terlalu panjang. Gunakan fitur trim untuk mengaturnya ke maksimal ${MAX_VIDEO_DURATION} detik.`);
        setShowTrimControls(true);
        return;
      }
      
      try {
        // Jika video dan sudah di-trim, perlu mengekstrak segmen yang dipilih
        if (isVideo && showTrimControls && videoRef.current) {
          await processVideoBeforeUpload();
        } else {
          // Upload langsung jika gambar atau video sudah dalam durasi yang diizinkan
          await onSubmit(selectedFile, caption);
        }
        
        // Reset form akan dilakukan setelah modal ditutup melalui useEffect
        onClose();
      } catch (error) {
        console.error('Error submitting story:', error);
        setErrorMessage('Gagal mengunggah story. Silakan coba lagi.');
      }
    }
  };

  // Fungsi untuk memproses video sebelum upload (jika perlu trim)
  const processVideoBeforeUpload = async () => {
    if (!videoRef.current || !selectedFile || !isVideo) return;
    
    // Untuk demo, kita akan menggunakan file asli
    // Dalam implementasi sebenarnya, gunakan ffmpeg.wasm atau API backend untuk memotong video
    
    // Code di bawah ini hanya memberikan indikasi bahwa kita akan memproses berdasarkan timerange
    console.log(`Memproses video dari ${videoTrim.start.toFixed(2)}s hingga ${videoTrim.end.toFixed(2)}s (durasi: ${videoTrim.duration.toFixed(2)}s)`);
    
    // Dalam implementasi sebenarnya, kita akan membuat file video baru yang dipotong
    // Tapi untuk demo, kita masih menggunakan file asli
    await onSubmit(selectedFile, caption);
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleSelectVideo = () => {
    videoInputRef.current?.click();
  };

  const handleTrimStart = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = parseFloat(e.target.value);
    setVideoTrim(prev => {
      const newStart = Math.min(start, prev.end - 1); // Pastikan start < end - 1 detik minimal
      return {
        start: newStart,
        end: prev.end,
        duration: prev.end - newStart
      };
    });
    
    // Update posisi video
    if (videoRef.current) {
      videoRef.current.currentTime = start;
    }
  };

  const handleTrimEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = parseFloat(e.target.value);
    setVideoTrim(prev => {
      const newEnd = Math.max(end, prev.start + 1); // Pastikan end > start + 1 detik minimal
      return {
        start: prev.start,
        end: newEnd,
        duration: newEnd - prev.start
      };
    });
  };

  const toggleTrimControls = () => {
    setShowTrimControls(prev => !prev);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${isOpen ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-xl transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="flex justify-between items-center p-4 border-b bg-primary text-white">
          <h2 className="text-lg font-medium">Buat Story</h2>
          <button onClick={onClose} className="text-white hover:text-white/80 transition-colors">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {errorMessage && (
            <div className="mb-3 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm">
              <p>{errorMessage}</p>
            </div>
          )}
          
          {previewUrl ? (
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden shadow-inner">
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                  onLoadedMetadata={handleVideoMetadata}
                />
              ) : (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              )}
              <div className="absolute bottom-2 left-2 text-white text-xs font-medium px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                {isVideo ? 'Video Preview' : 'Preview'}
              </div>
              
              {isVideo && (
                <button 
                  onClick={toggleTrimControls}
                  className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-full text-white hover:bg-black/60 transition-colors"
                  title="Potong Video"
                >
                  <FiScissors size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-64 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200 transition-all hover:border-primary/50">
              <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiUploadCloud size={32} />
              </div>
              <p className="text-gray-700 text-center font-medium mb-4">
                Pilih gambar atau video untuk story
              </p>
              <div className="flex gap-3">
                <button
                  className="bg-primary text-white px-4 py-2 rounded-full flex items-center shadow-md hover:bg-primary-dark transition-all text-sm"
                  onClick={handleSelectImage}
                >
                  <FiCamera className="mr-1" size={16} />
                  Gambar
                </button>
                <button
                  className="bg-primary text-white px-4 py-2 rounded-full flex items-center shadow-md hover:bg-primary-dark transition-all text-sm"
                  onClick={handleSelectVideo}
                >
                  <FiVideo className="mr-1" size={16} />
                  Video
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                <FiClock className="inline mr-1" size={12} />
                Video maksimal 30 detik
              </p>
            </div>
          )}
          
          {isVideo && showTrimControls && previewUrl && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <FiScissors className="mr-1" size={14} />
                  Potong Video
                </h3>
                <span className="text-xs text-gray-500">
                  {Math.floor(videoTrim.duration)}s / {MAX_VIDEO_DURATION}s
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 w-10">Mulai:</span>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={videoTrim.start}
                    onChange={handleTrimStart}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-mono w-10">{videoTrim.start.toFixed(1)}s</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 w-10">Akhir:</span>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={videoTrim.end}
                    onChange={handleTrimEnd}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-mono w-10">{videoTrim.end.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden"
          />

          {previewUrl && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tambahkan caption untuk story Anda..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                rows={2}
                maxLength={100}
              />
              <div className="text-right text-xs text-gray-500">
                {caption.length}/100
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 p-3 border-t bg-gray-50">
          {previewUrl && (
            <>
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setCaption('');
                  setIsVideo(false);
                  setVideoTrim({ start: 0, end: 0, duration: 0 });
                  setShowTrimControls(false);
                  setErrorMessage('');
                }}
              >
                Ganti
              </button>
              <button
                className="px-3 py-1.5 bg-primary text-white rounded-full flex items-center disabled:opacity-70 shadow-md hover:bg-primary-dark transition-all text-sm"
                onClick={handleSubmit}
                disabled={isLoading || (isVideo && videoTrim.duration > MAX_VIDEO_DURATION)}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengunggah...
                  </>
                ) : (
                  <>
                    Unggah
                    <FiCheckCircle className="ml-1" size={16} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal; 