import React from 'react';
import { Home, Library, Heart, PlusCircle, Music2, ListMusic, X, Settings, Info } from 'lucide-react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { db } from '../db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const navItems = [
    { id: 'library', label: t.home, icon: Home },
    { id: 'artists', label: t.artists, icon: Music2 },
    { id: 'albums', label: t.albums, icon: ListMusic },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleAddMusic = () => {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-black flex flex-col p-6 gap-8 border-r border-white/10 z-[70] transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Music2 className="w-8 h-8 text-emerald-500" />
            <span className="text-xl font-bold tracking-tight">MelodyFlow</span>
          </div>
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "flex items-center gap-4 px-2 py-1 transition-colors hover:text-white",
                activeTab === item.id ? "text-white" : "text-zinc-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">{t.library}</p>
          
          <button
            onClick={() => handleNavClick('favorites')}
            className={cn(
              "flex items-center gap-4 px-2 py-1 transition-colors hover:text-white",
              activeTab === 'favorites' ? "text-white" : "text-zinc-400"
            )}
          >
            <Heart className="w-6 h-6 text-pink-500" />
            <span className="font-medium">{t.likedSongs}</span>
          </button>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-4">
          <button
            onClick={handleAddMusic}
            className="flex items-center gap-4 px-2 py-1 transition-colors text-zinc-400 hover:text-white"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="font-medium">{t.addMusic}</span>
          </button>
          
          <button
            onClick={() => handleNavClick('settings')}
            className={cn(
              "flex items-center gap-4 px-2 py-1 transition-colors hover:text-white",
              activeTab === 'settings' ? "text-white" : "text-zinc-400"
            )}
          >
            <Settings className="w-6 h-6" />
            <span className="font-medium">{t.settings}</span>
          </button>

          <button
            onClick={() => handleNavClick('info')}
            className={cn(
              "flex items-center gap-4 px-2 py-1 transition-colors hover:text-white",
              activeTab === 'info' ? "text-white" : "text-zinc-400"
            )}
          >
            <Info className="w-6 h-6" />
            <span className="font-medium">{t.info}</span>
          </button>

          <div className="px-2 py-4 bg-zinc-900/50 rounded-xl border border-white/5 mt-2">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Local PWA Player. Your music stays on your device.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
