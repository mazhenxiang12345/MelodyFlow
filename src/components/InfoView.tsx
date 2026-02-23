import React from 'react';
import { Music2, Github, Info as InfoIcon, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function InfoView() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full">
      <div className="flex flex-col items-center text-center gap-6 py-12">
        <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <Music2 className="w-12 h-12 text-black" />
        </div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter">MelodyFlow</h1>
          <p className="text-zinc-400 mt-2 font-medium">{t.version} 1.0.0</p>
        </div>
      </div>

      <div className="space-y-8 mt-8">
        <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-400 font-bold leading-tight">
            {t.aiBuilt}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <InfoIcon className="w-6 h-6 text-emerald-500" />
            {t.aboutApp}
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            MelodyFlow is a high-performance, local-first music player designed for the modern web. 
            It allows you to manage and listen to your personal music collection directly in your browser 
            without uploading your files to any server.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
            <h3 className="font-bold text-lg mb-2">{t.localPrivacy}</h3>
            <p className="text-sm text-zinc-400">{t.localPrivacyDesc}</p>
          </div>
          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
            <h3 className="font-bold text-lg mb-2">{t.smartMetadata}</h3>
            <p className="text-sm text-zinc-400">{t.smartMetadataDesc}</p>
          </div>
          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
            <h3 className="font-bold text-lg mb-2">{t.pwaReady}</h3>
            <p className="text-sm text-zinc-400">{t.pwaReadyDesc}</p>
          </div>
          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
            <h3 className="font-bold text-lg mb-2">{t.modernUI}</h3>
            <p className="text-sm text-zinc-400">{t.modernUIDesc}</p>
          </div>
        </section>

        <footer className="pt-12 pb-8 border-t border-white/5 text-center">
          <p className="text-zinc-500 text-sm">{t.copyright}</p>
        </footer>
      </div>
    </div>
  );
}
