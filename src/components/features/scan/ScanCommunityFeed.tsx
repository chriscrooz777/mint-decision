'use client';

import type { ScanItem } from '@/components/features/landing/ActivityTicker';

const sportColors: Record<string, string> = {
  NBA: 'text-orange-400',
  MLB: 'text-red-400',
  NFL: 'text-green-400',
  NHL: 'text-blue-400',
};

const sportBg: Record<string, string> = {
  NBA: 'bg-orange-950/40 border-orange-800/40',
  MLB: 'bg-red-950/40 border-red-800/40',
  NFL: 'bg-green-950/40 border-green-800/40',
  NHL: 'bg-blue-950/40 border-blue-800/40',
};

function formatPrice(low: number, high: number): string {
  const mid = Math.round((low + high) / 2);
  if (mid >= 10000) return `~$${(mid / 1000).toFixed(0)}k`;
  if (mid >= 1000) return `~$${(mid / 1000).toFixed(1)}k`;
  return `~$${mid}`;
}

interface ScanCommunityFeedProps {
  items: ScanItem[];
  totalToday: number;
}

export default function ScanCommunityFeed({ items, totalToday }: ScanCommunityFeedProps) {
  if (!items.length) return null;

  const doubled = [...items, ...items];

  // Top 3 highest-value finds for the spotlight row
  const topFinds = [...items]
    .sort((a, b) => b.rawPriceHigh - a.rawPriceHigh)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </div>
          <h3 className="text-sm font-bold">Community Activity</h3>
        </div>
        <span className="text-xs text-muted font-medium">
          {totalToday.toLocaleString()} scans today
        </span>
      </div>

      {/* Scrolling ticker */}
      <div
        className="w-full overflow-hidden rounded-xl"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        }}
      >
        <div
          className="flex gap-2 animate-ticker py-1"
          style={{ width: 'max-content', willChange: 'transform' }}
        >
          {doubled.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 whitespace-nowrap shrink-0"
            >
              <span className={`text-[10px] font-bold tracking-wide ${sportColors[item.sport] ?? 'text-muted'}`}>
                {item.sport}
              </span>
              <span className="text-xs font-semibold">{item.playerName}</span>
              <span className="text-[10px] text-border">·</span>
              <span className="text-[10px] text-muted">{item.cardYear} {item.cardSet}</span>
              <span className="text-[10px] text-border">·</span>
              <span className="text-[10px] font-semibold text-primary">{item.psaRecommendation}</span>
              <span className="text-[10px] text-border">·</span>
              <span className="text-[10px] font-semibold text-emerald-400">{formatPrice(item.rawPriceLow, item.rawPriceHigh)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Finds */}
      <div className="grid grid-cols-3 gap-2">
        {topFinds.map((card) => (
          <div
            key={card.id}
            className={`rounded-xl border p-2.5 ${sportBg[card.sport] ?? 'bg-card border-border'}`}
          >
            <p className={`text-[10px] font-bold tracking-wide mb-0.5 ${sportColors[card.sport] ?? 'text-muted'}`}>
              {card.sport}
            </p>
            <p className="text-xs font-bold leading-tight line-clamp-1">{card.playerName}</p>
            <p className="text-[10px] text-muted mt-0.5 line-clamp-1">{card.cardYear} {card.cardSet}</p>
            <p className="text-[10px] font-bold text-emerald-400 mt-1">
              {formatPrice(card.rawPriceLow, card.rawPriceHigh)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
