'use client';

import { useState } from 'react';
import { CardResult, GridLayout } from '@/types/scan';
import { formatPriceRange, formatMintId } from '@/lib/utils/format';
import WhyExplanation from './WhyExplanation';
import CroppedCardThumbnail from './CroppedCardThumbnail';

interface CardResultCardProps {
  card: CardResult;
  imageDataUrl?: string;
  gridLayout?: GridLayout;
  onSaveToCollection?: (cardId: string) => void;
  isSaved?: boolean;
}

const recommendationLabel: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  maybe: 'Maybe',
};

const recommendationColor: Record<string, string> = {
  yes: 'text-emerald-600',
  no: 'text-red-500',
  maybe: 'text-amber-500',
};

export default function CardResultCard({ card, imageDataUrl, gridLayout, onSaveToCollection, isSaved }: CardResultCardProps) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      {/* Top section: info + thumbnail */}
      <div className="flex gap-3">
        {/* Left: card info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Card header */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">{card.playerName}</h3>
              {card.mintId && (
                <span className="text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded-full shrink-0">
                  {formatMintId(card.mintId)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted truncate">
              {[
                card.cardYear && card.cardYear !== 'unknown' ? card.cardYear : '',
                card.cardSet && card.cardSet !== 'unknown' ? card.cardSet : '',
                card.cardNumber && card.cardNumber !== 'unknown' ? `#${card.cardNumber}` : '',
              ].filter(Boolean).join(' ')}
            </p>
          </div>

          {/* Details */}
          <div className="flex items-center gap-2 flex-wrap">
            {card.sport && card.sport !== 'unknown' && (
              <span className="text-xs bg-muted-light text-muted font-semibold px-2 py-0.5 rounded-full">
                {card.sport}
              </span>
            )}
            {card.manufacturer && card.manufacturer !== 'unknown' && (
              <span className="text-xs bg-muted-light text-muted font-semibold px-2 py-0.5 rounded-full">
                {card.manufacturer}
              </span>
            )}
            {card.confidence !== 'high' && (
              <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                {card.confidence} confidence
              </span>
            )}
          </div>

          {/* Estimated Raw Value */}
          <div>
            <p className="text-xs text-muted">Estimated Raw Value</p>
            <p className="text-sm font-bold text-primary">
              {formatPriceRange(card.rawPriceLow, card.rawPriceHigh)}
            </p>
          </div>

          {/* PSA Recommendation */}
          <div>
            <p className="text-xs text-muted">PSA Recommendation</p>
            <p className={`text-sm font-bold ${recommendationColor[card.psaRecommendation]}`}>
              {recommendationLabel[card.psaRecommendation]}
            </p>
          </div>
        </div>

        {/* Right: thumbnail */}
        {imageDataUrl && gridLayout && card.gridPosition && (
          <CroppedCardThumbnail
            imageDataUrl={imageDataUrl}
            gridLayout={gridLayout}
            gridPosition={card.gridPosition}
            alt={card.playerName}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="text-xs text-primary font-semibold hover:underline"
        >
          {showWhy ? 'Hide' : 'Why?'}
        </button>
        {onSaveToCollection && (
          <button
            onClick={() => !isSaved && onSaveToCollection(card.id)}
            disabled={isSaved}
            className={`text-xs font-semibold ml-auto flex items-center gap-1 ${
              isSaved
                ? 'text-emerald-600 cursor-default'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {isSaved ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Save
              </>
            )}
          </button>
        )}
      </div>

      {/* Why explanation */}
      {showWhy && (
        <WhyExplanation card={card} />
      )}
    </div>
  );
}
