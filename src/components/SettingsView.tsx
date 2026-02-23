import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { db } from '../db';
import { clsx } from 'clsx';
import { Clock, HardDrive, Music, Image as ImageIcon } from 'lucide-react';

export default function SettingsView() {
  const { language, setLanguage, t } = useLanguage();
  const { sleepTimer, setSleepTimer } = useAudio();
  const [storageStats, setStorageStats] = useState({
    songsCount: 0,
    coversCount: 0,
    totalSize: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const songs = await db.songs.toArray();
      let totalSize = 0;
      let coversCount = 0;

      songs.forEach(song => {
        totalSize += song.file.size;
        if (song.cover) {
          coversCount++;
          // Base64 size estimation: (string length * 3) / 4
          totalSize += (song.cover.length * 3) / 4;
        }
      });

      setStorageStats({
        songsCount: songs.length,
        coversCount,
        totalSize,
      });
    };

    fetchStats();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const timerOptions = [null, 15, 30, 45, 60, 90];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
      <h1 className="text-4xl font-black mb-8">{t.settings}</h1>
      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <span className="text-emerald-500 text-sm">Aa</span>
            </span>
            {t.appearance}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">{t.language}</span>
              <div className="flex bg-black rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setLanguage('en')}
                  className={clsx(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    language === 'en' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('zh')}
                  className={clsx(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    language === 'zh' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  中文
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playback Section */}
        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-500" />
            </span>
            {t.playback}
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <span className="text-zinc-300 font-medium">{t.sleepTimer}</span>
              <div className="flex flex-wrap gap-2">
                {timerOptions.map(option => (
                  <button
                    key={option === null ? 'off' : option}
                    onClick={() => setSleepTimer(option)}
                    className={clsx(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      sleepTimer === option 
                        ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                        : "bg-black border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    {option === null ? t.off : `${option} ${t.minutes}`}
                  </button>
                ))}
              </div>
              {sleepTimer !== null && (
                <p className="text-xs text-emerald-500 font-medium">
                  {sleepTimer} {t.minutes} remaining
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Storage Section */}
        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-emerald-500" />
            </span>
            {t.storage}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.totalSongs}</p>
                <p className="text-lg font-black">{storageStats.songsCount}</p>
              </div>
            </div>
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.totalCovers}</p>
                <p className="text-lg font-black">{storageStats.coversCount}</p>
              </div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">{t.totalSize}</p>
                <p className="text-lg font-black text-emerald-500">{formatSize(storageStats.totalSize)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
