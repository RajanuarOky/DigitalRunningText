import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { formatTimeHM, formatSecondsToCountdown } from '../../utils/formatters';
import type { PrayerName } from '../../types';
import { Clock, Sun, Sunset, Sunrise, Moon, CloudSun } from 'lucide-react';

const PRAYER_ICONS: Record<PrayerName, React.ReactNode> = {
  fajr: <Sunrise className="w-6 h-6 text-indigo-400" />,
  sunrise: <Sun className="w-6 h-6 text-amber-300" />,
  dhuhr: <Sun className="w-6 h-6 text-yellow-400" />,
  asr: <CloudSun className="w-6 h-6 text-amber-400" />,
  maghrib: <Sunset className="w-6 h-6 text-orange-400" />,
  isha: <Moon className="w-6 h-6 text-blue-400" />,
};

export const PrayerCardBar: React.FC = () => {
  const { prayers, displayState, activePrayerTarget } = useMosque();
  const nextPrayerName = prayers.nextPrayer.name;

  const prayerList: { key: PrayerName; label: string; time: Date }[] = [
    { key: 'fajr', label: 'Subuh', time: prayers.fajr },
    { key: 'sunrise', label: 'Terbit', time: prayers.sunrise },
    { key: 'dhuhr', label: 'Dzuhur', time: prayers.dhuhr },
    { key: 'asr', label: 'Ashar', time: prayers.asr },
    { key: 'maghrib', label: 'Maghrib', time: prayers.maghrib },
    { key: 'isha', label: 'Isya', time: prayers.isha },
  ];

  return (
    <div className="w-full px-4 lg:px-6 py-2">
      <div className="grid grid-cols-6 gap-2 lg:gap-3">
        {prayerList.map(({ key, label, time }) => {
          const isTargeted = activePrayerTarget === key;
          const isAdzanNow = isTargeted && displayState === 'ADZAN';
          const isTartilNow = isTargeted && displayState === 'TARTIL';
          const isIqomahNow = isTargeted && displayState === 'IQOMAH';
          const isNext = key === nextPrayerName && displayState === 'NORMAL';

          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-xl lg:rounded-2xl transition-all duration-300 flex flex-col items-center justify-between py-2 lg:py-2.5 px-1.5 lg:px-2 border ${
                isAdzanNow
                  ? 'bg-gradient-to-b from-amber-900/95 via-yellow-900/90 to-slate-900/95 border-amber-400 shadow-2xl shadow-amber-500/40 z-20 animate-subtle-pulse ring-2 ring-amber-400'
                  : isTartilNow
                  ? 'bg-gradient-to-b from-teal-900/90 via-emerald-800/80 to-slate-900/95 border-teal-400 shadow-xl shadow-teal-500/30 z-10 ring-1 ring-teal-400'
                  : isIqomahNow
                  ? 'bg-gradient-to-b from-indigo-900/90 via-blue-900/80 to-slate-900/95 border-indigo-400 shadow-xl shadow-indigo-500/30 z-10 ring-1 ring-indigo-400'
                  : isNext
                  ? 'bg-gradient-to-b from-emerald-900/90 via-emerald-800/80 to-slate-900/95 border-emerald-400 shadow-xl shadow-emerald-500/20 z-10 ring-1 ring-emerald-400'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Highlight Badge */}
              {isAdzanNow && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 to-yellow-300 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-950 animate-pulse">
                    ✦ WAKTU ADZAN ✦
                  </div>
                </div>
              )}

              {isTartilNow && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-teal-400 to-emerald-300 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-950">
                    Murottal Tartil
                  </div>
                </div>
              )}

              {isIqomahNow && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-indigo-400 to-blue-300 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-950">
                    Jeda Iqomah
                  </div>
                </div>
              )}

              {isNext && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-500 to-teal-400 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-950 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-slate-950" />
                    <span>-{formatSecondsToCountdown(prayers.timeRemainingSeconds)}</span>
                  </div>
                </div>
              )}

              <div className={`flex items-center justify-center mt-2 mb-1 ${isNext || isAdzanNow || isTartilNow || isIqomahNow ? 'mt-3' : ''}`}>
                {PRAYER_ICONS[key]}
              </div>

              <span
                className={`text-sm lg:text-base font-bold uppercase tracking-wider ${
                  isAdzanNow ? 'text-amber-200' : isNext ? 'text-white' : 'text-slate-300'
                }`}
              >
                {label}
              </span>

              <span
                className={`font-mono text-2xl lg:text-3xl font-black mt-1 ${
                  isAdzanNow
                    ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : isNext
                    ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'text-white'
                }`}
              >
                {formatTimeHM(time)}
              </span>

              {isNext && (
                <div className="mt-1 text-[10px] font-semibold text-emerald-200/90 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Waktu Berikutnya
                </div>
              )}
              {isAdzanNow && (
                <div className="mt-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full">
                  Sedang Masuk
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
