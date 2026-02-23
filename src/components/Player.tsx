import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, 
  Repeat, Shuffle, Maximize2, ListMusic, 
  Gauge, Repeat1
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PlayerProps {
  onOpenFullscreen: () => void;
}

export default function Player({ onOpenFullscreen }: PlayerProps) {
  const { 
    currentSong, isPlaying, togglePlay, progress, duration, seek, 
    nextSong, prevSong
  } = useAudio();
  const { t } = useLanguage();
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return (
    <div className="h-20 bg-black/80 backdrop-blur-md border-t border-white/10 px-4 flex items-center justify-center text-zinc-500 italic text-sm">
      {t.selectSong}
    </div>
  );

  return (
    <div className="h-20 bg-black/80 backdrop-blur-md border-t border-white/10 px-4 flex items-center justify-between gap-4 relative overflow-hidden">
      {/* Progress Bar (Top of player) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-20">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300" 
          style={{ width: `${(progress / duration) * 100}%` }}
        />
      </div>

      {/* Swipeable Content Area */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x > 50) {
            setDirection(-1);
            prevSong();
          } else if (info.offset.x < -50) {
            setDirection(1);
            nextSong(true);
          }
        }}
        className="flex-1 h-full flex items-center min-w-0 cursor-grab active:cursor-grabbing relative"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSong.id}
            custom={direction}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex items-center gap-3 min-w-0 w-full"
          >
            <div 
              onClick={onOpenFullscreen}
              className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              {currentSong.cover ? (
                <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <ListMusic className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              <div 
                onClick={onOpenFullscreen}
                className="cursor-pointer group"
              >
                <h4 className="text-sm font-bold truncate group-hover:text-emerald-400 transition-colors">{currentSong.title}</h4>
                <p className="text-[10px] md:text-xs text-zinc-400 truncate">{currentSong.artist}</p>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                {formatTime(progress)} / {formatTime(duration)}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Right: Controls (Fixed) */}
      <div className="flex items-center gap-2 md:gap-4 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg"
        >
          {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenFullscreen(); }}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
}
