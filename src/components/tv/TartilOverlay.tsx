import React, { useState, useEffect } from 'react';
import { useMosque } from '../../context/MosqueContext';
import { formatSecondsToCountdown } from '../../utils/formatters';
import { PRAYER_LABELS } from '../../services/prayerTimes';
import { Disc3, Clock, Play, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { audioService, type TartilAudioStatus } from '../../services/audioService';

export const TartilOverlay: React.FC = () => {
  const { data, activePrayerTarget, stateCountdownSeconds, isAudioUnlocked, unlockAudio } = useMosque();
  const prayerKey = (activePrayerTarget || 'maghrib') as keyof typeof data.tartil.prayers;
  const prayerLabel = activePrayerTarget ? PRAYER_LABELS[activePrayerTarget] : 'Sholat';
  const tartilCfg = data.tartil.prayers[prayerKey];

  const [audioStatus, setAudioStatus] = useState<TartilAudioStatus>(audioService.getTartilStatus());

  useEffect(() => {
    const unsubscribe = audioService.subscribeTartilStatus((status) => {
      setAudioStatus(status);
    });
    return unsubscribe;
  }, []);

  // Pastikan audio service mulai memutar jika belum berjalan
  useEffect(() => {
    if (tartilCfg && tartilCfg.audioUrl) {
      audioService.playTartil(tartilCfg.audioUrl, data.tartil.volume);
    }
  }, [tartilCfg, data.tartil.volume]);

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    unlockAudio();
    if (tartilCfg?.audioUrl) {
      audioService.playTartil(tartilCfg.audioUrl, data.tartil.volume);
    }
  };

  const isBlocked = audioStatus === 'blocked' || (!isAudioUnlocked && audioStatus !== 'playing');
  const isLoading = audioStatus === 'loading';
  const isPlaying = audioStatus === 'playing';
  const isError = audioStatus === 'error';

  return (
    <div className="absolute top-20 left-6 right-6 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 border border-emerald-400/60 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl">
        {/* Tartil Info & Spinning Disc */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleManualPlay}
            className={`w-14 h-14 rounded-full border flex items-center justify-center group cursor-pointer transition shrink-0 ${
              isBlocked
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-bounce'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-300'
            }`}
            title="Klik untuk membunyikan suara murottal"
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin text-emerald-300" />
            ) : isBlocked ? (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            ) : (
              <Disc3 className={`w-8 h-8 ${isPlaying ? 'animate-spin' : ''}`} />
            )}
          </button>

          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span>Murottal Pra-Adzan {prayerLabel}</span>
              {isPlaying && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold lowercase">
                  <Volume2 className="w-3 h-3" /> aktif
                </span>
              )}
            </div>

            <h3 className="text-lg lg:text-xl font-bold text-white mt-1 flex flex-wrap items-center gap-2">
              <span>{tartilCfg?.audioTitle || 'Tilawah Al-Qur\'an'}</span>

              {/* Tombol Bunyikan jika suara terblokir browser / STB */}
              {isBlocked && (
                <button
                  type="button"
                  onClick={handleManualPlay}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md cursor-pointer animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>KLIK AKTIFKAN SUARA</span>
                </button>
              )}

              {isError && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <AlertCircle className="w-3 h-3" /> Gagal memuat audio
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Waveform Bar Animation */}
        {isPlaying && (
          <div className="hidden lg:flex items-center gap-1.5 h-8 px-4">
            {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 70].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i % 5) * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Countdown to Adzan */}
        <div className="bg-slate-900/90 border border-emerald-500/40 px-4 py-2 rounded-xl text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" /> Menuju Adzan
          </span>
          <span className="font-mono text-2xl font-black text-amber-300">
            {formatSecondsToCountdown(stateCountdownSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
