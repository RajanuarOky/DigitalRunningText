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
    <div className="w-full px-6 py-2.5 mb-1 select-none">
      <div className="grid grid-cols-6 gap-3">
        {prayerList.map(({ key, label, time }) => {
          const isTargeted = activePrayerTarget === key;
          const isAdzanNow = isTargeted && displayState === 'ADZAN';
          const isTartilNow = isTargeted && displayState === 'TARTIL';
          const isIqomahNow = isTargeted && displayState === 'IQOMAH';
          const isNext = key === nextPrayerName && displayState === 'NORMAL';

          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col items-center justify-between py-3 px-2 min-h-[110px] border ${
                isAdzanNow
                  ? 'bg-gradient-to-b from-amber-900 via-amber-950 to-slate-900 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 ring-2 ring-amber-400/50 scale-[1.02] z-20 animate-subtle-pulse'
                  : isTartilNow
                  ? 'bg-gradient-to-b from-teal-900/90 via-emerald-950 to-slate-900 border-2 border-teal-400 shadow-xl shadow-teal-500/20 ring-1 ring-teal-400/40'
                  : isIqomahNow
                  ? 'bg-gradient-to-b from-indigo-900/90 via-blue-950 to-slate-900 border-2 border-indigo-400 shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-400/40'
                  : isNext
                  ? 'bg-gradient-to-b from-emerald-950 via-emerald-900/80 to-slate-900 border-2 border-emerald-400 shadow-xl shadow-emerald-900/50 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/90 border border-slate-800/80 shadow-md hover:border-slate-700'
              }`}
            >
              {/* Highlight Badge */}
              {isAdzanNow && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 to-yellow-300 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                    ✦ WAKTU ADZAN ✦
                  </div>
                </div>
              )}

              {isTartilNow && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-teal-400 to-emerald-300 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                    Murottal Tartil
                  </div>
                </div>
              )}

              {isIqomahNow && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-indigo-400 to-blue-300 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                    Jeda Iqomah
                  </div>
                </div>
              )}

              {isNext && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-500 to-teal-400 py-0.5 text-center shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-950 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-slate-950" />
                    <span>-{formatSecondsToCountdown(prayers.timeRemainingSeconds)}</span>
                  </div>
                </div>
              )}

              <div className={`flex items-center justify-center ${isNext || isAdzanNow || isTartilNow || isIqomahNow ? 'mt-3.5' : 'mt-1'}`}>
                {PRAYER_ICONS[key]}
              </div>

              <span
                className={`text-xs lg:text-sm font-black uppercase tracking-wider mt-1 ${
                  isAdzanNow ? 'text-amber-200' : isNext ? 'text-emerald-200' : 'text-slate-400'
                }`}
              >
                {label}
              </span>

              <span
                className={`font-mono text-2xl lg:text-3xl font-black mt-0.5 tracking-tight ${
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
                <div className="mt-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  Berikutnya
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
