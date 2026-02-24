import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { db } from '../db';
import { clsx } from 'clsx';
import { Clock, HardDrive, Music, Image as ImageIcon, Trash2, RotateCcw, Calendar, Check, X } from 'lucide-react';
import { Song } from '../types';

export default function SettingsView() {
  const { language, setLanguage, t } = useLanguage();
  const { sleepTimer, setSleepTimer } = useAudio();
  const [storageStats, setStorageStats] = useState({
    songsCount: 0,
    coversCount: 0,
    totalSize: 0,
    deletedCount: 0,
  });
  const [deletedSongs, setDeletedSongs] = useState<Song[]>([]);
  const [showRestoreList, setShowRestoreList] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(() => {
    const saved = localStorage.getItem('autoDeleteDays');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('autoDeleteDays', JSON.stringify(autoDeleteDays));
  }, [autoDeleteDays]);

  const fetchStats = async () => {
    const allSongs = await db.songs.toArray();
    const songs = allSongs.filter(s => !s.deletedAt);
    const deleted = allSongs.filter(s => !!s.deletedAt);
    
    let totalSize = 0;
    let coversCount = 0;

    allSongs.forEach(song => {
      totalSize += song.file.size;
      if (song.cover) {
        coversCount++;
        totalSize += (song.cover.length * 3) / 4;
      }
    });

    setStorageStats({
      songsCount: songs.length,
      coversCount,
      totalSize,
      deletedCount: deleted.length,
    });
    setDeletedSongs(deleted);
  };

  useEffect(() => {
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
  const autoDeleteOptions = [null, 7, 15, 30, 90];

  const handleEmptyTrash = async () => {
    if (confirm(t.confirmDelete)) {
      const ids = deletedSongs.map(s => s.id!).filter(Boolean);
      await db.songs.bulkDelete(ids);
      fetchStats();
    }
  };

  const handleRestore = async (songId: number) => {
    await db.songs.update(songId, { deletedAt: undefined });
    fetchStats();
  };

  const handleRestoreAll = async () => {
    const ids = deletedSongs.map(s => s.id!).filter(Boolean);
    await db.songs.where('id').anyOf(ids).modify({ deletedAt: undefined });
    fetchStats();
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full relative">
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

        {/* Recycle Bin Section */}
        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </span>
            {t.trash}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button 
              onClick={handleEmptyTrash}
              disabled={storageStats.deletedCount === 0}
              className="p-4 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-red-500/20 flex items-center gap-4 transition-all group"
            >
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-red-500">{t.emptyTrash}</p>
                <p className="text-[10px] text-red-500/60 uppercase tracking-widest font-bold">{storageStats.deletedCount} {t.songs}</p>
              </div>
            </button>

            <button 
              onClick={() => setShowRestoreList(true)}
              disabled={storageStats.deletedCount === 0}
              className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-emerald-500/20 flex items-center gap-4 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-emerald-500">{t.restoreDeleted}</p>
                <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-bold">{t.library}</p>
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-zinc-300 font-medium">
                <Calendar className="w-4 h-4" />
                <span>{t.autoDeleteTime}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {autoDeleteOptions.map(option => (
                  <button
                    key={option === null ? 'never' : option}
                    onClick={() => setAutoDeleteDays(option)}
                    className={clsx(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      autoDeleteDays === option 
                        ? "bg-white border-white text-black shadow-lg" 
                        : "bg-black border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    {option === null ? t.never : `${option} ${t.days}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restore List Modal */}
      {showRestoreList && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black">{t.restoreDeleted}</h3>
                <p className="text-xs text-zinc-500 mt-1">{storageStats.deletedCount} {t.songs} {t.trash}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRestoreAll}
                  className="px-4 py-2 bg-emerald-500 text-black rounded-full text-xs font-black hover:scale-105 transition-transform"
                >
                  {t.restore} All
                </button>
                <button 
                  onClick={() => setShowRestoreList(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {deletedSongs.map(song => (
                  <div key={song.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                        {song.cover ? (
                          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{song.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRestore(song.id!)}
                      className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"
                      title={t.restore}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
