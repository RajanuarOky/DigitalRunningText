import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { Smartphone, VolumeX } from 'lucide-react';

export const PrayerModeScreen: React.FC = () => {
  const { data } = useMosque();

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700 select-none">
      <div className="relative z-10 flex flex-col items-center max-w-3xl">
        {/* Silent Icon */}
        <div className="w-20 h-20 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-8 text-slate-400">
          <div className="relative">
            <Smartphone className="w-10 h-10 text-slate-500" />
            <VolumeX className="w-6 h-6 text-rose-500 absolute -top-1 -right-2" />
          </div>
        </div>

        <h1 className="text-4xl lg:text-6xl font-black text-slate-200 tracking-wider uppercase font-serif mb-6 drop-shadow">
          {data.prayerMode.message || 'LURUSKAN DAN RAPATKAN SHAF'}
        </h1>

        <p className="text-lg lg:text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed">
          {data.prayerMode.submessage ||
            'Harap menonaktifkan atau mengheningkan nada dering ponsel demi menjaga kekhusyukan jamaah.'}
        </p>

        <div className="mt-12 text-xs text-slate-600 font-mono tracking-widest uppercase">
          Mode Sholat Berjamaah Aktif
        </div>
      </div>
    </div>
  );
};
