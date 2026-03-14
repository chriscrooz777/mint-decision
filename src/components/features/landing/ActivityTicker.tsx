'use client';

export interface ScanItem {
  id: string;
  playerName: string;
  cardYear: string;
  cardSet: string;
  sport: string;
  psaRecommendation: string;
  rawPriceLow: number;
  rawPriceHigh: number;
}

const sportColors: Record<string, string> = {
  NBA: 'text-orange-400',
  MLB: 'text-red-400',
  NFL: 'text-green-400',
  NHL: 'text-blue-400',
};

function formatPrice(low: number, high: number): string {
  const mid = Math.round((low + high) / 2);
  if (mid >= 10000) return `~$${(mid / 1000).toFixed(0)}k`;
  if (mid >= 1000)  return `~$${(mid / 1000).toFixed(1)}k`;
  return `~$${mid}`;
}

export default function ActivityTicker({ items }: { items: ScanItem[] }) {
  if (!items.length) return null;

  // Duplicate for seamless infinite scroll
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-4 border-y border-slate-800 bg-slate-900/80"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      <div
        className="flex gap-3 animate-ticker"
        style={{ width: 'max-content', willChange: 'transform' }}
      >
        {doubled.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/40 rounded-full px-3.5 py-1.5 whitespace-nowrap shrink-0"
          >
            <span className={`text-[10px] font-bold tracking-wide ${sportColors[item.sport] ?? 'text-slate-400'}`}>
              {item.sport}
            </span>
            <span className="text-xs font-semibold text-white">{item.playerName}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-400">{item.cardYear} {item.cardSet}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] font-semibold text-blue-400">{item.psaRecommendation}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] font-semibold text-emerald-400">{formatPrice(item.rawPriceLow, item.rawPriceHigh)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
