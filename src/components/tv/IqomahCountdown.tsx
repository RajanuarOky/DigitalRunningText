import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { PRAYER_LABELS } from '../../services/prayerTimes';
import { formatSecondsToCountdown } from '../../utils/formatters';
import { Clock, Bell, Sparkles } from 'lucide-react';

export const IqomahCountdown: React.FC = () => {
  const { activePrayerTarget, stateCountdownSeconds, data } = useMosque();
  const prayerLabel = activePrayerTarget ? PRAYER_LABELS[activePrayerTarget] : 'Sholat';
  const isUrgent = stateCountdownSeconds <= data.iqomah.beepLastSeconds;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      {/* Background ambient lighting */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          isUrgent
            ? 'bg-radial from-rose-950/50 via-slate-950 to-slate-950'
            : 'bg-radial from-amber-950/40 via-slate-950 to-slate-950'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center max-w-4xl">
        <div
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-black uppercase tracking-widest mb-6 ${
            isUrgent
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          {isUrgent ? <Bell className="w-5 h-5 animate-bounce" /> : <Clock className="w-5 h-5" />}
          <span>Hitung Mundur Menuju Iqomah</span>
        </div>

        <h2 className="text-3xl lg:text-5xl font-black text-white uppercase font-serif mb-6">
          SHOLAT {prayerLabel}
        </h2>

        {/* Big Countdown Clock */}
        <div
          className={`font-mono text-7xl sm:text-8xl lg:text-9xl font-black tracking-widest px-10 py-6 rounded-3xl border shadow-2xl transition-all duration-300 ${
            isUrgent
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-slate-900/90 border-amber-400/60 text-amber-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.4)]'
          }`}
        >
          {formatSecondsToCountdown(stateCountdownSeconds)}
        </div>

        <p className="mt-8 text-base lg:text-xl text-slate-300 max-w-xl font-medium leading-relaxed">
          {isUrgent ? (
            <span className="text-rose-300 font-bold text-xl lg:text-2xl animate-pulse">
              Iqomah sesaat lagi! Bersiap merapatkan dan meluruskan barisan shaf.
            </span>
          ) : (
            'Manfaatkan waktu antara adzan dan iqomah untuk sholat sunnah dan memperbanyak doa.'
          )}
        </p>

        {!isUrgent && (
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
            <span>Doa di antara adzan dan iqomah tidak tertolak (HR. Abu Dawud)</span>
          </div>
        )}
      </div>
    </div>
  );
};
