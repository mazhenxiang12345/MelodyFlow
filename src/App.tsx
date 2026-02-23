import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Library from './components/Library';
import LyricsView from './components/LyricsView';
import SettingsView from './components/SettingsView';
import InfoView from './components/InfoView';
import MetadataEditor from './components/MetadataEditor';
import FullscreenPlayer from './components/FullscreenPlayer';
import { AudioProvider, useAudio } from './context/AudioContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { db } from './db';
import { Music, Mic2, Settings, Menu, Plus, ArrowLeft } from 'lucide-react';
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
  const { currentSong } = useAudio();
  const { t } = useLanguage();

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
                <Mic2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {t.lyrics}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleAddMusic}
              className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-white/10"
              title={t.addMusic}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

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
