import React, { useState } from 'react';
import { useMosque } from '../../context/MosqueContext';
import type { MosqueConfig, PrayerAdjustment } from '../../types';
import { Building, MapPin, Compass, Save, CheckCircle2 } from 'lucide-react';

const CITY_PRESETS: { name: string; lat: number; lng: number }[] = [
  { name: 'DKI Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
  { name: 'Semarang', lat: -6.9667, lng: 110.4167 },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
  { name: 'Banjarmasin', lat: -3.3194, lng: 114.5908 },
];

export const MosqueSettings: React.FC = () => {
  const { data, updateData } = useMosque();
  const [form, setForm] = useState<MosqueConfig>(data.mosque);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = <K extends keyof MosqueConfig>(key: K, value: MosqueConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdjustmentChange = (prayerKey: keyof PrayerAdjustment, value: number) => {
    setForm((prev) => ({
      ...prev,
      prayerAdjustments: {
        ...prev.prayerAdjustments,
        [prayerKey]: value,
      },
    }));
  };

  const applyPresetCity = (preset: { lat: number; lng: number }) => {
    setForm((prev) => ({
      ...prev,
      latitude: preset.lat,
      longitude: preset.lng,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateData((prev) => ({ ...prev, mosque: form }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Notifikasi Simpan */}
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Pengaturan identitas masjid dan koordinat berhasil disimpan & disinkronkan ke TV!</span>
        </div>
      )}

      {/* Profil Masjid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-emerald-400" />
          <span>Identitas Masjid</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nama Masjid
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="Contoh: MASJID JAMI' BAITURRAHMAN"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tagline / Motto
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="Contoh: Pusat Ibadah dan Kebajikan Sosial"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Alamat Lengkap Masjid
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="Contoh: Jl. Melati No. 45, Jakarta Selatan"
            />
          </div>
        </div>
      </div>

      {/* Koordinat & Lokasi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <span>Lokasi & Koordinat GPS untuk Jadwal Sholat</span>
        </h3>

        {/* Preset Kota Cepat */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Pilih Kota Cepat:
          </span>
          <div className="flex flex-wrap gap-2">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => applyPresetCity(city)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-medium text-slate-300 transition"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Latitude (Lintang)
            </label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => handleChange('latitude', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Longitude (Bujur)
            </label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => handleChange('longitude', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Metode Perhitungan
            </label>
            <select
              value={form.calcMethod}
              onChange={(e) => handleChange('calcMethod', e.target.value as MosqueConfig['calcMethod'])}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="KEMENAG">Kemenag RI (Subuh 20°, Isya 18°)</option>
              <option value="MWL">Muslim World League (MWL)</option>
              <option value="MAKKAH">Umm Al-Qura (Makkah)</option>
              <option value="EGYPT">Egyptian General Authority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Koreksi Kalender Hijriah (+/- Hari)
            </label>
            <input
              type="number"
              min="-2"
              max="2"
              value={form.hijriOffset}
              onChange={(e) => handleChange('hijriOffset', parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Gunakan jika terdapat selisih 1 hari berdasarkan sidang isbat rukyatul hilal Kemenag.
            </span>
          </div>
        </div>
      </div>

      {/* Koreksi Waktu Sholat (Ihtiati) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <span>Koreksi Waktu Sholat / Ihtiati (+/- Menit)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Standar Kemenag menyarankan ihtiati penambahan +2 menit untuk keamanan masuk waktu sholat.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as (keyof PrayerAdjustment)[]).map(
            (pk) => {
              const labelMap: Record<string, string> = {
                fajr: 'Subuh',
                sunrise: 'Terbit',
                dhuhr: 'Dzuhur',
                asr: 'Ashar',
                maghrib: 'Maghrib',
                isha: 'Isya',
              };

              return (
                <div key={pk} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    {labelMap[pk]}
                  </span>
                  <input
                    type="number"
                    value={form.prayerAdjustments[pk]}
                    onChange={(e) => handleAdjustmentChange(pk, parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1.5 text-emerald-400 font-mono font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">menit</span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Tombol Simpan */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan Identitas & Jadwal</span>
        </button>
      </div>
    </form>
  );
};
