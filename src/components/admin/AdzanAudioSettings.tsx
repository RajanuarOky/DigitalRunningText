import React, { useState, useEffect } from 'react';
import { useMosque } from '../../context/MosqueContext';
import type { AdzanConfig } from '../../types';
import { audioService } from '../../services/audioService';
import { supabaseService } from '../../services/supabaseService';
import { DEFAULT_DATA } from '../../services/storageService';
import { Volume2, Play, Square, Save, CheckCircle2, Bell, Radio, Sparkles, UploadCloud, Loader2, AlertCircle } from 'lucide-react';

const ADZAN_PRESETS = {
  fajr: [
    {
      title: 'Adzan Subuh - Misyari Rasyid (Madinah)',
      url: 'https://raw.githubusercontent.com/AalianKhan/adhans/master/adhan_fajr.mp3',
      durationSeconds: 195,
    },
    {
      title: 'Adzan Subuh - Ali Ahmed Mulla (Makkah)',
      url: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
      durationSeconds: 210,
    },
  ],
  regular: [
    {
      title: 'Adzan Reguler - Makkah Al-Mukarramah',
      url: 'https://raw.githubusercontent.com/AalianKhan/adhans/master/adhan.mp3',
      durationSeconds: 180,
    },
    {
      title: 'Adzan Reguler - Madinah Al-Munawwarah',
      url: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
      durationSeconds: 185,
    },
    {
      title: 'Adzan Reguler - Masjid Al-Aqsha',
      url: 'https://www.islamcan.com/audio/adhan/azan7.mp3',
      durationSeconds: 190,
    },
  ],
};

