import { Song } from '../types';
import { GoogleGenAI } from "@google/genai";

export async function fetchOnlineMetadata(title: string, artist: string): Promise<Partial<Song>> {
  const metadata: Partial<Song> = {};

  // 1. Try iTunes Search API (Fast, reliable for covers, no key needed)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${title} ${artist}`)}&entity=song&limit=1`;
    const itunesResponse = await fetch(itunesUrl);
    if (itunesResponse.ok) {
      const itunesData = await itunesResponse.json();
      if (itunesData.results && itunesData.results.length > 0) {
        const result = itunesData.results[0];
        metadata.title = result.trackName;
        metadata.artist = result.artistName;
        metadata.album = result.collectionName;
        metadata.genre = result.primaryGenreName;
        
        // Get high-res cover (replace 100x100 with 1000x1000)
        if (result.artworkUrl100) {
          const highResCover = result.artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg');
          try {
            const imgResponse = await fetch(highResCover);
            if (imgResponse.ok) {
              const blob = await imgResponse.blob();
              metadata.cover = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            console.error('iTunes cover fetch failed', e);
          }
        }
      }
    }
  } catch (e) {
    console.error('iTunes fetch failed', e);
  }

  // 2. Use Gemini with Google Search for lyrics and verification
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the official lyrics and accurate metadata (title, artist, album) for the song "${title}" by "${artist}". 
      Return the result in JSON format with keys: title, artist, album, lyrics. 
      If lyrics are found, provide the full text. If they are LRC format, that's even better.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    if (response.text) {
      const aiData = JSON.parse(response.text);
      if (aiData.title) metadata.title = aiData.title;
      if (aiData.artist) metadata.artist = aiData.artist;
      if (aiData.album) metadata.album = aiData.album;
      if (aiData.lyrics) metadata.lyrics = aiData.lyrics;
    }
  } catch (e) {
    console.error('Gemini metadata fetch failed', e);
  }

  return metadata;
}
