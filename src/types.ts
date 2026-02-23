export interface Song {
  id?: number;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: number;
  duration: number; // in seconds
  format: string;
  bitrate?: number;
  cover?: string; // base64 or blob url
  lyrics?: string;
  file: Blob;
  addedAt: number;
  isFavorite: boolean;
}

export interface Playlist {
  id?: number;
  name: string;
  songIds: number[];
  createdAt: number;
}
