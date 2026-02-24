import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Library from './components/Library';
import LyricsView from './components/LyricsView';
import SettingsView from './components/SettingsView';
import InfoView from './components/InfoView';
import MetadataEditor from './components/MetadataEditor';
import FullscreenPlayer from './components/FullscreenPlayer';
import { LyricsIcon } from './components/Icons';
import { AudioProvider, useAudio } from './context/AudioContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { db } from './db';
import { Music, Mic2, Settings, Menu, Plus, ArrowLeft, Timer, Minus, RotateCcw, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function MainContent() {
  const [activeTab, setActiveTab] = useState('library');
  const [showLyrics, setShowLyrics] = useState(false);
  const [editingSong, setEditingSong] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isGroupSelected, setIsGroupSelected] = useState(false);
  const [showLyricOffset, setShowLyricOffset] = useState(false);
  const { currentSong, updateCurrentSong } = useAudio();
  const { t } = useLanguage();

  useEffect(() => {
    const cleanupTrash = async () => {
      const saved = localStorage.getItem('autoDeleteDays');
      const days = saved ? JSON.parse(saved) : null;
      if (days === null) return;

      const now = Date.now();
      const threshold = days * 24 * 60 * 60 * 1000;
      
      const allSongs = await db.songs.toArray();
      const toDelete = allSongs.filter(s => s.deletedAt && (now - s.deletedAt > threshold));
      
      if (toDelete.length > 0) {
        const ids = toDelete.map(s => s.id!).filter(Boolean);
        await db.songs.bulkDelete(ids);
      }
    };

    cleanupTrash();
  }, []);

  useEffect(() => {
    (window as any).editSong = setEditingSong;
    (window as any).setActiveTab = setActiveTab;
    (window as any).setShowLyrics = setShowLyrics;
    (window as any).setIsGroupSelected = setIsGroupSelected;
    return () => { 
      delete (window as any).editSong; 
      delete (window as any).setActiveTab;
      delete (window as any).setShowLyrics;
      delete (window as any).setIsGroupSelected;
    };
  }, []);

  const handleAddMusic = () => {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };

  const handleAdjustOffset = async (delta: number) => {
    if (!currentSong?.id) return;
    const newOffset = (currentSong.lyricOffset || 0) + delta;
    await db.songs.update(currentSong.id, { lyricOffset: newOffset });
    updateCurrentSong({ ...currentSong, lyricOffset: newOffset });
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden relative selection:bg-emerald-500/30">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-zinc-900 to-black relative">
        {/* Top Navbar */}
        <div className="h-16 flex items-center justify-between px-4 md:px-8 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (isGroupSelected) {
                  (window as any).clearSelectedGroup?.();
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              className="p-2 md:hidden text-zinc-400 hover:text-white transition-colors"
            >
              {(activeTab === 'settings' || activeTab === 'info' || (activeTab !== 'settings' && activeTab !== 'info' && isGroupSelected)) ? (
                <ArrowLeft className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setShowLyrics(false)}
                className={cn(
                  "px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold transition-all",
                  !showLyrics ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                )}
              >
                {t.library}
              </button>
              <button 
                onClick={() => setShowLyrics(true)}
                className={cn(
                  "px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2",
                  showLyrics ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                )}
              >
                <LyricsIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {t.lyrics}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showLyrics && currentSong?.lyrics && (
              <button 
                onClick={() => setShowLyricOffset(!showLyricOffset)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                  showLyricOffset 
                    ? "bg-emerald-500 border-emerald-500 text-black" 
                    : "bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700"
                )}
                title={t.lyricOffset}
              >
                <Timer className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleAddMusic}
              className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-white/10"
              title={t.addMusic}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lyric Offset Capsule */}
        {showLyrics && showLyricOffset && currentSong && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[30] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 shadow-2xl flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 border-r border-white/10">
                <Timer className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t.lyricOffset}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleAdjustOffset(-0.1)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                  title="-100ms"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="px-2 min-w-[70px] text-center">
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    {((currentSong.lyricOffset || 0) * 1000).toFixed(0)}ms
                  </span>
                </div>
                <button 
                  onClick={() => handleAdjustOffset(0.1)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                  title="+100ms"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button 
                  onClick={() => handleAdjustOffset(-(currentSong.lyricOffset || 0))}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button 
                  onClick={() => setShowLyricOffset(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {showLyrics ? (
            <LyricsView />
          ) : activeTab === 'settings' ? (
            <SettingsView />
          ) : activeTab === 'info' ? (
            <InfoView />
          ) : (
            <Library view={activeTab} />
          )}
        </div>

        {/* Metadata Editor Modal */}
        {editingSong && (
          <MetadataEditor 
            song={editingSong} 
            onClose={() => setEditingSong(null)} 
          />
        )}

        {/* Fullscreen Player */}
        {isFullscreenPlayerOpen && (
          <FullscreenPlayer 
            onClose={() => setIsFullscreenPlayerOpen(false)} 
            onEditMetadata={() => {
              if (currentSong) setEditingSong(currentSong);
            }}
          />
        )}

        <Player onOpenFullscreen={() => setIsFullscreenPlayerOpen(true)} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AudioProvider>
        <MainContent />
      </AudioProvider>
    </LanguageProvider>
  );
}
