import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, 
  ChevronDown, Heart, MoreHorizontal, Shuffle, 
  Repeat, Gauge, Repeat1, Mic2, ListMusic
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import LyricsView from './LyricsView';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FullscreenPlayerProps {
  onClose: () => void;
  onEditMetadata?: () => void;
}

export default function FullscreenPlayer({ onClose, onEditMetadata }: FullscreenPlayerProps) {
  const { 
    currentSong, isPlaying, togglePlay, progress, duration, seek, 
    playbackRate, setPlaybackRate, 
    abRepeat, setABRepeat, nextSong, prevSong,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat, toggleCurrentFavorite
  } = useAudio();
  const { t } = useLanguage();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const toggleAB = () => {
    if (!abRepeat.active) {
      if (abRepeat.start === null) {
        setABRepeat({ ...abRepeat, start: progress });
      } else if (abRepeat.end === null) {
        setABRepeat({ ...abRepeat, end: progress, active: true });
      }
    } else {
      setABRepeat({ start: null, end: null, active: false });
    }
  };

  const handleLyricsClick = () => {
    (window as any).setShowLyrics?.(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {currentSong.cover && (
          <img 
            src={currentSong.cover} 
            alt="" 
            className="w-full h-full object-cover blur-[100px] scale-150"
          />
        )}
      </div>

      {/* Header */}
      <header className="relative h-14 md:h-16 flex items-center justify-between px-4 md:px-6 z-10">
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors">
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <div className="flex flex-col items-center min-w-0 px-4">
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/40">{t.playingFrom} {t.library}</span>
          <span className="text-[10px] md:text-xs font-bold truncate max-w-[150px] md:max-w-[200px]">{currentSong.album}</span>
        </div>
        <button 
          onClick={onEditMetadata}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </header>

      {/* Main Content with Swipe Support */}
      <main className="relative flex-1 flex flex-col items-center justify-center z-10 overflow-hidden">
        <motion.div 
          className="w-full h-full max-w-4xl mx-auto relative cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 100) {
              prevSong();
            } else if (info.offset.x < -100) {
              nextSong(true);
            }
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSong.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col items-center justify-center gap-8 px-6 pointer-events-none"
            >
              <div className="w-64 h-64 md:w-96 md:h-96 bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02] flex-shrink-0 pointer-events-auto">
                {currentSong.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <ListMusic className="w-20 h-20 md:w-32 md:h-32" />
                  </div>
                )}
              </div>
              <div className="w-full max-w-md flex items-center justify-between gap-4 pointer-events-auto">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl md:text-4xl font-black truncate leading-tight">{currentSong.title}</h1>
                  <p className="text-lg md:text-xl text-white/60 truncate">{currentSong.artist}</p>
                </div>
                <button 
                  onClick={toggleCurrentFavorite}
                  className={cn(
                    "transition-colors flex-shrink-0 p-2",
                    currentSong.isFavorite ? "text-emerald-500" : "text-white/60 hover:text-white"
                  )}
                >
                  <Heart className={cn("w-6 h-6 md:w-8 md:h-8", currentSong.isFavorite && "fill-current")} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Controls Footer */}
      <footer className="relative p-6 md:p-12 flex flex-col gap-4 md:gap-6 z-10 max-w-4xl mx-auto w-full">
        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5 md:gap-2">
          <div className="relative h-1 md:h-1.5 group">
            <input 
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white group-hover:bg-emerald-500 transition-colors" 
                style={{ width: `${(progress / duration) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[8px] md:text-[10px] font-bold text-white/40">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <button 
            onClick={toggleShuffle}
            className={cn(
              "transition-colors p-2",
              isShuffle ? "text-emerald-500" : "text-white/40 hover:text-white"
            )}
          >
            <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="flex items-center gap-6 md:gap-12">
            <button onClick={prevSong} className="text-white hover:scale-110 transition-transform">
              <SkipBack className="w-6 h-6 md:w-8 md:h-8 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl"
            >
              {isPlaying ? <Pause className="w-7 h-7 md:w-10 md:h-10 fill-current" /> : <Play className="w-7 h-7 md:w-10 md:h-10 fill-current ml-1" />}
            </button>
            <button onClick={() => nextSong(true)} className="text-white hover:scale-110 transition-transform">
              <SkipForward className="w-6 h-6 md:w-8 md:h-8 fill-current" />
            </button>
          </div>

          <button 
            onClick={toggleRepeat}
            className={cn(
              "transition-colors p-2 relative",
              repeatMode !== 'none' ? "text-emerald-500" : "text-white/40 hover:text-white"
            )}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5 md:w-6 md:h-6" /> : <Repeat className="w-5 h-5 md:w-6 md:h-6" />}
            {repeatMode === 'all' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
          </button>
        </div>

        {/* Extra Controls - Centered and evenly spaced */}
        <div className="flex items-center justify-center gap-12 md:gap-24 mt-2 md:mt-4">
          <button 
            onClick={handleLyricsClick}
            className="p-1.5 md:p-2 text-white/40 hover:text-white transition-colors"
          >
            <Mic2 className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              <Gauge className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-bold">{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-zinc-900 border border-white/10 rounded-xl py-2 w-24 md:w-28 shadow-2xl z-50">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-xs md:text-sm hover:bg-white/10 transition-colors",
                      playbackRate === rate ? "text-emerald-500 font-bold" : "text-zinc-300"
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={toggleAB}
            className={cn(
              "transition-colors flex flex-col items-center",
              abRepeat.active ? "text-emerald-500" : "text-white/40 hover:text-white"
            )}
          >
            <Repeat1 className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[6px] md:text-[8px] font-bold uppercase">
              {abRepeat.start !== null && abRepeat.end === null ? t.setB : t.abRepeat}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}
