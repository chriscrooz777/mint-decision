'use client';

import Link from 'next/link';
import { SingleCardResult } from '@/types/scan';
import GradingBreakdown from './GradingBreakdown';
import { formatPriceRange, formatGradeRange, formatMintId } from '@/lib/utils/format';
import { DISCLAIMER_TEXT, PRICING_SOURCES } from '@/lib/constants';

interface SingleCardResultsProps {
  card: SingleCardResult;
  onSaveToCollection?: () => void;
  onUnsaveFromCollection?: () => void;
  isSaved?: boolean;
  isFree?: boolean;
}

export default function SingleCardResults({ card, onSaveToCollection, onUnsaveFromCollection, isSaved, isFree }: SingleCardResultsProps) {
  return (
    <div className="space-y-4">
      {/* Card Identity */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{card.playerName}</h2>
          {card.mintId && (
            <span className="text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full shrink-0">
              {formatMintId(card.mintId)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted">
          {[
            card.cardYear && card.cardYear !== 'unknown' ? card.cardYear : '',
            card.cardSet && card.cardSet !== 'unknown' ? card.cardSet : '',
            card.cardNumber && card.cardNumber !== 'unknown' ? `#${card.cardNumber}` : '',
          ].filter(Boolean).join(' ')}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {card.sport && card.sport !== 'unknown' && (
            <span className="text-xs bg-border text-slate-300 font-semibold px-2 py-0.5 rounded-full">
              {card.sport}
            </span>
          )}
          {card.manufacturer && card.manufacturer !== 'unknown' && (
            <span className="text-xs bg-border text-slate-300 font-semibold px-2 py-0.5 rounded-full">
              {card.manufacturer}
            </span>
          )}
        </div>
      </div>

      {/* PSA Grade Estimate */}
      <div className="bg-primary-light rounded-2xl p-5 text-center">
        <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide mb-1">
          Estimated PSA Grade
        </p>
        <p className="text-3xl font-extrabold text-white">
          {formatGradeRange(card.estimatedPsaGradeLow, card.estimatedPsaGradeHigh)}
        </p>
      </div>

      {/* Grading Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <GradingBreakdown
          centering={card.centering}
          corners={card.corners}
          edges={card.edges}
          surface={card.surface}
        />
      </div>

      {/* Grading Explanation */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm mb-1">Grade Analysis</h3>
          <p className="text-xs text-muted leading-relaxed">{card.gradingExplanation}</p>
        </div>
        <div>
          <h3 className="font-bold text-sm mb-1">What Would Change the Grade</h3>
          <p className="text-xs text-muted leading-relaxed">{card.gradeImprovementTips}</p>
        </div>
      </div>

      {/* Value Comparison */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-bold text-sm mb-3">Value Estimates</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted-light rounded-xl p-3 text-center">
            <p className="text-xs text-muted mb-1">Raw Value</p>
            <p className="text-sm font-bold">
              {formatPriceRange(card.rawPriceLow, card.rawPriceHigh)}
            </p>
          </div>
          <div className="bg-primary-light rounded-xl p-3 text-center">
            <p className="text-xs text-blue-200 mb-1">Graded Value</p>
            <p className="text-sm font-bold text-white">
              {card.gradedValueLow && card.gradedValueHigh
                ? formatPriceRange(card.gradedValueLow, card.gradedValueHigh)
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Sources */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-bold text-sm mb-2">Verify Pricing</h3>
        <div className="flex flex-wrap gap-2">
          {PRICING_SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-semibold bg-primary-light px-2.5 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              {source.name} ↗
            </a>
          ))}
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {isFree && (
        <Link
          href="/pricing"
          className="block w-full bg-gradient-to-r from-primary to-blue-600 rounded-xl p-4 text-white text-center shadow-sm"
        >
          <p className="text-sm font-bold">Upgrade to Save Cards</p>
          <p className="text-xs text-white/80 mt-0.5">
            Pro members can save cards to their collection and track values over time.
          </p>
        </Link>
      )}

      {/* Save to Collection — paid users only */}
      {!isFree && (
        isSaved ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-900/30 text-emerald-400 font-semibold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved to Collection
            </div>
            {onUnsaveFromCollection && (
              <button
                onClick={onUnsaveFromCollection}
                title="Remove from collection"
                className="py-3 px-4 rounded-xl bg-border text-slate-300 hover:text-danger hover:bg-red-950/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ) : onSaveToCollection ? (
          <button
            onClick={onSaveToCollection}
            className="w-full font-semibold py-3 rounded-xl bg-secondary text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Save to Collection
          </button>
        ) : null
      )}

      {/* Disclaimer */}
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3">
        <p className="text-xs text-amber-400 leading-relaxed">
          <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
