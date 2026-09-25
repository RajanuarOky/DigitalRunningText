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
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col items-center justify-between py-3 px-2 min-h-[112px] ${
                isAdzanNow ? 'scale-[1.02] z-20 animate-subtle-pulse' : isNext ? 'z-10' : ''
              }`}
              style={
                isAdzanNow
                  ? {
                      backgroundColor: '#451a03',
                      backgroundImage: 'linear-gradient(180deg, #78350f, #451a03 50%, #0f172a 100%)',
                      borderColor: '#f59e0b',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                    }
                  : isTartilNow
                  ? {
                      backgroundColor: '#042f2e',
                      backgroundImage: 'linear-gradient(180deg, #134e4a, #042f2e 50%, #0f172a 100%)',
                      borderColor: '#14b8a6',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      boxShadow: '0 0 20px rgba(20, 184, 166, 0.3)',
                    }
                  : isIqomahNow
                  ? {
                      backgroundColor: '#1e1b4b',
                      backgroundImage: 'linear-gradient(180deg, #312e81, #1e1b4b 50%, #0f172a 100%)',
                      borderColor: '#818cf8',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      boxShadow: '0 0 20px rgba(129, 140, 248, 0.3)',
                    }
                  : isNext
                  ? {
                      backgroundColor: '#022c22',
                      backgroundImage: 'linear-gradient(180deg, #064e3b, #022c22 60%, #0f172a 100%)',
                      borderColor: '#10b981',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
                    }
                  : {
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }
              }
            >
              {/* Highlight Badge */}
              {isAdzanNow && (
                <div
                  className="absolute top-0 inset-x-0 py-0.5 text-center shadow-md select-none"
                  style={{
                    backgroundColor: '#f59e0b',
                    backgroundImage: 'linear-gradient(90deg, #d97706, #f59e0b)',
                    color: '#020617',
                  }}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider animate-pulse" style={{ color: '#020617' }}>
                    ✦ WAKTU ADZAN ✦
                  </div>
                </div>
              )}

              {isTartilNow && (
                <div
                  className="absolute top-0 inset-x-0 py-0.5 text-center shadow-md select-none"
                  style={{
                    backgroundColor: '#14b8a6',
                    backgroundImage: 'linear-gradient(90deg, #0d9488, #14b8a6)',
                    color: '#020617',
                  }}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#020617' }}>
                    Murottal Tartil
                  </div>
                </div>
              )}

              {isIqomahNow && (
                <div
                  className="absolute top-0 inset-x-0 py-0.5 text-center shadow-md select-none"
                  style={{
                    backgroundColor: '#6366f1',
                    backgroundImage: 'linear-gradient(90deg, #4f46e5, #6366f1)',
                    color: '#ffffff',
                  }}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#ffffff' }}>
                    Jeda Iqomah
                  </div>
                </div>
              )}

              {isNext && (
                <div
                  className="absolute top-0 inset-x-0 py-0.5 text-center shadow-md select-none"
                  style={{
                    backgroundColor: '#10b981',
                    backgroundImage: 'linear-gradient(90deg, #059669, #10b981)',
                    color: '#020617',
                  }}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1" style={{ color: '#020617' }}>
                    <Clock className="w-3 h-3 text-slate-950 shrink-0" />
                    <span>-{formatSecondsToCountdown(prayers.timeRemainingSeconds)}</span>
                  </div>
                </div>
              )}

              <div className={`flex items-center justify-center ${isNext || isAdzanNow || isTartilNow || isIqomahNow ? 'mt-3.5' : 'mt-1'}`}>
                {PRAYER_ICONS[key]}
              </div>

              <span
                className={`text-xs lg:text-sm font-black uppercase tracking-wider mt-1 ${
                  isAdzanNow ? 'text-amber-200' : isNext ? 'text-emerald-200' : 'text-slate-300'
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
                <div
                  className="mt-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#6ee7b7',
                    border: '1px solid #10b981',
                  }}
                >
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
