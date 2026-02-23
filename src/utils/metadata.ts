import * as mm from 'music-metadata-browser';
import { Buffer } from 'buffer';
import { Song } from '../types';

export async function parseMusicFile(file: File): Promise<Partial<Song>> {
  const metadata = await mm.parseBlob(file);
  const { common, format } = metadata;

  let cover: string | undefined;
  if (common.picture && common.picture.length > 0) {
    const pic = common.picture[0];
    const base64 = Buffer.from(pic.data).toString('base64');
    cover = `data:${pic.format};base64,${base64}`;
  }

  // Try to find lyrics in various possible locations
  let lyrics = '';
  if (common.lyrics && common.lyrics.length > 0) {
    lyrics = common.lyrics.join('\n');
  } else if (metadata.native) {
    // Some formats might have lyrics in native tags
    for (const tagType in metadata.native) {
      const tags = metadata.native[tagType];
      const lyricTag = tags.find(t => 
        t.id === 'USLT' || 
        t.id === 'lyrics' || 
        t.id === 'LYRICS' || 
        t.id === 'unsyncLyrics' ||
        t.id === 'SLT'
      );
      if (lyricTag && typeof lyricTag.value === 'string') {
        lyrics = lyricTag.value;
        break;
      } else if (lyricTag && typeof lyricTag.value === 'object' && lyricTag.value.text) {
        lyrics = lyricTag.value.text;
        break;
      }
    }
  }

  return {
    title: common.title || file.name.replace(/\.[^/.]+$/, ""),
    artist: common.artist || 'Unknown Artist',
    album: common.album || 'Unknown Album',
    genre: common.genre?.[0],
    year: common.year,
    duration: format.duration || 0,
    format: format.container || 'unknown',
    bitrate: format.bitrate,
    cover,
    lyrics: lyrics,
    file: file,
    addedAt: Date.now(),
    isFavorite: false,
  };
}
