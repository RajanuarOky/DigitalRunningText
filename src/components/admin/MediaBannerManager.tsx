import React, { useState } from 'react';
import { useMosque } from '../../context/MosqueContext';
import type { FinanceReport, FridayInfo, BannerSlide } from '../../types';
import { formatCurrencyIDR } from '../../utils/formatters';
import { Wallet, Users, Image as ImageIcon, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';

export const MediaBannerManager: React.FC = () => {
  const { data, updateData } = useMosque();
  const [financeForm, setFinanceForm] = useState<FinanceReport>(data.finance);
  const [fridayForm, setFridayForm] = useState<FridayInfo>(data.friday);
  const [banners, setBanners] = useState<BannerSlide[]>(data.banners);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-calculate final balance: initial + income - expense
  const handleFinanceNumberChange = (key: 'initialBalance' | 'income' | 'expense', val: number) => {
    setFinanceForm((prev) => {
      const next = { ...prev, [key]: val };
      next.finalBalance = next.initialBalance + next.income - next.expense;
      return next;
    });
  };

  const handleBannerToggle = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const handleBannerDelete = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddPoster = () => {
    const newSlide: BannerSlide = {
      id: Date.now().toString(),
      title: 'Kajian Ilmiah Akhir Pekan',
      type: 'poster',
      imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80',
      content: 'Tema: Adab dan Akhlak Muslim Sehari-hari bersama Ustadz Pembina.',
      durationSeconds: 15,
      active: true,
    };
    setBanners((prev) => [...prev, newSlide]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateData((prev) => ({
      ...prev,
      finance: financeForm,
      friday: fridayForm,
      banners: banners,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Laporan Kas, Petugas Jum'at, dan Banner berhasil disimpan ke TV!</span>
        </div>
      )}

      {/* 1. Laporan Keuangan Kas Masjid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <span>Laporan Keuangan Kas Masjid</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Periode Laporan
            </label>
            <input
              type="text"
              value={financeForm.period}
              onChange={(e) =>
                setFinanceForm((prev) => ({ ...prev, period: e.target.value }))
              }
              placeholder="Contoh: September 2026 / Pekan Ini"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Saldo Awal (Rp)
            </label>
            <input
              type="number"
              value={financeForm.initialBalance}
              onChange={(e) =>
                handleFinanceNumberChange('initialBalance', parseFloat(e.target.value) || 0)
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              + Pemasukan Infaq (Rp)
            </label>
            <input
              type="number"
              value={financeForm.income}
              onChange={(e) =>
                handleFinanceNumberChange('income', parseFloat(e.target.value) || 0)
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
              - Pengeluaran (Rp)
            </label>
            <input
              type="number"
              value={financeForm.expense}
              onChange={(e) =>
                handleFinanceNumberChange('expense', parseFloat(e.target.value) || 0)
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-rose-300 text-sm font-mono"
            />
          </div>
        </div>

        {/* Kalkulasi Saldo Akhir */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-400">
            Total Saldo Akhir (Otomatis Dihitung):
          </span>
          <span className="text-xl font-black text-amber-300 font-mono">
            {formatCurrencyIDR(financeForm.finalBalance)}
          </span>
        </div>
      </div>

      {/* 2. Petugas Shalat Jum'at */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Petugas Shalat Jum'at Pekan Ini</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Keterangan Tanggal
            </label>
            <input
              type="text"
              value={fridayForm.date}
              onChange={(e) =>
                setFridayForm((prev) => ({ ...prev, date: e.target.value }))
              }
              placeholder="Contoh: Jum'at, 18 September 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Khatib
            </label>
            <input
              type="text"
              value={fridayForm.khatib}
              onChange={(e) =>
                setFridayForm((prev) => ({ ...prev, khatib: e.target.value }))
              }
              placeholder="Nama Ustadz Khatib"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Imam
            </label>
            <input
              type="text"
              value={fridayForm.imam}
              onChange={(e) =>
                setFridayForm((prev) => ({ ...prev, imam: e.target.value }))
              }
              placeholder="Nama Imam Sholat"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Muadzin
            </label>
            <input
              type="text"
              value={fridayForm.muadzin}
              onChange={(e) =>
                setFridayForm((prev) => ({ ...prev, muadzin: e.target.value }))
              }
              placeholder="Nama Muadzin"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* 3. Slider Poster & Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <span>Slide Carousel / Banner TV ({banners.length} Slide)</span>
          </h3>
          <button
            type="button"
            onClick={handleAddPoster}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slide Poster</span>
          </button>
        </div>

        <div className="space-y-4">
          {banners.map((slide, idx) => (
            <div
              key={slide.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                slide.active
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={slide.active}
                  onChange={() => handleBannerToggle(slide.id)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  title="Aktifkan slide ini di TV"
                />
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-bold uppercase">
                  Slide {idx + 1} ({slide.type})
                </span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) =>
                    setBanners((prev) =>
                      prev.map((b) => (b.id === slide.id ? { ...b, title: e.target.value } : b))
                    )
                  }
                  placeholder="Judul Slide"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                {slide.type === 'poster' && (
                  <input
                    type="text"
                    value={slide.imageUrl || ''}
                    onChange={(e) =>
                      setBanners((prev) =>
                        prev.map((b) => (b.id === slide.id ? { ...b, imageUrl: e.target.value } : b))
                      )
                    }
                    placeholder="URL Gambar Poster (Online / Link CDN)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Durasi:</span>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={slide.durationSeconds}
                  onChange={(e) =>
                    setBanners((prev) =>
                      prev.map((b) =>
                        b.id === slide.id
                          ? { ...b, durationSeconds: parseInt(e.target.value, 10) || 10 }
                          : b
                      )
                    )
                  }
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-amber-300 font-mono font-bold text-xs"
                />
                <span className="text-xs text-slate-400">detik</span>

                {banners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleBannerDelete(slide.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Data Media & Kas</span>
        </button>
      </div>
    </form>
  );
};
