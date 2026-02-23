import Dexie, { type Table } from 'dexie';
import { Song, Playlist } from './types';

export class MusicDatabase extends Dexie {
  songs!: Table<Song>;
  playlists!: Table<Playlist>;

  constructor() {
    super('MusicDatabase');
    this.version(3).stores({
      songs: '++id, title, artist, album, isFavorite, addedAt',
      playlists: '++id, name, songIds, createdAt'
    });
  }
}

export const db = new MusicDatabase();
