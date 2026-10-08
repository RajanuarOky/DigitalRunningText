import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../../services/supabaseService';
import type { MosqueListItem } from '../../types';
import {
  ShieldAlert,
  Building2,
  Plus,
  Tv,
  Smartphone,
  Trash2,
  ExternalLink,
  Check,
  Search,
  RefreshCw,
  LogOut,
  ArrowLeft,
  KeyRound,
  Delete,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onBack: () => void;
}

const SUPER_ADMIN_PIN = '889900';
const SESSION_SUPER_KEY = 'super_admin_unlocked';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_SUPER_KEY) === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Mosque list state
  const [mosques, setMosques] = useState<MosqueListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Create Mosque state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPin, setNewPin] = useState('1234');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MosqueListItem | null>(null);

  const fetchMosques = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await supabaseService.getAllMosques();
      setMosques(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMosques();
    }
  }, [isAuthenticated, fetchMosques]);

  const handleVerifyMasterPin = () => {
    if (pinInput === SUPER_ADMIN_PIN) {
      sessionStorage.setItem(SESSION_SUPER_KEY, 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_SUPER_KEY);
    setIsAuthenticated(false);
    setPinInput('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateMosque = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);

    const cleanId = newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanId) {
      setCreateError('ID Masjid tidak boleh kosong');
      setIsSubmitting(false);
      return;
    }

    const res = await supabaseService.createMosque(
      cleanId,
      newName.trim() || `Masjid ${cleanId}`,
      newCity.trim() || 'Default',
      newPin.trim() || '1234'
    );

    setIsSubmitting(false);
    if (!res.success) {
      setCreateError(res.error || 'Gagal menambahkan masjid.');
      return;
    }

    // Success
    setShowCreateModal(false);
    setNewId('');
    setNewName('');
    setNewCity('');
    setNewPin('1234');
    fetchMosques();
  };

  const handleDeleteMosque = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    await supabaseService.deleteMosque(deleteTarget.id);
    setDeleteTarget(null);
    fetchMosques();
  };

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }
    return '';
  };

  const filteredMosques = mosques.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 1. PIN GATE VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Super Admin Gateway</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Akses khusus teknisi & pengembang untuk manajemen multi-masjid.
          </p>

          {/* PIN Input Display */}
          <div className="mb-6">
            <div
              className={`flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 rounded-2xl border transition-all ${
                pinError ? 'border-red-500 bg-red-950/20 text-red-400' : 'border-slate-800 text-slate-200'
              }`}
            >
              {pinInput.length === 0 ? (
                <span className="text-slate-500 text-sm flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" /> Masukkan Master PIN
                </span>
              ) : (
                <div className="flex gap-2">
                  {pinInput.split('').map((_, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full bg-red-500" />
                  ))}
                </div>
              )}
            </div>
            {pinError && (
              <p className="text-xs text-red-400 text-center mt-2 font-medium">
                Master PIN salah!
              </p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setPinError(false);
                  if (pinInput.length < 8) setPinInput((p) => p + num);
                }}
                className="py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold text-slate-100 transition shadow border border-slate-700/50"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPinError(false);
                setPinInput('');
              }}
              className="py-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 transition border border-slate-700/40"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => {
                setPinError(false);
                if (pinInput.length < 8) setPinInput((p) => p + '0');
              }}
              className="py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold text-slate-100 transition shadow border border-slate-700/50"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => {
                setPinError(false);
                setPinInput((p) => p.slice(0, -1));
              }}
              className="py-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center transition border border-slate-700/40"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <button
              type="button"
              onClick={handleVerifyMasterPin}
              disabled={pinInput.length === 0}
              className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg ${
                pinInput.length > 0
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Buka Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. SUPER ADMIN DASHBOARD MAIN VIEW ---
  const baseUrl = getBaseUrl();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navbar */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">Super Admin Dashboard</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MULTI-TENANT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola pendaftaran masjid independen & bagikan tautan instalasi TV STB / DKM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Tambah Masjid
            </button>
            <button
              onClick={fetchMosques}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Ke TV
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 transition"
              title="Kunci Panel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama masjid, kota, atau ID..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Total Terdaftar: <strong className="text-emerald-400 font-bold">{mosques.length}</strong> Masjid</span>
          </div>
        </div>

        {/* Mosque Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMosques.map((item) => {
            const tvUrl = `${baseUrl}?masjid=${encodeURIComponent(item.id)}`;
            const dkmUrl = `${baseUrl}?masjid=${encodeURIComponent(item.id)}&mode=admin`;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate group-hover:text-emerald-400 transition">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {item.city || 'Kota Default'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                      ID: {item.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN DKM:</span>
                      <strong className="text-amber-300 font-mono">{item.adminPin || '1234'}</strong>
                    </div>
                    {item.updatedAt && (
                      <div className="text-slate-500 ml-auto text-[10px]">
                        Sync: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  {/* Salin TV STB */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(tvUrl, `tv_${item.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50 text-[11px] font-medium transition active:scale-95"
                    >
                      {copiedId === `tv_${item.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Tv className="w-3.5 h-3.5" />
                          <span>Salin Link TV</span>
                        </>
                      )}
                    </button>
                    <a
                      href={tvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Buka Layar TV"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Salin Admin DKM */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(dkmUrl, `dkm_${item.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/50 text-[11px] font-medium transition active:scale-95"
                    >
                      {copiedId === `dkm_${item.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Salin Link Admin</span>
                        </>
                      )}
                    </button>
                    <a
                      href={dkmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Buka Admin DKM"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Hapus button */}
                  {item.id !== 'default' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus Masjid
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredMosques.length === 0 && !isLoading && (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-300 font-bold mb-1">Tidak ada masjid ditemukan</h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Klik "Tambah Masjid" untuk mendaftarkan masjid baru.'}
            </p>
          </div>
        )}

      </div>

      {/* MODAL: TAMBAH MASJID BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Tambah Masjid Baru
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Setiap masjid memiliki database jadwal, murottal, dan running text terpisah.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMosque} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID Kode Unik Masjid (Slug URL) *
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus-within:border-emerald-500">
                  <span className="text-slate-500 mr-1 select-none">?masjid=</span>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                    placeholder="al-ikhlas"
                    className="bg-transparent border-none text-white focus:outline-none flex-1 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hanya huruf kecil, angka, tanda hubung. Contoh: <code className="text-slate-400">al-ikhlas</code>, <code className="text-slate-400">baiturrahman</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Resmi Masjid *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: MASJID AL-IKHLAS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Contoh: Sidoarjo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  PIN Pengurus DKM (4-8 Angka) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  PIN ini yang akan diberikan ke Pengurus DKM untuk login.
                </p>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Membuat...' : 'Buat Masjid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS MASJID */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-400">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Hapus Masjid Ini?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Apakah Anda yakin ingin menghapus masjid <strong>"{deleteTarget.name}"</strong> (ID: {deleteTarget.id})? Data yang sudah tersimpan di cloud akan dihapus permanen.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteMosque}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition shadow-lg shadow-red-600/30"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
