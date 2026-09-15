import React, { useRef, useEffect } from 'react';
import { useMosque } from '../../context/MosqueContext';
import { formatSecondsToCountdown } from '../../utils/formatters';
import { PRAYER_LABELS } from '../../services/prayerTimes';
import { Disc3, Clock, Play } from 'lucide-react';
import { audioService } from '../../services/audioService';

export const TartilOverlay: React.FC = () => {
  const { data, activePrayerTarget, stateCountdownSeconds, isAudioUnlocked, unlockAudio } = useMosque();
  const prayerKey = (activePrayerTarget || 'maghrib') as keyof typeof data.tartil.prayers;
  const prayerLabel = activePrayerTarget ? PRAYER_LABELS[activePrayerTarget] : 'Sholat';
  const tartilCfg = data.tartil.prayers[prayerKey];
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Backup DOM HTML5 Audio tag untuk menjamin kompatibilitas WebView STB
  useEffect(() => {
    if (tartilCfg && tartilCfg.audioUrl) {
      // Pastikan audio service memutar
      audioService.playTartil(tartilCfg.audioUrl, data.tartil.volume);

      // Coba juga putar via DOM ref jika Audio() JS terhalang
      if (audioElRef.current) {
        audioElRef.current.volume = Math.max(0, Math.min(1, data.tartil.volume));
        audioElRef.current.play().catch((err) => {
          console.warn('DOM Audio play attempt failed (waiting for user interaction):', err);
        });
      }
    }
  }, [tartilCfg, data.tartil.volume]);

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    unlockAudio();
    if (tartilCfg?.audioUrl) {
      audioService.playTartil(tartilCfg.audioUrl, data.tartil.volume);
    }
    if (audioElRef.current) {
      audioElRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="absolute top-20 left-6 right-6 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Hidden Fallback Audio Element */}
      {tartilCfg?.audioUrl && (
        <audio
          ref={audioElRef}
          src={tartilCfg.audioUrl}
          preload="auto"
          crossOrigin="anonymous"
          onEnded={() => {}}
        />
      )}

      <div className="bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 border border-emerald-400/60 rounded-2xl p-4 shadow-2xl flex items-center justify-between backdrop-blur-xl">
        {/* Tartil Info & Spinning Disc */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleManualPlay}
            className="w-12 h-12 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 flex items-center justify-center group cursor-pointer transition"
            title="Klik untuk membunyikan suara murottal"
          >
            <Disc3 className="w-7 h-7 text-emerald-300 animate-spin" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span>Murottal Pra-Adzan {prayerLabel}</span>
              {!isAudioUnlocked && (
                <span className="text-[10px] text-amber-300 animate-pulse font-normal">
                  (Klik untuk aktifkan suara)
                </span>
              )}
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white mt-1 flex items-center gap-2">
              <span>{tartilCfg?.audioTitle || 'Tilawah Al-Qur\'an'}</span>
              <button
                type="button"
                onClick={handleManualPlay}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Bunyikan</span>
              </button>
            </h3>
          </div>
        </div>

        {/* Waveform Bar Animation */}
        <div className="hidden md:flex items-center gap-1.5 h-8 px-4">
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

        {/* Countdown to Adzan */}
        <div className="bg-slate-900/90 border border-emerald-500/40 px-4 py-2 rounded-xl text-right">
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
