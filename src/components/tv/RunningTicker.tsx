import React, { useMemo } from 'react';
import type { RunningTextItem } from '../../types';
import { Info, HeartHandshake, Sparkles, Megaphone } from 'lucide-react';

interface RunningTickerProps {
  items: RunningTextItem[];
}

export const RunningTicker: React.FC<RunningTickerProps> = React.memo(({ items }) => {
  const activeTexts = useMemo(
    () => items.filter((t: RunningTextItem) => t.active),
    [items]
  );

  // Duplikasi teks agar efek infinite loop seamless tidak pernah kosong
  const displayItems = useMemo(() => {
    if (activeTexts.length === 0) return [];
    if (activeTexts.length === 1) return [...activeTexts, ...activeTexts, ...activeTexts, ...activeTexts];
    return [...activeTexts, ...activeTexts];
  }, [activeTexts]);

  if (activeTexts.length === 0) return null;

  return (
    <div className="running-ticker-container w-full bg-slate-950 border-t border-emerald-500/30 flex items-stretch h-14 shadow-2xl relative overflow-hidden z-20 select-none">
      {/* Label Kiri Statis */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 px-5 flex items-center gap-2 font-black text-xs lg:text-sm uppercase tracking-wider shrink-0 z-30 shadow-lg">
        <Megaphone className="w-4 h-4 text-slate-950 shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">Warta Masjid</span>
      </div>

      {/* Track Marquee Berjalan */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="animate-marquee flex items-center shrink-0 w-max whitespace-nowrap py-1">
          {displayItems.map((item: RunningTextItem, idx: number) => (
            <div
              key={`${item.id}-${idx}`}
              className="inline-flex items-center shrink-0 whitespace-nowrap mr-12"
            >
              {item.category === 'infaq' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 mr-3">
                  <HeartHandshake className="w-3.5 h-3.5" /> Infaq
                </span>
              )}
              {item.category === 'hadits' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0 mr-3">
                  <Sparkles className="w-3.5 h-3.5" /> Hadits
                </span>
              )}
              {(!item.category || item.category === 'info') && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 mr-3">
                  <Info className="w-3.5 h-3.5" /> Info
                </span>
              )}
              <span className="text-slate-100 text-sm lg:text-base font-medium tracking-wide whitespace-nowrap">
                {item.text}
              </span>
              <span className="text-emerald-400 font-bold ml-8 text-xs select-none">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
