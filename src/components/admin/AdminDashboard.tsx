import React, { useState } from 'react';
import { useMosque } from '../../context/MosqueContext';
import { MosqueSettings } from './MosqueSettings';
import { TartilSettings } from './TartilSettings';
import { RunningTextManager } from './RunningTextManager';
import { MediaBannerManager } from './MediaBannerManager';
import { RemoteSimulator } from './RemoteSimulator';
import { CloudSyncSettings } from './CloudSyncSettings';
import {
  Building,
  Disc,
  Megaphone,
  ImageIcon,
  PlayCircle,
  Tv,
  RotateCcw,
  Volume2,
  Cloud,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToTv: () => void;
}

type TabType = 'mosque' | 'tartil' | 'runningText' | 'media' | 'simulator' | 'cloud';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToTv }) => {
  const { data, resetData, unlockAudio, isAudioUnlocked } = useMosque();
  const [activeTab, setActiveTab] = useState<TabType>('simulator');

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'simulator', label: 'Remote & Simulasi', icon: <PlayCircle className="w-4 h-4" /> },
    { key: 'cloud', label: 'Cloud Sync (HP ↔ TV)', icon: <Cloud className="w-4 h-4 text-cyan-400" /> },
    { key: 'tartil', label: 'Tartil & Audio', icon: <Disc className="w-4 h-4" /> },
    { key: 'runningText', label: 'Running Text', icon: <Megaphone className="w-4 h-4" /> },
    { key: 'media', label: 'Banner & Kas', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'mosque', label: 'Profil & Jadwal', icon: <Building className="w-4 h-4" /> },
  ];

  const handleResetConfirm = () => {
    if (window.confirm('Kembalikan seluruh pengaturan ke data default bawaan sistem?')) {
      resetData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
            RT
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-wider">
              {data.mosque.name}
            </h1>
            <p className="text-xs text-emerald-400 font-medium">
              Panel Pengurus DKM • Kontrol Signage TV & Auto-Tartil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAudioUnlocked && (
            <button
              onClick={unlockAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Aktifkan Audio</span>
            </button>
          )}

          <button
            onClick={handleResetConfirm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
            title="Reset ke Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          <button
            onClick={onNavigateToTv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>Lihat Tampilan TV</span>
          </button>
        </div>
      </header>

      {/* Main Content & Tab Navigation */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition shrink-0 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'simulator' && <RemoteSimulator onOpenTv={onNavigateToTv} />}
          {activeTab === 'cloud' && <CloudSyncSettings />}
          {activeTab === 'tartil' && <TartilSettings />}
          {activeTab === 'runningText' && <RunningTextManager />}
          {activeTab === 'media' && <MediaBannerManager />}
          {activeTab === 'mosque' && <MosqueSettings />}
        </div>
      </div>
    </div>
  );
};
