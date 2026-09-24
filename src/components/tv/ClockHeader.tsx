import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { formatTimeHMS } from '../../utils/formatters';
import { getHijriDate, formatMasehiDate } from '../../utils/hijriDate';
import { VolumeX, Moon } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

export const ClockHeader: React.FC = () => {
  const { data, currentTime, isAudioUnlocked, unlockAudio } = useMosque();
  const hijri = getHijriDate(currentTime, data.mosque.hijriOffset);

  return (
    <header className="w-full bg-slate-900/95 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between shadow-xl select-none">
      {/* Profil Masjid */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Moon className="w-6 h-6 text-emerald-300" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-black tracking-wide text-white uppercase truncate font-sans">
            {data.mosque.name}
          </h1>
          <p className="text-xs text-emerald-300/80 font-medium truncate">
            {data.mosque.address}
          </p>
        </div>
      </div>

      {/* Tanggal & Jam */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Status Indikator (Cloud & Audio) */}
        <div className="hidden md:flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
              supabaseService.isConfigured()
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={supabaseService.isConfigured() ? 'Cloud Sync Online' : 'Mode Offline / Lokal'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseService.isConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{supabaseService.isConfigured() ? 'Online' : 'Lokal'}</span>
          </div>

          {!isAudioUnlocked && (
            <button
              onClick={unlockAudio}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold animate-pulse hover:bg-amber-500/30 cursor-pointer"
              title="Klik untuk aktifkan audio"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Aktifkan Audio</span>
            </button>
          )}
        </div>

        {/* Tanggal Masehi & Hijriah */}
        <div className="text-right block border-r border-slate-800 pr-4">
          <div className="text-xs lg:text-sm font-bold text-slate-200">
            {formatMasehiDate(currentTime)}
          </div>
          <div className="text-[11px] lg:text-xs font-extrabold text-amber-400 tracking-wider">
            {hijri.formatted}
          </div>
        </div>

        {/* Jam Digital Real-time */}
        <div className="bg-slate-950 border border-emerald-500/50 px-4 py-1.5 rounded-xl shadow-inner flex items-baseline gap-1.5">
          <span className="font-mono text-2xl lg:text-3xl font-black tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
            {formatTimeHMS(currentTime)}
          </span>
          <span className="text-[10px] font-bold text-emerald-300/70 tracking-tight uppercase">
            WIB
          </span>
        </div>
      </div>
    </header>
  );
};
