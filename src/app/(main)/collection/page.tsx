'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_SPORTS } from '@/lib/constants';
import { formatPriceRange, formatNumber, formatMintId, formatGradeRange } from '@/lib/utils/format';
import { Sport } from '@/types/scan';
import Link from 'next/link';
import SwipeableCard from '@/components/features/collection/SwipeableCard';
import { getCardImageUrl } from '@/lib/supabase/storage';
import ScanDrawer from '@/components/features/scan/ScanDrawer';

const PAGE_SIZE = 20;

interface CollectionCardData {
  id: string;
  mint_id: number;
  player_name: string;
  card_year: string;
  card_set: string;
  card_number: string;
  sport: string;
  manufacturer: string;
  estimated_value_low: number;
  estimated_value_high: number;
  psa_grade: number | null;
  psa_recommendation?: string;
  estimated_psa_grade_low?: number | null;
  estimated_psa_grade_high?: number | null;
  image_path: string | null;
  created_at: string;
}

interface CollectionMeta {
  total: number;
  tier: string;
  stats: {
    totalCards: number;
    totalValueLow: number;
    totalValueHigh: number;
  };
}

export default function CollectionPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CollectionCardData[]>([]);
  const [meta, setMeta] = useState<CollectionMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [isScanDrawerOpen, setIsScanDrawerOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isFree = meta?.tier === 'free';
  const hasMore = cards.length < (meta?.total ?? 0);

  // Fetch page 1 whenever filters/sort change
  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      setIsLoading(true);
      setCards([]);
      setPage(1);
      try {
        const params = new URLSearchParams({ sortBy, page: '1', limit: String(PAGE_SIZE) });
        if (search) params.set('search', search);
        if (sportFilter) params.set('sport', sportFilter);

        const res = await fetch(`/api/collection?${params}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load collection');
        }
        const result = await res.json();
        if (cancelled) return;
        setCards(result.cards);
        setMeta({ total: result.total, tier: result.tier, stats: result.stats });
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load collection');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchInitial();
    return () => { cancelled = true; };
  }, [search, sportFilter, sortBy]);

  // Load next page and append
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ sortBy, page: String(nextPage), limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      if (sportFilter) params.set('sport', sportFilter);

      const res = await fetch(`/api/collection?${params}`);
      if (!res.ok) throw new Error('Failed to load more');
      const result = await res.json();
      setCards((prev) => [...prev, ...result.cards]);
      setPage(nextPage);
    } catch {
      // silently fail — user can scroll again to retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, search, sportFilter, sortBy, isLoadingMore, hasMore]);

  // Intersection observer triggers loadMore when sentinel enters view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    // Optimistic remove
    setCards((prev) => {
      const deleted = prev.find((c) => c.id === cardId);
      if (deleted) {
        setMeta((m) =>
          m
            ? {
                ...m,
                total: m.total - 1,
                stats: {
                  totalCards: m.stats.totalCards - 1,
                  totalValueLow: m.stats.totalValueLow - (deleted.estimated_value_low || 0),
                  totalValueHigh: m.stats.totalValueHigh - (deleted.estimated_value_high || 0),
                },
              }
            : m
        );
      }
      return prev.filter((c) => c.id !== cardId);
    });

    try {
      const res = await fetch(`/api/collection/${cardId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete card');
    } catch {
      // Re-fetch page 1 to restore
      const params = new URLSearchParams({ sortBy, page: '1', limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      if (sportFilter) params.set('sport', sportFilter);
      const res = await fetch(`/api/collection?${params}`);
      if (res.ok) {
        const result = await res.json();
        setCards(result.cards);
        setPage(1);
        setMeta({ total: result.total, tier: result.tier, stats: result.stats });
      }
    }
  }, [search, sportFilter, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Collection</h1>
          <p className="text-muted text-sm mt-1">Your saved cards and estimated values</p>
        </div>
        <button
          onClick={() => setIsScanDrawerOpen(true)}
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity shrink-0"
          aria-label="Scan a card"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Scan
        </button>
      </div>

      <ScanDrawer isOpen={isScanDrawerOpen} onClose={() => setIsScanDrawerOpen(false)} />

      {/* Stats — paid users only */}
      {!isFree && meta?.stats && meta.stats.totalCards > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted">Total Cards</p>
            <p className="text-xl font-bold">{formatNumber(meta.stats.totalCards)}</p>
          </div>
          <div className="col-span-2 bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted">Est. Value</p>
            <p className="text-xl font-bold text-primary">
              {formatPriceRange(meta.stats.totalValueLow, meta.stats.totalValueHigh)}
            </p>
          </div>
        </div>
      )}

      {/* Filters — paid users only */}
      {!isFree && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-transparent"
          />
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm bg-transparent focus:outline-none focus:border-primary"
          >
            <option value="">All Sports</option>
            {SUPPORTED_SPORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort — paid users only */}
      {!isFree && (
        <div className="flex gap-1.5">
          {[
            { value: 'date', label: 'Recent' },
            { value: 'name', label: 'Name' },
            { value: 'value', label: 'Value' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortBy === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-border text-slate-300 hover:bg-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
          {error.includes('Pro') && (
            <Link
              href="/pricing"
              className="text-sm text-primary font-semibold hover:underline mt-1 inline-block"
            >
              View Plans →
            </Link>
          )}
        </div>
      )}

      {/* Initial loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted-light rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted-light rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-muted-light rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold text-sm mb-1">No Saved Cards Yet</h3>
          <p className="text-xs text-muted mb-4">
            Scan your cards and tap Save to build your collection.
          </p>
          <Link href="/scan" className="text-sm text-primary font-semibold hover:underline">
            Start Scanning →
          </Link>
        </div>
      )}

      {/* Hint */}
      {!isLoading && cards.length > 0 && (
        <p className="text-[10px] text-muted text-center">
          Tap a card for details · Swipe left to remove
        </p>
      )}

      {/* Card list */}
      {!isLoading && cards.length > 0 && (
        <div className="space-y-2">
          {cards.map((card) => (
            <SwipeableCard
              key={card.id}
              cardId={card.id}
              onDelete={async () => handleDeleteCard(card.id)}
              onTap={() => router.push(`/collection/${card.id}`)}
            >
              <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 active:bg-muted-light cursor-pointer">
                {card.image_path ? (
                  <img
                    src={getCardImageUrl(card.image_path)!}
                    alt={card.player_name}
                    className="w-10 h-14 object-cover rounded-lg border border-border shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-14 bg-muted-light rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-muted">{card.sport}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold truncate">{card.player_name}</p>
                    {card.mint_id && (
                      <span className="text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded-full shrink-0">
                        {formatMintId(card.mint_id)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {[
                      card.card_year && card.card_year !== 'unknown' ? card.card_year : '',
                      card.card_set && card.card_set !== 'unknown' ? card.card_set : '',
                      card.card_number && card.card_number !== 'unknown' ? `#${card.card_number}` : '',
                    ].filter(Boolean).join(' ')}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs font-bold text-primary">
                    {formatPriceRange(card.estimated_value_low, card.estimated_value_high)}
                  </p>
                  {card.estimated_psa_grade_low != null && card.estimated_psa_grade_high != null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-900/30 text-green-400">
                      {formatGradeRange(card.estimated_psa_grade_low, card.estimated_psa_grade_high)}
                    </span>
                  )}
                  {!card.estimated_psa_grade_low && card.psa_recommendation && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        card.psa_recommendation === 'yes'
                          ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/60'
                          : card.psa_recommendation === 'maybe'
                          ? 'bg-amber-900/40 text-amber-400 border-amber-800/60'
                          : 'bg-red-900/40 text-red-400 border-red-800/60'
                      }`}
                    >
                      PSA: {card.psa_recommendation === 'yes' ? 'Yes' : card.psa_recommendation === 'maybe' ? 'Maybe' : 'No'}
                    </span>
                  )}
                </div>
              </div>
            </SwipeableCard>
          ))}

          {/* Free tier upgrade CTA */}
          {isFree && (
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-5 text-center text-white shadow-md shadow-primary/10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-base mb-1">Unlock Your Full Collection</h3>
              <p className="text-xs text-white/80 mb-3">
                Save unlimited cards, track values, and build your collection with Pro.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-white text-primary font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
              >
                View Plans
              </Link>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* End of list */}
          {!hasMore && !isLoadingMore && cards.length >= PAGE_SIZE && (
            <p className="text-[10px] text-muted text-center py-3">All cards loaded</p>
          )}
        </div>
      )}

      {/* Upgrade CTA for empty-state free users */}
      {!isLoading && isFree && cards.length === 0 && !error && (
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-5 text-center text-white shadow-md shadow-primary/10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-bold text-base mb-1">Unlock Your Full Collection</h3>
          <p className="text-xs text-white/80 mb-3">
            Save unlimited cards, track values, and build your collection with Pro.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-primary font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
