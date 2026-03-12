'use client';

import { SingleCardResult } from '@/types/scan';
import GradingBreakdown from './GradingBreakdown';
import { formatPriceRange, formatGradeRange, formatMintId } from '@/lib/utils/format';
import { DISCLAIMER_TEXT, PRICING_SOURCES } from '@/lib/constants';

interface SingleCardResultsProps {
  card: SingleCardResult;
  onSaveToCollection?: () => void;
  isSaved?: boolean;
}

export default function SingleCardResults({ card, onSaveToCollection, isSaved }: SingleCardResultsProps) {
  return (
    <div className="space-y-4">
      {/* Card Identity */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{card.playerName}</h2>
          {card.mintId && (
            <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full shrink-0">
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
            <span className="text-xs bg-muted-light text-muted font-semibold px-2 py-0.5 rounded-full">
              {card.sport}
            </span>
          )}
          {card.manufacturer && card.manufacturer !== 'unknown' && (
            <span className="text-xs bg-muted-light text-muted font-semibold px-2 py-0.5 rounded-full">
              {card.manufacturer}
            </span>
          )}
        </div>
      </div>

      {/* PSA Grade Estimate */}
      <div className="bg-primary-light rounded-2xl p-5 text-center">
        <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">
          Estimated PSA Grade
        </p>
        <p className="text-3xl font-extrabold text-primary">
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
            <p className="text-xs text-primary mb-1">Graded Value</p>
            <p className="text-sm font-bold text-primary">
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

      {/* Save to Collection */}
      {onSaveToCollection && (
        <button
          onClick={() => !isSaved && onSaveToCollection()}
          disabled={isSaved}
          className={`w-full font-semibold py-3 rounded-xl transition-opacity flex items-center justify-center gap-2 ${
            isSaved
              ? 'bg-emerald-100 text-emerald-700 cursor-default'
              : 'bg-secondary text-white hover:opacity-90'
          }`}
        >
          {isSaved ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved to Collection
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Save to Collection
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
    </div>
  );
}
