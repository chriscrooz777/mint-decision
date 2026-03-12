'use client';

import { useState } from 'react';
import { CardResult, GridLayout } from '@/types/scan';
import CardResultCard from './CardResultCard';
import ScanDrawer from './ScanDrawer';
import { DISCLAIMER_TEXT } from '@/lib/constants';

interface MultiCardResultsProps {
  cards: CardResult[];
  imageDataUrl?: string;
  gridLayout?: GridLayout;
  onSaveToCollection?: (cardId: string) => void;
  savedCards?: Set<string>;
}

export default function MultiCardResults({ cards, imageDataUrl, gridLayout, onSaveToCollection, savedCards }: MultiCardResultsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const yesCount = cards.filter((c) => c.psaRecommendation === 'yes').length;
  const maybeCount = cards.filter((c) => c.psaRecommendation === 'maybe').length;

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
