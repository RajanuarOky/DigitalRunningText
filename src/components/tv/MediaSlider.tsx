import React, { useState, useEffect, useMemo } from 'react';
import { useMosque } from '../../context/MosqueContext';
import { formatCurrencyIDR } from '../../utils/formatters';
import type { BannerSlide } from '../../types';
import { Wallet, Users, BookOpen, Calendar, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';

export const MediaSlider: React.FC = () => {
  const { data } = useMosque();
  const activeBanners = useMemo(
    () => data.banners.filter((b: BannerSlide) => b.active),
    [data.banners]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  // Pastikan currentIndex selalu valid jika banner dihapus/diubah
  useEffect(() => {
    if (currentIndex >= activeBanners.length && activeBanners.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Otomatisasi Carousel berdasarkan durasi slide
  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const currentSlide = activeBanners[currentIndex] || activeBanners[0];
    const durationMs = Math.max(3, currentSlide?.durationSeconds || 10) * 1000;

    // Reset progress animasi bar
    setProgressKey((prev) => prev + 1);

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, durationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [currentIndex, activeBanners.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  if (activeBanners.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
        Tidak ada slide pengumuman aktif.
      </div>
    );
  }

  const slide: BannerSlide = activeBanners[currentIndex] || activeBanners[0];
  const slideDuration = Math.max(3, slide?.durationSeconds || 10);

  return (
    <div className="flex-1 w-full px-6 py-2 overflow-hidden flex flex-col justify-center group relative">
      <div className="relative w-full h-full min-h-[320px] rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col">
        {/* Progress Bar Durasi Slide */}
        {activeBanners.length > 1 && (
          <div className="absolute top-0 inset-x-0 h-1 bg-slate-800/80 z-30 overflow-hidden">
            <div
              key={progressKey}
              className="h-full bg-emerald-400"
              style={{
                animation: `slideProgress ${slideDuration}s linear forwards`,
              }}
            />
          </div>
        )}

        {/* 1. Slide Poster / Agenda Kajian */}
        {slide.type === 'poster' && (
          <div className="relative w-full h-full flex flex-col justify-end p-8 lg:p-12 animate-in fade-in duration-500">
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-90"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda Kegiatan</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md">
                {slide.title}
              </h2>
              {slide.content && (
                <p className="text-base lg:text-xl text-slate-200 leading-relaxed max-w-3xl drop-shadow">
                  {slide.content}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 2. Slide Laporan Kas Keuangan Masjid */}
        {slide.type === 'kas' && (
          <div className="w-full h-full p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-wide uppercase">
                  Laporan Keuangan Kas Masjid
                </h2>
                <p className="text-xs lg:text-sm text-emerald-300">
                  Periode: {data.finance.period}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:gap-6 mt-2">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Saldo Awal
                </span>
                <span className="text-xl lg:text-3xl font-extrabold text-slate-200 mt-2">
                  {formatCurrencyIDR(data.finance.initialBalance)}
                </span>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Pemasukan Infaq
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xl lg:text-3xl font-extrabold text-emerald-300 mt-2">
                  + {formatCurrencyIDR(data.finance.income)}
                </span>
              </div>

              <div className="bg-rose-950/30 border border-rose-600/40 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Pengeluaran Operasional
                  </span>
                  <ArrowDownRight className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-xl lg:text-3xl font-extrabold text-rose-300 mt-2">
                  - {formatCurrencyIDR(data.finance.expense)}
                </span>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-emerald-900/60 to-slate-900 border border-emerald-500/50 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <span className="text-sm lg:text-lg font-bold text-white tracking-wider uppercase">
                Saldo Akhir Kas Masjid
              </span>
              <span className="text-2xl lg:text-4xl font-black text-amber-300 tracking-wide">
                {formatCurrencyIDR(data.finance.finalBalance)}
              </span>
            </div>
          </div>
        )}

        {/* 3. Slide Petugas Jum'at */}
        {slide.type === 'jumat' && (
          <div className="w-full h-full p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-wide uppercase">
                  Petugas Shalat Jum'at
                </h2>
                <p className="text-xs lg:text-sm text-indigo-300">
                  {data.friday.date}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Khatib
                </span>
                <span className="text-lg lg:text-2xl font-bold text-white leading-snug">
                  {data.friday.khatib}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Imam Shalat
                </span>
                <span className="text-lg lg:text-2xl font-bold text-white leading-snug">
                  {data.friday.imam}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Muadzin
                </span>
                <span className="text-lg lg:text-2xl font-bold text-white leading-snug">
                  {data.friday.muadzin}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Slide Mutiara Hadits */}
        {slide.type === 'hadits' && (
          <div className="w-full h-full p-8 lg:p-14 flex flex-col justify-center items-center text-center bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 animate-in fade-in duration-500">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3">
              Mutiara Hadits & Hikmah
            </div>
            <p className="text-xl lg:text-3xl font-medium text-slate-100 max-w-4xl leading-relaxed italic">
              "{slide.content}"
            </p>
            {slide.source && (
              <span className="mt-6 text-sm lg:text-base font-bold text-amber-400 tracking-wider">
                — {slide.source}
              </span>
            )}
          </div>
        )}

        {/* Manual Navigation Controls (Hover to reveal) */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-slate-800"
              title="Slide Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-slate-800"
              title="Slide Berikutnya"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Indicator Dots */}
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-20">
          {activeBanners.map((_: BannerSlide, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-8 bg-emerald-400 shadow-md shadow-emerald-500/50' : 'w-2 bg-slate-600 hover:bg-slate-400'
              }`}
              title={`Pindah ke Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
