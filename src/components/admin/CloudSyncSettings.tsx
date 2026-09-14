import React, { useState, useEffect } from 'react';
import { useMosque } from '../../context/MosqueContext';
import { supabaseService, type SupabaseConfig } from '../../services/supabaseService';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, UploadCloud, DownloadCloud, Key, Globe, Shield } from 'lucide-react';

export const CloudSyncSettings: React.FC = () => {
  const { data, updateData } = useMosque();
  const [config, setConfig] = useState<SupabaseConfig>(() => supabaseService.loadConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const loaded = supabaseService.loadConfig();
    if (loaded.url && loaded.anonKey && !loaded.enabled) {
      loaded.enabled = true;
      supabaseService.saveConfig(loaded);
    }
    setConfig(loaded);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...config,
      enabled: config.url && config.anonKey ? (config.enabled !== false) : false,
    };
    setConfig(updated);
    supabaseService.saveConfig(updated);
    setTestResult({
      success: true,
      message: 'Konfigurasi Cloud Supabase berhasil disimpan dan aktif!',
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    supabaseService.saveConfig(config);
    const res = await supabaseService.testConnection();
    setTesting(false);
    setTestResult(res);
  };

  const handlePushToCloud = async () => {
    setSyncing(true);
    setSyncNotice(null);
    const ok = await supabaseService.pushCloudData(data);
    setSyncing(false);
    if (ok) {
      setSyncNotice('✅ Seluruh data masjid lokal berhasil diunggah ke Cloud Supabase!');
    } else {
      setSyncNotice('❌ Gagal mengunggah data. Pastikan koneksi Supabase sudah benar dan tabel sudah dibuat.');
    }
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    setSyncNotice(null);
    const cloudData = await supabaseService.fetchCloudData();
    setSyncing(false);
    if (cloudData) {
      updateData(() => cloudData);
      setSyncNotice('✅ Data terbaru berhasil ditarik dari Cloud Supabase dan diterapkan ke TV!');
    } else {
      setSyncNotice('❌ Tidak ada data yang ditemukan di Cloud untuk Sync ID ini.');
    }
  };

  const sqlSetupCode = `-- 1. Buat tabel konfigurasi TV Masjid
create table if not exists mosque_config (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Aktifkan Row Level Security & Izin Anonim (Aman & Gratis)
alter table mosque_config enable row level security;
create policy "Allow public read" on mosque_config for select using (true);
create policy "Allow public insert" on mosque_config for insert with check (true);
create policy "Allow public update" on mosque_config for update using (true);

-- 3. Aktifkan Realtime WebSocket
alter publication supabase_realtime add table mosque_config;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Kartu Status / Pengantar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Koneksi Cloud Realtime (Sinkronisasi Antar-Perangkat / Beda Jaringan)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Dengan menghubungkan aplikasi ke <strong>Supabase</strong> (Database Cloud gratis), perubahan yang Anda lakukan dari HP di rumah/jalan akan langsung ter-update di layar TV masjid secara seketika (*real-time*), meskipun berada di jaringan Wi-Fi/kuota seluler yang berbeda.
            </p>
          </div>
        </div>
      </div>

      {/* Form Kredensial Supabase */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Pengaturan Akun Supabase</span>
            </h4>
            <span className="text-xs text-slate-400">
              Dapatkan Project URL & Anon Key gratis di{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                supabase.com (Project Settings &gt; API)
              </a>
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Project URL</span>
            </label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-project-id.supabase.co"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              required={config.enabled}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Anon Public Key</span>
            </label>
            <input
              type="text"
              value={config.anonKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, anonKey: e.target.value }))}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              required={config.enabled}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sync ID Masjid
            </label>
            <input
              type="text"
              value={config.syncId}
              onChange={(e) => setConfig((prev) => ({ ...prev, syncId: e.target.value }))}
              placeholder="default"
              className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Biarkan "default" kecuali jika Anda mengelola beberapa TV masjid dalam satu database Supabase yang sama.
            </span>
          </div>
        </div>

        {/* Hasil Tes Koneksi */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {syncNotice && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200">
            {syncNotice}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !config.url || !config.anonKey}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji...' : 'Uji Koneksi Cloud'}</span>
            </button>

            <button
              type="button"
              onClick={handlePushToCloud}
              disabled={syncing || !config.enabled}
              className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 disabled:opacity-50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Kirim data saat ini ke Supabase"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah ke Cloud</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={syncing || !config.enabled}
              className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 disabled:opacity-50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Tarik data terbaru dari Supabase"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Tarik dari Cloud</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition cursor-pointer"
          >
            Simpan Konfigurasi Cloud
          </button>
        </div>
      </form>

      {/* Panduan 1-Click SQL Script Supabase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Script SQL Supabase (Cukup Dijalankan 1 Kali)</span>
          </h4>
          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Buka dashboard Supabase Anda &gt; menu <strong>SQL Editor</strong> &gt; buat <em>New Query</em> &gt; tempel kode di bawah dan klik <strong>Run</strong>:
        </p>
        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto select-all leading-relaxed">
          {sqlSetupCode}
        </pre>
      </div>
    </div>
  );
};
