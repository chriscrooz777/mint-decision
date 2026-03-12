'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_SPORTS } from '@/lib/constants';
import { formatPriceRange, formatNumber, formatMintId, formatGradeRange } from '@/lib/utils/format';
import { Sport } from '@/types/scan';
import Link from 'next/link';
import SwipeableCard from '@/components/features/collection/SwipeableCard';

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
  created_at: string;
}

interface CollectionResponse {
  cards: CollectionCardData[];
  total: number;
  stats: {
    totalCards: number;
    totalValueLow: number;
    totalValueHigh: number;
  };
}

export default function CollectionPage() {
  const router = useRouter();
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const fetchCollection = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (sportFilter) params.set('sport', sportFilter);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/collection?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load collection');
      }
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  }, [search, sportFilter, sortBy]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    try {
      const res = await fetch(`/api/collection/${cardId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete card');
      }
      // Optimistic removal from state
      setData((prev) => {
        if (!prev) return prev;
        const filteredCards = prev.cards.filter((c) => c.id !== cardId);
        const deletedCard = prev.cards.find((c) => c.id === cardId);
        return {
          ...prev,
          cards: filteredCards,
          total: prev.total - 1,
          stats: {
            totalCards: prev.stats.totalCards - 1,
            totalValueLow: prev.stats.totalValueLow - (deletedCard?.estimated_value_low || 0),
            totalValueHigh: prev.stats.totalValueHigh - (deletedCard?.estimated_value_high || 0),
          },
        };
      });
    } catch {
      // Re-fetch to restore state on error
      fetchCollection();
    }
  }, [fetchCollection]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My Collection</h1>
        <p className="text-muted text-sm mt-1">
          Your saved cards and estimated values
        </p>
      </div>

      {/* Stats */}
      {data?.stats && data.stats.totalCards > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted">Total Cards</p>
            <p className="text-xl font-bold">{formatNumber(data.stats.totalCards)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted">Est. Value</p>
            <p className="text-xl font-bold text-primary">
              {formatPriceRange(data.stats.totalValueLow, data.stats.totalValueHigh)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
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

      {/* Sort */}
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
                : 'bg-muted-light text-muted hover:bg-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
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

      {/* Loading */}
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
      {!isLoading && data?.cards.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-muted-light rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold text-sm mb-1">No cards yet</h3>
          <p className="text-xs text-muted mb-4">
            Scan your cards and save them to build your collection.
          </p>
          <Link
            href="/scan"
            className="text-sm text-primary font-semibold hover:underline"
          >
            Start Scanning →
          </Link>
        </div>
      )}

      {/* Hint */}
      {!isLoading && data?.cards && data.cards.length > 0 && (
        <p className="text-[10px] text-muted text-center">
          Tap a card for details · Swipe left to delete
        </p>
      )}

      {/* Card list */}
      {!isLoading && data?.cards && data.cards.length > 0 && (
        <div className="space-y-2">
          {data.cards.map((card) => (
            <SwipeableCard
              key={card.id}
              cardId={card.id}
              onDelete={async () => handleDeleteCard(card.id)}
              onTap={() => router.push(`/collection/${card.id}`)}
            >
              <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 active:bg-muted-light cursor-pointer">
                <div className="w-10 h-10 bg-muted-light rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">{card.sport}</span>
                </div>
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
                  {/* Deep eval: show PSA grade in green lozenge */}
                  {card.estimated_psa_grade_low != null && card.estimated_psa_grade_high != null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700">
                      {formatGradeRange(card.estimated_psa_grade_low, card.estimated_psa_grade_high)}
                    </span>
                  )}
                  {/* Multi scan: show PSA recommendation lozenge */}
                  {!card.estimated_psa_grade_low && card.psa_recommendation && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        card.psa_recommendation === 'yes'
                          ? 'bg-green-100 text-green-700'
                          : card.psa_recommendation === 'maybe'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      PSA: {card.psa_recommendation === 'yes' ? 'Yes' : card.psa_recommendation === 'maybe' ? 'Maybe' : 'No'}
                    </span>
                  )}
                </div>
              </div>
            </SwipeableCard>
          ))}
        </div>
      )}
    </div>
  );
}
