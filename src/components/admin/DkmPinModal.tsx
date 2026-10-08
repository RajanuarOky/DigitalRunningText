import React, { useState } from 'react';
import { Lock, Delete, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

interface DkmPinModalProps {
  mosqueName: string;
  expectedPin?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DkmPinModal: React.FC<DkmPinModalProps> = ({
  mosqueName,
  expectedPin = '1234',
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      setError(false);
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(false);
    setPin('');
  };

  const handleVerify = () => {
    const validPin = (expectedPin || '1234').trim();
    // Support PIN DKM atau Master PIN teknisi (889900)
    if (pin === validPin || pin === '889900') {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">PIN Pengurus DKM</h2>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan PIN keamanan untuk mengelola:
          </p>
          <div className="inline-block mt-1 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-300">
            {mosqueName || 'Masjid'}
          </div>
        </div>

        {/* PIN Display */}
        <div className="mb-6">
          <div
            className={`flex items-center justify-center gap-3 py-3 px-4 bg-slate-950/70 rounded-2xl border transition-all ${
              error
                ? 'border-red-500/70 bg-red-950/20 text-red-400 animate-shake'
                : 'border-slate-800 text-slate-200'
            }`}
          >
            {pin.length === 0 ? (
              <span className="text-slate-500 text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" /> Masukkan PIN
              </span>
            ) : (
              <div className="flex gap-2">
                {pin.split('').map((_, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50"
                  />
                ))}
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-400 text-center mt-2 font-medium">
              PIN salah! Silakan coba lagi (Default: 1234).
            </p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(String(num))}
              className="py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold text-slate-100 transition shadow border border-slate-700/50"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 transition border border-slate-700/40"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold text-slate-100 transition shadow border border-slate-700/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center transition border border-slate-700/40"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Batal / TV
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={pin.length === 0}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg ${
              pin.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Buka Akses
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-4">
          PIN default pengurus: <code className="text-amber-400 bg-slate-800 px-1 py-0.5 rounded">1234</code>. Dapat diubah di menu Pengaturan Masjid.
        </p>
      </div>
    </div>
  );
};
