'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CardResult, GridLayout } from '@/types/scan';
import CardResultCard from './CardResultCard';
import { DISCLAIMER_TEXT } from '@/lib/constants';

interface MultiCardResultsProps {
  cards: CardResult[];
  imageDataUrl?: string;
  gridLayout?: GridLayout;
  onSaveToCollection?: (cardId: string) => void;
  onUnsaveFromCollection?: (cardId: string) => void;
  onSaveAll?: () => Promise<void>;
  savedCards?: Set<string>;
  isFree?: boolean;
}

export default function MultiCardResults({ cards, imageDataUrl, gridLayout, onSaveToCollection, onUnsaveFromCollection, onSaveAll, savedCards, isFree }: MultiCardResultsProps) {
  const [isSavingAll, setIsSavingAll] = useState(false);
  const yesCount = cards.filter((c) => c.psaRecommendation === 'yes').length;
  const maybeCount = cards.filter((c) => c.psaRecommendation === 'maybe').length;
  const allSaved = savedCards ? cards.every((c) => savedCards.has(c.id)) : false;
  const savedCount = savedCards ? cards.filter((c) => savedCards.has(c.id)).length : 0;

  const [isRemovingAll, setIsRemovingAll] = useState(false);

  const handleSaveAll = async () => {
    if (!onSaveAll || allSaved || isSavingAll) return;
    setIsSavingAll(true);
    try {
      await onSaveAll();
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleRemoveAll = async () => {
    if (!onUnsaveFromCollection || isRemovingAll) return;
    setIsRemovingAll(true);
    try {
      const saved = cards.filter((c) => savedCards?.has(c.id));
      for (const card of saved) {
        await onUnsaveFromCollection(card.id);
      }
    } finally {
      setIsRemovingAll(false);
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
            onUnsaveFromCollection={onUnsaveFromCollection}
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

      {/* Primary CTAs — Done + Select All */}
      <div className="flex gap-3">
        {/* Done — navigates to collection */}
        <Link
          href="/collection"
          className="flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl text-sm border border-border bg-card hover:bg-border transition-colors text-foreground"
        >
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Done
        </Link>

        {/* Select All / Remove All — paid users; or disabled prompt for free */}
        {isFree ? (
          <Link
            href="/pricing"
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl text-sm bg-secondary text-white hover:opacity-90 shadow-sm transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Select All
          </Link>
        ) : allSaved ? (
          <button
            onClick={handleRemoveAll}
            disabled={isRemovingAll}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl text-sm bg-red-950/30 text-danger border border-red-800/50 hover:bg-red-950/50 transition-colors"
          >
            {isRemovingAll ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Removing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove All
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll || !onSaveAll}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl text-sm bg-secondary text-white hover:opacity-90 shadow-sm transition-opacity disabled:opacity-50"
          >
            {isSavingAll ? (
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
                Select All
                {savedCount > 0 && (
                  <span className="text-white/70 font-normal">({savedCount}/{cards.length})</span>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3">
        <p className="text-xs text-amber-400 leading-relaxed">
          <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
        </p>
      </div>

    </div>
  );
}
