import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../types';

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playbackRate: number;
  abRepeat: { start: number | null; end: number | null; active: boolean };
  isShuffle: boolean;
  repeatMode: 'none' | 'one' | 'all';
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setABRepeat: (ab: { start: number | null; end: number | null; active: boolean }) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleCurrentFavorite: () => void;
  nextSong: (manual?: boolean) => void;
  prevSong: () => void;
  removeSongs: (ids: number[]) => void;
  updateCurrentSong: (song: Song) => void;
  queue: Song[];
  setQueue: (songs: Song[]) => void;
  sleepTimer: number | null; // minutes remaining
  setSleepTimer: (minutes: number | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [abRepeat, setABRepeat] = useState<{ start: number | null; end: number | null; active: boolean }>({
    start: null,
    end: null,
    active: false,
  });
  const [queue, setQueue] = useState<Song[]>([]);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const removeSongs = (ids: number[]) => {
    const newQueue = queue.filter(s => !ids.includes(s.id!));
    setQueue(newQueue);
    
    if (currentSong && ids.includes(currentSong.id!)) {
      if (newQueue.length > 0) {
        nextSong(true);
      } else {
        setCurrentSong(null);
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      }
    }
  };

  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      
      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 1) {
            if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
            setIsPlaying(false);
            audioRef.current?.pause();
            return null;
          }
          return prev - 1;
        });
      }, 60000); // every minute
    } else {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    }

    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepTimer]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      
      // AB Repeat logic
      if (abRepeat.active && abRepeat.start !== null && abRepeat.end !== null) {
        if (audio.currentTime >= abRepeat.end) {
          audio.currentTime = abRepeat.start;
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextSong();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [abRepeat, queue, repeatMode, isShuffle, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const currentUrlRef = useRef<string | null>(null);

  const playSong = (song: Song) => {
    if (audioRef.current) {
      // Revoke old URL if exists
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }

      // Create a blob URL for the file
      const url = URL.createObjectURL(song.file);
      currentUrlRef.current = url;
      
      audioRef.current.src = url;
      setCurrentSong(song);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  
  const toggleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const toggleCurrentFavorite = async () => {
    if (currentSong && currentSong.id) {
      const newStatus = !currentSong.isFavorite;
      const { db } = await import('../db');
      await db.songs.update(currentSong.id, { isFavorite: newStatus });
      setCurrentSong({ ...currentSong, isFavorite: newStatus });
    }
  };

  const nextSong = (manual = false) => {
    if (queue.length > 0 && currentSong) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      
      if (isShuffle) {
        const randomIndex = Math.floor(Math.random() * queue.length);
        playSong(queue[randomIndex]);
      } else {
        const nextIndex = (currentIndex + 1) % queue.length;
        
        // If we reached the end
        if (nextIndex === 0) {
          if (repeatMode === 'all' || manual) {
            playSong(queue[0]);
          } else {
            // End of list and not repeating
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
          }
        } else {
          playSong(queue[nextIndex]);
        }
      }
    }
  };

  const prevSong = () => {
    if (queue.length > 0 && currentSong) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      playSong(queue[prevIndex]);
    }
  };

  const updateCurrentSong = (song: Song) => {
    setCurrentSong(song);
    // Also update in queue
    setQueue(prev => prev.map(s => s.id === song.id ? song : s));
  };

  useEffect(() => {
    (window as any).updateCurrentSong = updateCurrentSong;
    return () => { delete (window as any).updateCurrentSong; };
  }, [currentSong, queue]);

  return (
    <AudioContext.Provider value={{
      currentSong, isPlaying, progress, duration, volume, playbackRate, abRepeat,
      isShuffle, repeatMode,
      playSong, togglePlay, seek, setVolume, setPlaybackRate, setABRepeat,
      toggleShuffle, toggleRepeat, toggleCurrentFavorite,
      nextSong, prevSong, removeSongs, updateCurrentSong, queue, setQueue,
      sleepTimer, setSleepTimer
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
