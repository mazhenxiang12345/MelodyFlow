import React, { useState, useRef } from 'react';
import { db } from '../db';
import { Song } from '../types';
import { X, Save, Image as ImageIcon, Upload } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MetadataEditorProps {
  song: Song;
  onClose: () => void;
}

export default function MetadataEditor({ song, onClose }: MetadataEditorProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: song.title,
    artist: song.artist,
    album: song.album,
    lyrics: song.lyrics || '',
    cover: song.cover || null,
  });

  const handleSave = async () => {
    await db.songs.update(song.id!, formData);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, cover: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold">{t.metadataEditor}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Image Section */}
            <div className="flex flex-col gap-4 items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 self-start">{t.coverImage}</label>
              <div className="relative group w-40 h-40 bg-zinc-800 rounded-xl overflow-hidden shadow-xl border border-white/5">
                {formData.cover ? (
                  <img src={formData.cover} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 text-white transition-colors hover:bg-black/60"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase">{t.changeCover}</span>
                </button>
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t.title}</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t.artist}</label>
                <input 
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t.album}</label>
            <input 
              type="text"
              value={formData.album}
              onChange={(e) => setFormData({ ...formData, album: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t.lyrics} (LRC or Text)</label>
            <textarea 
              rows={6}
              value={formData.lyrics}
              onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none font-mono text-sm"
              placeholder="[00:12.34] Lyric line..."
            />
          </div>
        </div>

        <div className="p-6 bg-black/40 border-t border-white/10 flex justify-end gap-4 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold hover:text-white transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-2 bg-emerald-500 text-black rounded-full text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
