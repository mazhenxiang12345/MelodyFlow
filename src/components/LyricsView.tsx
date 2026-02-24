import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { Music2 } from 'lucide-react';
import { LyricsIcon } from './Icons';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LyricLine {
  time: number;
  text: string;
}

export default function LyricsView() {
  const { currentSong, progress, seek } = useAudio();
  const { t } = useLanguage();
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parsedLyrics = useMemo(() => {
    if (!currentSong?.lyrics) return [];
    
    const offset = currentSong.lyricOffset || 0;
    const lines = currentSong.lyrics.split('\n');
    const result: LyricLine[] = [];
    
    // LRC format: [mm:ss.xx] text or [mm:ss:xx] text
    const lrcRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/;
    
    lines.forEach(line => {
      const match = line.match(lrcRegex);
      if (match) {
        const mins = parseInt(match[1]);
        const secs = parseInt(match[2]);
        const msStr = match[3];
        const ms = parseInt(msStr.padEnd(3, '0').slice(0, 3));
        const time = mins * 60 + secs + ms / 1000 + offset;
        const text = match[4].trim();
        if (text) result.push({ time, text });
      } else {
        const text = line.replace(/\[.*\]/, '').trim();
        if (text) result.push({ time: -1, text });
      }
    });
    
    return result;
  }, [currentSong?.lyrics, currentSong?.lyricOffset]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active lyric
  useEffect(() => {
    if (isUserScrolling) return;

    const activeElement = containerRef.current?.querySelector('.active-lyric');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [progress, parsedLyrics, isUserScrolling]);

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000); // Resume auto-scroll after 3 seconds of inactivity
  };

  if (!currentSong) return null;

  if (!currentSong.lyrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 p-8">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
          <LyricsIcon className="w-10 h-10 opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{t.noLyrics}</p>
          <p className="text-sm text-zinc-400 mt-1">{t.addLyricsDesc}</p>
        </div>
      </div>
    );
  }

  const hasTimecodes = parsedLyrics.some(l => l.time !== -1);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div 
        ref={containerRef} 
        onScroll={handleScroll}
        onTouchStart={() => setIsUserScrolling(true)}
        className="flex-1 overflow-y-auto px-6 md:px-12 py-20 scroll-smooth no-scrollbar select-none touch-pan-y"
      >
      <div className="max-w-3xl mx-auto flex flex-col gap-6 md:gap-10">
        {parsedLyrics.map((line, index) => {
          const isActive = line.time !== -1 && 
            progress >= line.time && 
            (index === parsedLyrics.length - 1 || progress < parsedLyrics[index + 1].time);

          return (
            <p
              key={index}
              onClick={() => {
                if (line.time !== -1) {
                  seek(line.time);
                  setIsUserScrolling(false);
                }
              }}
              className={cn(
                "text-2xl md:text-5xl font-black transition-all duration-500 cursor-pointer origin-left leading-tight",
                isActive 
                  ? "text-white scale-105 opacity-100 active-lyric" 
                  : "text-white/20 hover:text-white/40"
              )}
            >
              {line.text}
            </p>
          );
        })}
        {!hasTimecodes && (
          <p className="text-center text-zinc-500 text-sm mt-10 italic">
            {t.unsyncedLyrics}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
