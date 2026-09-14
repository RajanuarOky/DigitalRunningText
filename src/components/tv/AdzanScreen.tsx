import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { PRAYER_LABELS } from '../../services/prayerTimes';
import { formatSecondsToCountdown } from '../../utils/formatters';
import { Volume2, Sparkles, Moon } from 'lucide-react';

export const AdzanScreen: React.FC = () => {
  const { activePrayerTarget, stateCountdownSeconds } = useMosque();
  const prayerLabel = activePrayerTarget ? PRAYER_LABELS[activePrayerTarget] : 'Sholat';

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      {/* Decorative Islamic Background Elements */}
      <div className="absolute inset-0 bg-radial from-emerald-900/30 via-slate-950 to-slate-950 opacity-80" />

      <div className="relative z-10 flex flex-col items-center max-w-4xl">
        {/* Animated Icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-400 p-1 mb-8 animate-subtle-pulse shadow-2xl shadow-emerald-500/40">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
            <Volume2 className="w-12 h-12 text-emerald-300 animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-widest text-sm mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Waktu Adzan Telah Tiba</span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-wide uppercase font-serif mb-6 drop-shadow-[0_0_25px_rgba(52,211,153,0.4)]">
          ADZAN {prayerLabel}
        </h1>

        <p className="text-xl lg:text-2xl text-emerald-200 font-medium max-w-2xl leading-relaxed mb-8">
          Mari mendengarkan dan menjawab adzan, mengambil wudhu, serta bersiap melaksanakan sholat berjamaah.
        </p>

        {/* Countdown to Iqomah screen */}
        <div className="bg-slate-900/80 border border-emerald-500/40 px-6 py-3 rounded-2xl flex items-center gap-3">
          <Moon className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-slate-300">
            Jeda Iqomah akan dimulai dalam
          </span>
          <span className="font-mono text-xl font-bold text-amber-400">
            {formatSecondsToCountdown(stateCountdownSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
