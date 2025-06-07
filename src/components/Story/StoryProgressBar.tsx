'use client';

import React, { useEffect, useState, useRef } from 'react';

type StoryProgressBarProps = {
  index: number;
  isActive: boolean;
  isPaused: boolean;
  duration: number;
  onComplete?: () => void;
  onUpdate?: (index: number) => void;
  barStyle?: {
    barActiveColor?: string;
    barInActiveColor?: string;
    barHeight?: number;
  };
};

const StoryProgressBar: React.FC<StoryProgressBarProps> = ({
  index,
  isActive,
  isPaused,
  duration = 5000,
  onComplete,
  onUpdate,
  barStyle = {}
}) => {
  const [progress, setProgress] = useState<number>(isActive ? 0 : (index < 0 ? 100 : 0));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  // Style options
  const {
    barActiveColor = '#ffffff',
    barInActiveColor = 'rgba(255, 255, 255, 0.4)',
    barHeight = 2
  } = barStyle;
  
  // Bersihkan timer saat component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  // Restart progress when active story changes
  useEffect(() => {
    if (isActive) {
      setProgress(0);
      pausedProgressRef.current = 0;
      startAnimation();
    } else {
      stopAnimation();
      // Set to 100% if this story index is less than current index
      setProgress(prev => prev > 0 ? prev : 0);
    }
  }, [isActive]);
  
  // Handle pausing
  useEffect(() => {
    if (isActive) {
      if (isPaused) {
        pausedTimeRef.current = Date.now();
        stopAnimation();
      } else {
        if (pausedTimeRef.current > 0) {
          // Adjust startTime to account for pause duration
          const pauseDuration = Date.now() - pausedTimeRef.current;
          startTimeRef.current += pauseDuration;
          pausedTimeRef.current = 0;
        }
        startAnimation();
      }
    }
  }, [isPaused, isActive]);
  
  const startAnimation = () => {
    stopAnimation();
    
    startTimeRef.current = Date.now() - (pausedProgressRef.current * duration / 100);
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);
      pausedProgressRef.current = newProgress;
      
      if (newProgress >= 100) {
        stopAnimation();
        onComplete && onComplete();
      }
    }, 16); // ~60fps
  };
  
  const stopAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  return (
    <div 
      className="flex-1 h-1 rounded-full overflow-hidden"
      style={{
        backgroundColor: barInActiveColor,
        height: barHeight
      }}
    >
      <div
        className="h-full rounded-full transition-all duration-100 ease-linear"
        style={{
          width: `${progress}%`,
          backgroundColor: barActiveColor
        }}
      />
    </div>
  );
};

export default StoryProgressBar;