export const AdzanAudioSettings: React.FC = () => {
  const { data, updateData } = useMosque();
  const [adzanForm, setAdzanForm] = useState<AdzanConfig>(() => ({
    ...DEFAULT_DATA.adzan,
    ...(data?.adzan || {}),
    prayers: {
      ...DEFAULT_DATA.adzan.prayers,
      ...(data?.adzan?.prayers || {}),
    },
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [playingPrayer, setPlayingPrayer] = useState<string | null>(null);
  const [uploadingPrayer, setUploadingPrayer] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.adzan) {
      setAdzanForm({
        ...DEFAULT_DATA.adzan,
        ...data.adzan,
        prayers: {
          ...DEFAULT_DATA.adzan.prayers,
          ...(data.adzan.prayers || {}),
        },
      });
    }
  }, [data?.adzan]);

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

  const handlePrayerChange = (
    prayer: keyof AdzanConfig['prayers'],
    field: string,
    value: string | number | boolean
  ) => {
    setAdzanForm((prev) => {
      const base = prev || DEFAULT_DATA.adzan;
      const basePrayers = base.prayers || DEFAULT_DATA.adzan.prayers;
      return {
        ...base,
        prayers: {
          ...basePrayers,
          [prayer]: {
            ...(basePrayers[prayer] || DEFAULT_DATA.adzan.prayers[prayer]),
            [field]: value,
          },
        },
      };
    });
  };

  const handleSelectPreset = (
    prayer: keyof AdzanConfig['prayers'],
    preset: { title: string; url: string; durationSeconds: number }
  ) => {
    setAdzanForm((prev) => {
      const base = prev || DEFAULT_DATA.adzan;
      const basePrayers = base.prayers || DEFAULT_DATA.adzan.prayers;
      return {
        ...base,
        prayers: {
          ...basePrayers,
          [prayer]: {
            ...(basePrayers[prayer] || DEFAULT_DATA.adzan.prayers[prayer]),
            audioTitle: preset.title,
            audioUrl: preset.url,
            durationSeconds: preset.durationSeconds,
          },
        },
      };
    });
  };

  const handleFileUpload = async (
    prayerKey: keyof AdzanConfig['prayers'],
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp3') && !file.type.includes('audio')) {
      alert('Mohon pilih file berekstensi .mp3 atau format audio.');
      return;
    }

    setUploadingPrayer(prayerKey);
    setUploadError(null);

    const res = await supabaseService.uploadAudioFile(file, 'adzan');
    setUploadingPrayer(null);

    if (res.success && res.url) {
      handlePrayerChange(prayerKey, 'audioUrl', res.url);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
      handlePrayerChange(prayerKey, 'audioTitle', cleanTitle);
    } else {
      setUploadError(res.error || 'Gagal mengunggah file rekaman adzan.');
      setTimeout(() => setUploadError(null), 8000);
    }

    e.target.value = '';
  };

  const handlePlayPreview = (audioUrl: string, prayerKey: string) => {
    if (playingPrayer === prayerKey) {
      audioService.stopAdzan();
      setPlayingPrayer(null);
    } else {
      audioService.stopAdzan();
      audioService.playAdzan(audioUrl, adzanForm?.volume ?? 0.9);
      setPlayingPrayer(prayerKey);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.stopAdzan();
    setPlayingPrayer(null);
    const formToSave = adzanForm || DEFAULT_DATA.adzan;
    updateData((prev) => ({
      ...prev,
      adzan: formToSave,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Pengaturan Suara Audio Adzan berhasil disimpan & disinkronisasikan!</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white mb-1">
            Fitur Suara Adzan Otomatis (Per Waktu Sholat)
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Didesain khusus untuk masjid di pelosok atau kondisi darurat di mana tidak ada muadzin yang hadir (misalnya saat <strong>Adzan Subuh</strong>).
            Anda dapat menyalakan pemutaran audio adzan otomatis hanya pada waktu yang diinginkan (misal Subuh saja), dan mematikan waktu lainnya agar muadzin asli masjid tetap mengumandangkan adzan secara langsung tanpa tertimpa audio.
          </p>
        </div>
      </div>

      {/* Master Toggle & Volume */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>Sistem Audio Adzan Otomatis</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Saklar utama untuk mengaktifkan pemutaran rekaman MP3 adzan pada waktu sholat yang dipilih.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={adzanForm?.masterEnabled ?? true}
              onChange={(e) => setAdzanForm((prev) => ({ ...(prev || DEFAULT_DATA.adzan), masterEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {adzanForm?.masterEnabled && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Volume Audio Adzan</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.round((adzanForm?.volume ?? 0.9) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={adzanForm?.volume ?? 0.9}
                onChange={(e) => setAdzanForm((prev) => ({ ...(prev || DEFAULT_DATA.adzan), volume: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Bunyikan Chime Pembuka</span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bunyi nada ding-dong sebelum rekaman adzan berbunyi
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={adzanForm?.playChimeBefore !== false}
                  onChange={(e) => setAdzanForm((prev) => ({ ...(prev || DEFAULT_DATA.adzan), playChimeBefore: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Per-Prayer Configuration Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-400" />
          <span>Pengaturan Per Waktu Sholat</span>
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {prayerKeys.map((key) => {
            const prayerCfg = adzanForm?.prayers?.[key] || DEFAULT_DATA.adzan.prayers[key];
            const presets = key === 'fajr' ? ADZAN_PRESETS.fajr : ADZAN_PRESETS.regular;
            const isPlaying = playingPrayer === key;

            return (
              <div
                key={key}
                className={`border rounded-2xl p-5 transition ${
                  prayerCfg.enabled
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-950/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div>
                      <h4 className="text-base font-black text-white">
                        Adzan {prayerLabelMap[key]}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {prayerCfg.enabled
                          ? 'Audio otomatis aktif saat masuk waktu sholat'
                          : 'Audio dinonaktifkan (Muadzin mengumandangkan langsung)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prayerCfg.enabled}
                        onChange={(e) => handlePrayerChange(key, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {prayerCfg.enabled && (
                  <div className="pt-4 border-t border-slate-800/80 space-y-4">
                    {/* Preset Buttons */}
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-2">
                        Pilih Preset Adzan Bawaan:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {presets.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPreset(key, p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              prayerCfg.audioUrl === p.url
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {p.title} ({Math.round(p.durationSeconds / 60)}m)
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Judul / Keterangan Suara Adzan
                        </label>
                        <input
                          type="text"
                          value={prayerCfg.audioTitle || ''}
                          onChange={(e) => handlePrayerChange(key, 'audioTitle', e.target.value)}
                          placeholder="Misal: Adzan Subuh Madinah"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Durasi Tayang Layar Adzan (Detik)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="30"
                            max="600"
                            value={prayerCfg.durationSeconds || 180}
                            onChange={(e) =>
                              handlePrayerChange(key, 'durationSeconds', parseInt(e.target.value) || 180)
                            }
                            className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                          <span className="text-xs text-slate-400">
                            ≈ {Math.floor((prayerCfg.durationSeconds || 180) / 60)} menit {(prayerCfg.durationSeconds || 180) % 60} detik
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        URL File Audio MP3 Adzan
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={prayerCfg.audioUrl || ''}
                          onChange={(e) => handlePrayerChange(key, 'audioUrl', e.target.value)}
                          placeholder="https://.../adzan.mp3"
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                        />

                        <label
                          title="Unggah file rekaman adzan MP3 dari HP/Laptop ke Cloud Supabase"
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition shrink-0 ${
                            uploadingPrayer === key
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {uploadingPrayer === key ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mengunggah...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload MP3</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="audio/mp3,audio/*,.mp3"
                            className="sr-only"
                            disabled={uploadingPrayer === key}
                            onChange={(e) => handleFileUpload(key, e)}
                          />
                        </label>

                        {prayerCfg.audioUrl && (
                          <button
                            type="button"
                            onClick={() => handlePlayPreview(prayerCfg.audioUrl, key)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                              isPlaying
                                ? 'bg-amber-600 text-white hover:bg-amber-500 animate-pulse'
                                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Tes Putar</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Pengaturan Audio Adzan</span>
        </button>
      </div>
    </form>
  );
};
