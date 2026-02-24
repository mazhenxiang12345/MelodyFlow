import React, { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { useDropzone } from 'react-dropzone';
import { db } from '../db';
import { parseMusicFile } from '../utils/metadata';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Play, MoreHorizontal, Heart, Clock3, 
  Music, Upload, Filter, Search as SearchIcon,
  ChevronRight, PlusSquare, Volume2, ArrowUpDown,
  CheckSquare, Square, Trash2, X, LocateFixed
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Song } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LibraryProps {
  view: string; // 'all', 'favorites', 'artists', 'albums'
}

export default function Library({ view }: LibraryProps) {
  const { playSong, setQueue, currentSong, isPlaying, removeSongs } = useAudio();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'added' | 'title'>('added');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(new Set());

  // Expose selectedGroup to window for App.tsx to change menu icon
  React.useEffect(() => {
    (window as any).setIsGroupSelected?.(!!selectedGroupName);
    (window as any).clearSelectedGroup = () => setSelectedGroupName(null);
    return () => {
      (window as any).setIsGroupSelected?.(false);
      delete (window as any).clearSelectedGroup;
    };
  }, [selectedGroupName]);

  // Reset selected group when view changes
  React.useEffect(() => {
    setSelectedGroupName(null);
    setIsMultiSelectMode(false);
    setSelectedSongIds(new Set());
  }, [view]);

  const songs = useLiveQuery(async () => {
    if (view === 'favorites') {
      return await db.songs.filter(s => !!s.isFavorite && !s.deletedAt).toArray();
    }
    return await db.songs.filter(s => !s.deletedAt).reverse().sortBy('addedAt');
  }, [view]);

  const groupedSongs = useMemo<Record<string, Song[]> | null>(() => {
    if (!songs) return null;
    if (view === 'artists') {
      const groups: Record<string, Song[]> = {};
      songs.forEach(s => {
        const artistStr = s.artist || 'Unknown Artist';
        // Split by , 、 ; / (both half-width and full-width)
        const artists = artistStr.split(/[,，、;；/／\\]/).map(a => a.trim()).filter(Boolean);
        if (artists.length === 0) artists.push('Unknown Artist');
        
        artists.forEach(artist => {
          if (!groups[artist]) groups[artist] = [];
          groups[artist].push(s);
        });
      });
      return groups;
    }
    if (view === 'albums') {
      const groups: Record<string, Song[]> = {};
      songs.forEach(s => {
        const album = s.album || 'Unknown Album';
        if (!groups[album]) groups[album] = [];
        groups[album].push(s);
      });
      return groups;
    }
    return null;
  }, [songs, view]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    for (const file of acceptedFiles) {
      try {
        const songData = await parseMusicFile(file);
        await db.songs.add(songData as Song);
      } catch (err) {
        console.error('Failed to parse file:', file.name, err);
      }
    }
    setIsUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'] 
    },
    noClick: true
  } as any);

  const displaySongs = useMemo(() => {
    if (!songs) return [];
    if (!selectedGroupName) return songs;

    if (view === 'artists') {
      return songs.filter(s => {
        const artistStr = s.artist || 'Unknown Artist';
        const artists = artistStr.split(/[,，、;；/／\\]/).map(a => a.trim()).filter(Boolean);
        if (artists.length === 0) return selectedGroupName === 'Unknown Artist';
        return artists.includes(selectedGroupName);
      });
    }
    if (view === 'albums') {
      return songs.filter(s => (s.album || 'Unknown Album') === selectedGroupName);
    }
    return songs;
  }, [songs, selectedGroupName, view]);

  const filteredSongs = useMemo(() => {
    if (!displaySongs) return [];
    
    let result = displaySongs.filter(song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    } else {
      result = [...result].sort((a, b) => b.addedAt - a.addedAt);
    }

    return result;
  }, [displaySongs, searchQuery, sortBy]);

  const toggleFavorite = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    await db.songs.update(song.id!, { isFavorite: !song.isFavorite });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAll = () => {
    if (filteredSongs && filteredSongs.length > 0) {
      setQueue(filteredSongs);
      playSong(filteredSongs[0]);
    }
  };

  const scrollToCurrentSong = () => {
    if (!currentSong?.id) return;
    const element = document.getElementById(`song-${currentSong.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      element.classList.add('bg-emerald-500/20');
      setTimeout(() => {
        element.classList.remove('bg-emerald-500/20');
      }, 2000);
    }
  };

  const toggleSongSelection = (songId: number) => {
    const newSelection = new Set(selectedSongIds);
    if (newSelection.has(songId)) {
      newSelection.delete(songId);
    } else {
      newSelection.add(songId);
    }
    setSelectedSongIds(newSelection);
  };

  const handleBulkLike = async () => {
    const ids = Array.from(selectedSongIds) as number[];
    await db.songs.where('id').anyOf(ids).modify({ isFavorite: true });
    setIsMultiSelectMode(false);
    setSelectedSongIds(new Set());
  };

  const handleBulkUnlike = async () => {
    const ids = Array.from(selectedSongIds) as number[];
    await db.songs.where('id').anyOf(ids).modify({ isFavorite: false });
    setIsMultiSelectMode(false);
    setSelectedSongIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedSongIds) as number[];
    removeSongs(ids);
    await db.songs.where('id').anyOf(ids).modify({ deletedAt: Date.now() });
    setIsMultiSelectMode(false);
    setSelectedSongIds(new Set());
  };

  return (
    <div {...getRootProps()} className="flex-1 flex flex-col min-h-0 relative">
      <input {...getInputProps()} />

      {/* Bulk Action Bar (Top) */}
      {isMultiSelectMode && selectedSongIds.size > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl z-[70] flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-4 border-r border-white/10">
            <span className="text-sm font-black text-emerald-500">{selectedSongIds.size}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t.selected}</span>
          </div>
          <div className="flex items-center gap-2">
            {view === 'favorites' ? (
              <button 
                onClick={handleBulkUnlike}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm font-bold text-white transition-all active:scale-95"
              >
                <Heart className="w-4 h-4" />
                {t.bulkUnlike}
              </button>
            ) : (
              <button 
                onClick={handleBulkLike}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-full text-sm font-black text-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Heart className="w-5 h-5 fill-current" />
                {t.bulkLike}
              </button>
            )}
            <button 
              onClick={handleBulkDelete}
              className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full text-zinc-400 transition-all active:scale-95"
              title={t.bulkDelete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button 
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedSongIds(new Set());
              }}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 bg-gradient-to-b from-zinc-800/50 to-transparent">
        <div className="flex items-center md:items-end gap-4 md:gap-6">
          <div className="w-24 h-24 md:w-40 md:h-40 bg-zinc-800 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden group relative flex-shrink-0">
            {selectedGroupName ? (
              <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center">
                <Music className="w-10 h-10 md:w-20 md:h-20 text-white/40" />
              </div>
            ) : view === 'favorites' ? (
              <div className="w-full h-full bg-gradient-to-br from-purple-700 to-blue-500 flex items-center justify-center">
                <Heart className="w-10 h-10 md:w-20 md:h-20 fill-white" />
              </div>
            ) : (
              <Music className="w-10 h-10 md:w-20 md:h-20 text-zinc-600" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                className="p-2 md:p-3 bg-emerald-500 rounded-full text-black hover:scale-110 transition-transform"
              >
                <Upload className="w-4 h-4 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1 md:gap-2 min-w-0">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
              {selectedGroupName ? (view === 'artists' ? t.artist : t.album) : t.playlist}
            </span>
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-black tracking-tighter truncate">
              {selectedGroupName ? selectedGroupName : (
                view === 'favorites' ? t.likedSongs : 
                view === 'artists' ? t.artists :
                view === 'albums' ? t.albums :
                t.allMusic
              )}
            </h1>
            <div className="flex items-center gap-2 text-[10px] md:text-sm text-zinc-400 mt-1">
              <span className="font-bold text-white">MelodyFlow</span>
              <span>•</span>
              <span>{filteredSongs?.length || 0} {t.songs}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-4">
          <button 
            onClick={handlePlayAll}
            className="w-10 h-10 md:w-14 md:h-14 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg flex-shrink-0"
          >
            <Play className="w-5 h-5 md:w-7 md:h-7 fill-current ml-1" />
          </button>
          <div className="relative flex-1 max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder={`${t.search}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border-none rounded-full py-1.5 md:py-2 pl-9 md:pl-10 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-white/20 transition-all outline-none"
              />
            </div>
            
            {currentSong && filteredSongs.some(s => s.id === currentSong.id) && (
              <button 
                onClick={scrollToCurrentSong}
                className="p-2 bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all"
                title="Locate current song"
              >
                <LocateFixed className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedSongIds(new Set());
              }}
              className={cn(
                "p-2 rounded-full transition-all",
                isMultiSelectMode ? "bg-emerald-500 text-black" : "bg-white/10 text-zinc-400 hover:text-white"
              )}
              title={t.multiSelect}
            >
              <CheckSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
        {groupedSongs && !selectedGroupName ? (
          <div className="flex flex-col gap-8">
            {(Object.entries(groupedSongs) as [string, Song[]][]).map(([groupName, groupSongs]) => (
              <div key={groupName} className="flex flex-col gap-4">
                <div 
                  className="flex items-center gap-4 group cursor-pointer w-fit"
                  onClick={() => setSelectedGroupName(groupName)}
                >
                  <h2 className="text-xl md:text-2xl font-bold hover:underline">{groupName}</h2>
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {groupSongs.slice(0, 5).map(song => (
                    <div 
                      key={song.id}
                      onClick={() => {
                        setQueue(groupSongs);
                        playSong(song);
                      }}
                      className="bg-zinc-900/40 p-3 md:p-4 rounded-xl hover:bg-zinc-800/60 transition-all group cursor-pointer border border-white/5"
                    >
                      <div className="aspect-square bg-zinc-800 rounded-lg mb-3 md:mb-4 overflow-hidden shadow-xl relative">
                        {song.cover ? (
                          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Music className="w-8 h-8 md:w-12 md:h-12" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-2xl">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black">
                            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-xs md:text-sm truncate">{song.title}</h3>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-1">{song.artist}</p>
                    </div>
                  ))}
                  {groupSongs.length > 5 && (
                    <div 
                      onClick={() => setSelectedGroupName(groupName)}
                      className="bg-zinc-900/40 p-3 md:p-4 rounded-xl hover:bg-zinc-800/60 transition-all group cursor-pointer border border-white/5 flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                        <ChevronRight className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white">View All</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[16px_1fr_minmax(100px,auto)] gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/10 mb-4 sticky top-0 bg-black/80 backdrop-blur-md z-10">
              <span>#</span>
              <span>Title</span>
              <div className="flex justify-end pr-4 relative">
                <button 
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="hover:text-white transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl py-2 w-40 shadow-2xl z-50">
                    <div className="flex items-center justify-between px-4 py-1">
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">{t.sortBy}</p>
                      <button 
                        onClick={() => setShowSortMenu(false)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSortBy('added');
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-xs hover:bg-white/10 transition-colors",
                        sortBy === 'added' ? "text-emerald-500 font-bold" : "text-zinc-300"
                      )}
                    >
                      {t.dateAdded}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('title');
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-xs hover:bg-white/10 transition-colors",
                        sortBy === 'title' ? "text-emerald-500 font-bold" : "text-zinc-300"
                      )}
                    >
                      {t.titleAZ}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              {filteredSongs?.map((song, index) => (
                <div 
                  key={song.id}
                  id={`song-${song.id}`}
                  onClick={() => {
                    if (isMultiSelectMode) {
                      toggleSongSelection(song.id!);
                    } else {
                      setQueue(filteredSongs);
                      playSong(song);
                    }
                  }}
                  className={cn(
                    "grid grid-cols-[16px_1fr_minmax(100px,auto)] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition-colors group items-center cursor-default",
                    currentSong?.id === song.id && !isMultiSelectMode && "text-emerald-500",
                    isMultiSelectMode && selectedSongIds.has(song.id!) && "bg-emerald-500/10"
                  )}
                >
                  <div className="flex items-center justify-center text-xs text-zinc-500">
                    {isMultiSelectMode ? (
                      <div className="cursor-pointer">
                        {selectedSongIds.has(song.id!) ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        )}
                      </div>
                    ) : (
                      <>
                        {currentSong?.id === song.id ? (
                          isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <div className="w-0.5 bg-emerald-500 animate-[bounce_0.6s_infinite]" />
                              <div className="w-0.5 bg-emerald-500 animate-[bounce_0.8s_infinite]" />
                              <div className="w-0.5 bg-emerald-500 animate-[bounce_0.5s_infinite]" />
                            </div>
                          ) : (
                            <Volume2 className="w-4 h-4 text-emerald-500" />
                          )
                        ) : (
                          <span className="group-hover:hidden">{index + 1}</span>
                        )}
                        <Play className="w-3 h-3 fill-current hidden group-hover:block text-white" />
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded flex-shrink-0 overflow-hidden">
                      {song.cover ? (
                        <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs md:text-sm font-medium truncate text-white group-hover:text-white">{song.title}</span>
                      <span className="text-[10px] md:text-xs text-zinc-400 truncate group-hover:text-zinc-300">
                        {song.artist} {song.album && `• ${song.album}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 md:gap-4 pr-4">
                    {!isMultiSelectMode && (
                      <>
                        <button 
                          onClick={(e) => toggleFavorite(e, song)}
                          className={cn(
                            "md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1",
                            song.isFavorite ? "opacity-100 text-emerald-500" : "opacity-100 md:opacity-0 text-zinc-400 hover:text-white"
                          )}
                        >
                          <Heart className={cn("w-3 h-3 md:w-4 md:h-4", song.isFavorite && "fill-current")} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            (window as any).editSong?.(song);
                          }}
                          className="md:opacity-0 md:group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white p-1"
                        >
                          <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {filteredSongs?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
            <Music className="w-16 h-16 opacity-20" />
            <div className="text-center">
              <p className="text-lg font-medium">{t.emptyLibrary}</p>
              <p className="text-sm">{t.dragDrop}</p>
            </div>
            <button 
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="mt-4 px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
            >
              {t.addFiles}
            </button>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm border-2 border-dashed border-emerald-500 z-50 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <Upload className="w-16 h-16 text-emerald-500 animate-bounce" />
          <p className="text-2xl font-black text-white">{t.dropToAdd}</p>
        </div>
      )}

      {isUploading && (
        <div className="absolute bottom-4 right-4 bg-zinc-800 border border-white/10 rounded-lg p-4 shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">{t.processing}</span>
        </div>
      )}
    </div>
  );
}
