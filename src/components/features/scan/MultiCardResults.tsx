'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CardResult, GridLayout } from '@/types/scan';
import CardResultCard from './CardResultCard';
import ScanDrawer from './ScanDrawer';
import { DISCLAIMER_TEXT } from '@/lib/constants';

interface MultiCardResultsProps {
  cards: CardResult[];
  imageDataUrl?: string;
  gridLayout?: GridLayout;
  onSaveToCollection?: (cardId: string) => void;
  onSaveAll?: () => Promise<void>;
  savedCards?: Set<string>;
  isFree?: boolean;
}

export default function MultiCardResults({ cards, imageDataUrl, gridLayout, onSaveToCollection, onSaveAll, savedCards, isFree }: MultiCardResultsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const yesCount = cards.filter((c) => c.psaRecommendation === 'yes').length;
  const maybeCount = cards.filter((c) => c.psaRecommendation === 'maybe').length;
  const allSaved = savedCards ? cards.every((c) => savedCards.has(c.id)) : false;
  const savedCount = savedCards ? cards.filter((c) => savedCards.has(c.id)).length : 0;

  const handleSaveAll = async () => {
    if (!onSaveAll || allSaved || isSavingAll) return;
    setIsSavingAll(true);
    try {
      await onSaveAll();
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">Results</h2>
          <span className="text-sm text-muted">{cards.length} card{cards.length !== 1 ? 's' : ''} found</span>
        </div>
        <div className="flex gap-3">
          {yesCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <span className="text-xs font-semibold">{yesCount} to grade</span>
            </div>
          )}
          {maybeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
              <span className="text-xs font-semibold">{maybeCount} maybe</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Results */}
      <div className="space-y-3">
        {cards.map((card) => (
          <CardResultCard
            key={card.id}
            card={card}
            imageDataUrl={imageDataUrl}
            gridLayout={gridLayout}
            onSaveToCollection={onSaveToCollection}
            isSaved={savedCards?.has(card.id)}
          />
        ))}
      </div>

      {/* Upgrade CTA for free users */}
      {isFree && (
        <Link
          href="/pricing"
          className="block bg-gradient-to-r from-primary to-blue-600 rounded-xl p-4 text-white text-center shadow-sm"
        >
          <p className="text-sm font-bold">Upgrade to Save Cards</p>
          <p className="text-xs text-white/80 mt-0.5">
            Pro members can save cards to their collection and track values over time.
          </p>
        </Link>
      )}

      {/* Save All / All Saved — paid users only */}
      {!isFree && onSaveAll && (
        <button
          onClick={handleSaveAll}
          disabled={allSaved || isSavingAll}
          className={`w-full font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${
            allSaved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
              : 'bg-secondary text-white hover:opacity-90 shadow-sm'
          }`}
        >
          {allSaved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All {cards.length} Cards Saved
            </>
          ) : isSavingAll ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Save All {cards.length} Cards
              {savedCount > 0 && ` (${savedCount} saved)`}
            </>
          )}
        </button>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
        </p>
      </div>

      {/* New Scan Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl shadow-sm hover:bg-primary-dark transition-colors text-base"
      >
        New Scan
      </button>

      {/* Scan Drawer */}
      <ScanDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
