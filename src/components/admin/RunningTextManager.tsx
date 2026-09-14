import React, { useState } from 'react';
import { useMosque } from '../../context/MosqueContext';
import type { RunningTextItem } from '../../types';
import { Megaphone, Plus, Trash2, CheckCircle2, Save } from 'lucide-react';

export const RunningTextManager: React.FC = () => {
  const { data, updateData } = useMosque();
  const [texts, setTexts] = useState<RunningTextItem[]>(data.runningTexts);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'info' | 'infaq' | 'hadits'>('info');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAdd = () => {
    if (!newText.trim()) return;
    const newItem: RunningTextItem = {
      id: Date.now().toString(),
      text: newText.trim(),
      active: true,
      category: newCategory,
    };
    setTexts((prev) => [...prev, newItem]);
    setNewText('');
  };

  const handleToggle = (id: string) => {
    setTexts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  const handleDelete = (id: string) => {
    setTexts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTextChange = (id: string, text: string) => {
    setTexts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleCategoryChange = (id: string, category: 'info' | 'infaq' | 'hadits') => {
    setTexts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category } : item))
    );
  };

  const handleSave = () => {
    updateData((prev) => ({ ...prev, runningTexts: texts }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Daftar Running Text berhasil diperbarui dan disinkronkan ke TV!</span>
        </div>
      )}

      {/* Form Tambah Pesan Baru */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-emerald-400" />
          <span>Tambah Pesan Running Text Baru</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as 'info' | 'infaq' | 'hadits')}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
          >
            <option value="info">Info / Pengumuman</option>
            <option value="infaq">Infaq & Rekening</option>
            <option value="hadits">Hadits / Nasihat</option>
          </select>

          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Ketik teks pengumuman berjalan..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={handleAdd}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Daftar Pesan Running Text */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <span>Daftar Pesan Aktif ({texts.filter((t) => t.active).length} dari {texts.length})</span>
          </h3>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan ke TV</span>
          </button>
        </div>

        <div className="space-y-3">
          {texts.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                item.active
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => handleToggle(item.id)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  title="Aktifkan/Nonaktifkan pesan ini"
                />
                <select
                  value={item.category || 'info'}
                  onChange={(e) =>
                    handleCategoryChange(item.id, e.target.value as 'info' | 'infaq' | 'hadits')
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                >
                  <option value="info">Info</option>
                  <option value="infaq">Infaq</option>
                  <option value="hadits">Hadits</option>
                </select>
              </div>

              <input
                type="text"
                value={item.text}
                onChange={(e) => handleTextChange(item.id, e.target.value)}
                className="flex-1 w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer self-end sm:self-center"
                title="Hapus pesan ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
