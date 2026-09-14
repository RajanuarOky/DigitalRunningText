import React from 'react';
import { useMosque } from '../../context/MosqueContext';
import { ClockHeader } from './ClockHeader';
import { PrayerCardBar } from './PrayerCardBar';
import { MediaSlider } from './MediaSlider';
import { RunningTicker } from './RunningTicker';
import { TartilOverlay } from './TartilOverlay';
import { AdzanScreen } from './AdzanScreen';
import { IqomahCountdown } from './IqomahCountdown';
import { PrayerModeScreen } from './PrayerModeScreen';
import { Settings, Maximize, VolumeX } from 'lucide-react';

interface TvDisplayProps {
  onNavigateToAdmin: () => void;
}

export const TvDisplay: React.FC<TvDisplayProps> = ({ onNavigateToAdmin }) => {
  const { displayState, isAudioUnlocked, unlockAudio } = useMosque();

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error attempting to enable full-screen mode:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      onClick={() => {
        if (!isAudioUnlocked) unlockAudio();
      }}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between select-none"
    >
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Floating Control Toolbar (hover to reveal or discreet on TV) */}
      <div className="absolute top-3 right-3 z-40 opacity-20 hover:opacity-100 transition-opacity flex items-center gap-2">
        {!isAudioUnlocked && (
          <button
            onClick={unlockAudio}
            className="p-2 rounded-xl bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:bg-amber-500/50 transition cursor-pointer"
            title="Aktifkan Audio STB"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={toggleFullScreen}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
          title="Mode Layar Penuh"
        >
          <Maximize className="w-5 h-5" />
        </button>
        <button
          onClick={onNavigateToAdmin}
          className="p-2 rounded-xl bg-emerald-600/80 text-white border border-emerald-500 hover:bg-emerald-500 transition cursor-pointer"
          title="Buka Pengaturan Admin"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Header Jam Digital & Profil Masjid */}
      <ClockHeader />

      {/* 2. Tartil Overlay (Aktif jika sedang murottal pra-adzan) */}
      {displayState === 'TARTIL' && <TartilOverlay />}

      {/* 3. Slider Media / Konten Tengah */}
      <main className="flex-1 flex flex-col justify-center min-h-0 relative z-10">
        <MediaSlider />
      </main>

      {/* 4. Bar Jadwal Sholat 6 Waktu */}
      <div className="relative z-10">
        <PrayerCardBar />
      </div>

      {/* 5. Running Text / Warta Masjid */}
      <RunningTicker />

      {/* 6. Fullscreen Overlays for specific States */}
      {displayState === 'ADZAN' && <AdzanScreen />}
      {displayState === 'IQOMAH' && <IqomahCountdown />}
      {displayState === 'PRAYER' && <PrayerModeScreen />}
    </div>
  );
};
