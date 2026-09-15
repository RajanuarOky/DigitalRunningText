import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { formatTimeHMS } from '../../utils/formatters';
import { getHijriDate, formatMasehiDate } from '../../utils/hijriDate';
import { Volume2, VolumeX, Moon } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

export const ClockHeader: React.FC = () => {
  const { data, currentTime, isAudioUnlocked, unlockAudio } = useMosque();
  const hijri = getHijriDate(currentTime, data.mosque.hijriOffset);

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-emerald-500/20 px-6 py-3 flex items-center justify-between shadow-xl">
      {/* Profil Masjid */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center">
            <Moon className="w-8 h-8 text-emerald-300" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-wide text-white font-serif uppercase truncate">
            {data.mosque.name}
          </h1>
          <p className="text-xs lg:text-sm text-emerald-300/80 font-medium truncate">
            {data.mosque.address}
          </p>
        </div>
      </div>

      {/* Tanggal & Jam */}
      <div className="flex items-center gap-6">
        {/* Cloud Connection Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
            supabaseService.isConfigured()
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
          title={supabaseService.isConfigured() ? 'Cloud Sync Aktif (Tersambung ke Supabase)' : 'Cloud Standby (Lokal)'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseService.isConfigured() ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="hidden md:inline">{supabaseService.isConfigured() ? 'Cloud Online' : 'Lokal'}</span>
        </div>

        {/* Audio status indicator / unlock button */}
        {!isAudioUnlocked ? (
          <button
            onClick={unlockAudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold animate-pulse hover:bg-amber-500/30 transition-all cursor-pointer"
            title="Klik untuk aktifkan audio speaker"
          >
            <VolumeX className="w-4 h-4" />
            <span>Aktifkan Audio</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Audio Standby</span>
          </div>
        )}

        {/* Tanggal Masehi & Hijriah */}
        <div className="text-right hidden sm:block">
          <div className="text-sm lg:text-base font-semibold text-slate-200">
            {formatMasehiDate(currentTime)}
          </div>
          <div className="text-xs lg:text-sm font-bold text-amber-400 tracking-wider">
            {hijri.formatted}
          </div>
        </div>

        {/* Jam Digital Real-time */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 border border-emerald-500/40 px-5 py-2 rounded-2xl shadow-inner flex items-center">
          <span className="font-mono text-3xl lg:text-4xl font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
            {formatTimeHMS(currentTime)}
          </span>
          <span className="ml-2 text-xs font-bold text-emerald-300/70 tracking-tighter uppercase">
            WIB
          </span>
        </div>
      </div>
    </header>
  );
};
