import React, { useState } from 'react';
import { useMosque } from '../../context/MosqueContext';
import type { TartilConfig, IqomahConfig, PrayerDisplayModeConfig } from '../../types';
import { audioService } from '../../services/audioService';
import { Disc, Play, Square, Save, CheckCircle2, Clock, Volume2, Moon } from 'lucide-react';

const AUDIO_PRESETS = [
  {
    label: 'QS. As-Sajdah - Mishary Rashid',
    url: 'https://server8.mp3quran.net/afs/032.mp3',
  },
  {
    label: 'QS. Yasin - Mishary Rashid',
    url: 'https://server8.mp3quran.net/afs/036.mp3',
  },
  {
    label: 'QS. Ar-Rahman - Mishary Rashid',
    url: 'https://server8.mp3quran.net/afs/055.mp3',
  },
  {
    label: 'QS. Al-Waqi\'ah - Mishary Rashid',
    url: 'https://server8.mp3quran.net/afs/056.mp3',
  },
  {
    label: 'QS. Al-Mulk - Mishary Rashid',
    url: 'https://server8.mp3quran.net/afs/067.mp3',
  },
  {
    label: 'QS. Al-Insan - Mishary Rashid',
    url: 'https://server8.mp3quran.net/afs/076.mp3',
  },
];

export const TartilSettings: React.FC = () => {
  const { data, updateData } = useMosque();
  const [tartilForm, setTartilForm] = useState<TartilConfig>(data.tartil);
  const [iqomahForm, setIqomahForm] = useState<IqomahConfig>(data.iqomah);
  const [prayerModeForm, setPrayerModeForm] = useState<PrayerDisplayModeConfig>(data.prayerMode);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);

  const prayerKeys: ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[] = [
    'fajr',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
  ];

  const prayerLabelMap: Record<string, string> = {
    fajr: 'Subuh',
    dhuhr: 'Dzuhur',
    asr: 'Ashar',
    maghrib: 'Maghrib',
    isha: 'Isya',
  };

  const handleTartilPrayerChange = (
    prayer: keyof TartilConfig['prayers'],
    field: string,
    value: string | number | boolean
  ) => {
    setTartilForm((prev) => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayer]: {
          ...prev.prayers[prayer],
          [field]: value,
        },
      },
    }));
  };

  const handlePlayPreview = (audioUrl: string, key: string) => {
    if (isPlayingPreview === key) {
      audioService.stopTartil();
      setIsPlayingPreview(null);
    } else {
      audioService.stopTartil();
      audioService.playTartil(audioUrl, tartilForm.volume);
      setIsPlayingPreview(key);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.stopTartil();
    setIsPlayingPreview(null);
    updateData((prev) => ({
      ...prev,
      tartil: tartilForm,
      iqomah: iqomahForm,
      prayerMode: prayerModeForm,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Pengaturan Auto-Tartil, Iqomah, dan Mode Sholat berhasil disimpan!</span>
        </div>
      )}

      {/* Master Switch Tartil */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-emerald-400" />
              <span>Sistem Auto-Tartil Murottal Pra-Adzan</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Otomatis memutar murottal audio sebelum waktu adzan tiba ke speaker/amplifier masjid.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={tartilForm.masterEnabled}
              onChange={(e) =>
                setTartilForm((prev) => ({ ...prev, masterEnabled: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Volume Master */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-4">
          <Volume2 className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Volume Audio:
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={tartilForm.volume}
            onChange={(e) =>
              setTartilForm((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))
            }
            className="flex-1 accent-emerald-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-emerald-400 w-12 text-right">
            {Math.round(tartilForm.volume * 100)}%
          </span>
        </div>
      </div>

      {/* Pengaturan Tartil per Waktu Sholat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Jadwal Pemutaran Murottal per Sholat
        </h3>

        <div className="space-y-4">
          {prayerKeys.map((pKey) => {
            const pCfg = tartilForm.prayers[pKey];

            return (
              <div
                key={pKey}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={pCfg.enabled}
                    onChange={(e) =>
                      handleTartilPrayerChange(pKey, 'enabled', e.target.checked)
                    }
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-bold text-white text-base">
                    {prayerLabelMap[pKey]}
                  </span>
                </div>

                {/* Menit Sebelum Adzan */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Putar</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={pCfg.minutesBefore}
                    onChange={(e) =>
                      handleTartilPrayerChange(
                        pKey,
                        'minutesBefore',
                        parseInt(e.target.value, 10) || 5
                      )
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-emerald-400 font-bold font-mono text-sm"
                  />
                  <span className="text-xs text-slate-400">menit sblm adzan</span>
                </div>

                {/* Judul & Audio URL */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={pCfg.audioTitle}
                    onChange={(e) =>
                      handleTartilPrayerChange(pKey, 'audioTitle', e.target.value)
                    }
                    placeholder="Judul Surat / Qari"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={pCfg.audioUrl}
                    onChange={(e) =>
                      handleTartilPrayerChange(pKey, 'audioUrl', e.target.value)
                    }
                    placeholder="URL Audio MP3 (Online / Lokal STB)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Preset Dropdown & Test Play */}
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selected = AUDIO_PRESETS.find((pr) => pr.url === e.target.value);
                      if (selected) {
                        handleTartilPrayerChange(pKey, 'audioTitle', selected.label);
                        handleTartilPrayerChange(pKey, 'audioUrl', selected.url);
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300"
                  >
                    <option value="" disabled>
                      Pilih Preset Surat...
                    </option>
                    {AUDIO_PRESETS.map((pr) => (
                      <option key={pr.url} value={pr.url}>
                        {pr.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handlePlayPreview(pCfg.audioUrl, pKey)}
                    className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isPlayingPreview === pKey
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                    title="Tes Suara Audio Murottal"
                  >
                    {isPlayingPreview === pKey ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Durasi Hitung Mundur Iqomah */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Pengaturan Jeda Iqomah (Menit)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Hitung mundur jeda waktu antara selesai adzan sampai iqomah dikumandangkan.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {prayerKeys.map((pk) => (
            <div key={pk} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-slate-300 block mb-1">
                {prayerLabelMap[pk]}
              </span>
              <input
                type="number"
                min="1"
                max="30"
                value={iqomahForm.durations[pk]}
                onChange={(e) =>
                  setIqomahForm((prev) => ({
                    ...prev,
                    durations: {
                      ...prev.durations,
                      [pk]: parseInt(e.target.value, 10) || 5,
                    },
                  }))
                }
                className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1.5 text-amber-400 font-mono font-bold text-sm"
              />
              <span className="text-[10px] text-slate-500 block mt-1">menit</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mode Sholat (Layar Redup / Shaf) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-indigo-400" />
          <span>Mode Layar Saat Sholat Berjamaah Berlangsung</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Durasi Layar Redup (Menit)
            </label>
            <input
              type="number"
              min="3"
              max="60"
              value={prayerModeForm.durationMinutes}
              onChange={(e) =>
                setPrayerModeForm((prev) => ({
                  ...prev,
                  durationMinutes: parseInt(e.target.value, 10) || 12,
                }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pesan Layar Utama
            </label>
            <input
              type="text"
              value={prayerModeForm.message}
              onChange={(e) =>
                setPrayerModeForm((prev) => ({ ...prev, message: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Pengaturan Tartil & Audio</span>
        </button>
      </div>
    </form>
  );
};
