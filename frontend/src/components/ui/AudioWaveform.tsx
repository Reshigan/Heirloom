/**
 * AudioWaveform Component
 * Voice recording visualization with animated waveform
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AudioWaveformProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  audioData?: number[]; // Array of amplitude values 0-1
  duration?: number; // Duration in seconds
  currentTime?: number; // Current playback position in seconds
  barCount?: number;
  color?: 'gold' | 'blood' | 'paper';
  size?: 'sm' | 'md' | 'lg';
}

const colorConfig = {
  gold: { active: '#c9a959', inactive: 'rgba(201, 169, 89, 0.3)' },
  blood: { active: '#8b2942', inactive: 'rgba(139, 41, 66, 0.3)' },
  paper: { active: '#f5f3ee', inactive: 'rgba(245, 243, 238, 0.3)' },
};

const sizeConfig = {
  sm: { height: 32, barWidth: 2, gap: 2 },
  md: { height: 48, barWidth: 3, gap: 3 },
  lg: { height: 64, barWidth: 4, gap: 4 },
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording = false,
  isPlaying = false,
  audioData,
  duration = 0,
  currentTime = 0,
  barCount = 40,
  color = 'gold',
  size = 'md',
}) => {
  const [animatedBars, setAnimatedBars] = useState<number[]>([]);
  const colors = colorConfig[color];
  const sizeConf = sizeConfig[size];

  // Generate random bars for recording animation
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAnimatedBars(
          Array.from({ length: barCount }, () => 0.2 + Math.random() * 0.8)
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording, barCount]);

  // Use provided audio data or generate placeholder
  const bars = audioData || animatedBars.length > 0 
    ? (audioData || animatedBars) 
    : Array.from({ length: barCount }, (_, i) => {
        // Generate a nice wave pattern for placeholder
        const x = (i / barCount) * Math.PI * 4;
        return 0.3 + Math.sin(x) * 0.2 + Math.sin(x * 2) * 0.1;
      });

  // Calculate progress for playback
  const progress = duration > 0 ? currentTime / duration : 0;
  const progressIndex = Math.floor(progress * barCount);

  return (
    <div 
      className="flex items-center justify-center gap-px"
      style={{ height: sizeConf.height }}
      role="img"
      aria-label={isRecording ? 'Recording audio' : isPlaying ? 'Playing audio' : 'Audio waveform'}
    >
      {bars.slice(0, barCount).map((amplitude, index) => {
        const isActive = isPlaying && index <= progressIndex;
        const barHeight = Math.max(4, amplitude * sizeConf.height);
        
        return (
          <motion.div
            key={index}
            className="rounded-full"
            style={{
              width: sizeConf.barWidth,
              backgroundColor: isActive ? colors.active : colors.inactive,
            }}
            animate={{
              height: isRecording ? barHeight : barHeight,
              opacity: isRecording ? [0.5, 1, 0.5] : 1,
            }}
            transition={{
              height: { duration: 0.1 },
              opacity: isRecording ? { duration: 0.3, repeat: Infinity } : { duration: 0 },
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * AudioWaveformPlayer - Waveform with playback controls
 */
interface AudioWaveformPlayerProps {
  audioUrl?: string;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

export const AudioWaveformPlayer: React.FC<AudioWaveformPlayerProps> = ({
  duration,
  onPlay,
  onPause,
  onSeek,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying && currentTime < duration) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration, currentTime]);

  return (
    <div className="flex items-center gap-4 p-4 bg-glass-bg backdrop-blur-glass rounded-xl border border-glass-border">
      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        className="w-10 h-10 rounded-full bg-gold/20 hover:bg-gold/30 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gold">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gold ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1">
        <AudioWaveform
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
          barCount={50}
        />
      </div>

      {/* Time display */}
      <div className="text-paper/60 text-sm font-mono min-w-[80px] text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default AudioWaveform;
