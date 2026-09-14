import React, { useState } from 'react';
import { useMosque } from '../../context/MosqueContext';
import { audioService } from '../../services/audioService';
import type { PrayerName } from '../../types';
import {
  Play,
  RotateCcw,
  Volume2,
  Bell,
  Clock,
  Tv,
  Tv2,
  ExternalLink,
  Wifi,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface RemoteSimulatorProps {
  onOpenTv: () => void;
}

export const RemoteSimulator: React.FC<RemoteSimulatorProps> = ({ onOpenTv }) => {
  const {
    displayState,
    activePrayerTarget,
    stateCountdownSeconds,
    simulateTartil,
    simulateAdzan,
    simulateIqomah,
    simulatePrayerMode,
    resetToNormal,
  } = useMosque();

  const [selectedPrayer, setSelectedPrayer] = useState<PrayerName>('maghrib');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerWithToast = (fn: () => void, msg: string) => {
    fn();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Status Live TV Saat Ini */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Status Layar TV Saat Ini
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-black text-white">
                  MODE {displayState}
                </span>
                {activePrayerTarget && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
                    {activePrayerTarget}
                  </span>
                )}
                {stateCountdownSeconds > 0 && (
                  <span className="font-mono text-sm font-bold text-amber-400">
                    ({stateCountdownSeconds}s)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenTv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Tampilan TV</span>
            </button>
            <button
              type="button"
              onClick={resetToNormal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Normal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Siklus Ibadah */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-amber-400" />
              <span>Simulasi Siklus Ibadah (Kontrol Remote TV Real-time)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol di bawah untuk menguji respon tampilan TV dan audio seketika (tersinkronisasi antar-tab/layar).
            </p>
          </div>

          {/* Selector Sholat Sasaran */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map((p) => {
              const labelMap: Record<string, string> = {
                fajr: 'Subuh',
                dhuhr: 'Dzuhur',
                asr: 'Ashar',
                maghrib: 'Maghrib',
                isha: 'Isya',
              };
              const isSelected = selectedPrayer === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPrayer(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Tes Tartil */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <Sparkles className="w-4 h-4" />
                <span>1. Mode Murottal Pra-Adzan</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Memutar murottal audio dan menampilkan banner pra-adzan di layar TV.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                triggerWithToast(
                  () => simulateTartil(selectedPrayer, 60),
                  `Perintah Murottal Pra-Adzan ${selectedPrayer.toUpperCase()} terkirim ke TV!`
                )
              }
              className="w-full py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
            >
              Uji Coba Auto-Tartil
            </button>
          </div>

          {/* Tes Masuk Adzan */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                <Bell className="w-4 h-4" />
                <span>2. Layar Waktu Adzan Tiba</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Menghentikan murottal, membunyikan chime nada adzan, dan menampilkan pop-up waktu adzan.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                triggerWithToast(
                  () => simulateAdzan(selectedPrayer, 45),
                  `Layar Waktu Adzan ${selectedPrayer.toUpperCase()} diaktifkan di TV!`
                )
              }
              className="w-full py-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
            >
              Uji Coba Masuk Adzan
            </button>
          </div>

          {/* Tes Iqomah */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>3. Hitung Mundur Iqomah</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Menampilkan angka countdown besar di tengah layar TV dan bunyi beep di detik terakhir.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                triggerWithToast(
                  () => simulateIqomah(selectedPrayer, 1),
                  `Countdown Iqomah ${selectedPrayer.toUpperCase()} (1 mnt) aktif di TV!`
                )
              }
              className="w-full py-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition cursor-pointer"
            >
              Uji Coba Iqomah (1 Mnt)
            </button>
          </div>

          {/* Tes Sholat Mode */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                <Layers className="w-4 h-4" />
                <span>4. Mode Sholat (Shaf Redup)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Layar menjadi gelap & menampilkan pesan merapatkan shaf serta mematikan HP.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                triggerWithToast(
                  () => simulatePrayerMode(1),
                  'Mode Sholat (Layar Redup / Shaf) aktif di TV!'
                )
              }
              className="w-full py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer"
            >
              Uji Coba Mode Sholat
            </button>
          </div>
        </div>
      </div>

      {/* Uji Nada Audio & Speaker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-emerald-400" />
          <span>Uji Suara & Speaker Mixer Masjid (Offline Web Audio)</span>
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => audioService.playBeep(880, 0.3, 'sine')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            🔊 Tes Beep Standar
          </button>
          <button
            type="button"
            onClick={() => audioService.playAdzanChime()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition cursor-pointer"
          >
            🔔 Tes Chime Adzan (Do-Mi-Sol-Do)
          </button>
          <button
            type="button"
            onClick={() => audioService.playIqomahAlert()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold transition cursor-pointer"
          >
            ⚠️ Tes Alarm Iqomah Terakhir
          </button>
        </div>
      </div>

      {/* Panduan Instalasi STB Bekas & Remote Access */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-cyan-400" />
          <span>Panduan Setup STB Bekas & Akses Jarak Jauh (DKM Cloud)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <Tv2 className="w-4 h-4" /> 1. Pemasangan di STB Android Bekas
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>
                Colok kabel <strong className="text-slate-200">HDMI</strong> dari STB ke TV LED Masjid.
              </li>
              <li>
                Colok kabel audio <strong className="text-slate-200">Jack 3.5mm ke RCA</strong> dari STB ke input mixer/amplifier sound system masjid.
              </li>
              <li>
                Install aplikasi <strong className="text-slate-200">Fully Kiosk Browser</strong> (tersedia gratis di Play Store atau download APK).
              </li>
              <li>
                Masukkan Start URL ke alamat TV masjid Anda, centang opsi <em>"Autostart on Boot"</em> dan <em>"Keep Screen On"</em>. Begitu listrik menyala, layar langsung otomatis aktif!
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
              <Wifi className="w-4 h-4" /> 2. Mengakses & Mengubah Data dari Mana Saja
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>
                Deploy web app ini ke hosting gratis seperti <strong className="text-slate-200">Vercel, Netlify, atau Cloudflare Pages</strong>.
              </li>
              <li>
                Layar TV di masjid membuka URL <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono">domain-masjid.com/?mode=tv</code>.
              </li>
              <li>
                Pengurus DKM membuka <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded font-mono">domain-masjid.com/?mode=admin</code> dari HP atau laptop di rumah.
              </li>
              <li>
                Semua data di-cache secara <strong className="text-slate-200">Offline-First</strong>, sehingga jika internet masjid tiba-tiba mati, jam, jadwal sholat, dan audio tartil tetap berjalan 100% normal.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
