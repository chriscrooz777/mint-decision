'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPriceRange, formatMintId, formatGradeRange } from '@/lib/utils/format';
import { DISCLAIMER_TEXT, PRICING_SOURCES } from '@/lib/constants';
import GradingBreakdown from '@/components/features/scan/GradingBreakdown';

interface CardDetail {
  id: string;
  mintId: number;
  scanId: string;
  cardIndex: number;
  playerName: string;
  cardYear: string;
  cardSet: string;
  cardNumber: string;
  sport: string;
  manufacturer: string;
  conditionSummary: string | null;
  rawPriceLow: number;
  rawPriceHigh: number;
  psaRecommendation: string | null;
  psaRecommendationReason: string | null;
  centeringScore: number | null;
  cornersScore: number | null;
  edgesScore: number | null;
  surfaceScore: number | null;
  estimatedPsaGradeLow: number | null;
  estimatedPsaGradeHigh: number | null;
  gradingExplanation: string | null;
  gradeImprovementTips: string | null;
  createdAt: string;
}

const recommendationLabel: Record<string, string> = {
  yes: 'Yes — Worth Grading',
  no: 'No — Skip Grading',
  maybe: 'Maybe — Consider It',
};

const recommendationColor: Record<string, string> = {
  yes: 'text-emerald-600',
  no: 'text-red-500',
  maybe: 'text-amber-500',
};

const recommendationBg: Record<string, string> = {
  yes: 'bg-emerald-50 border-emerald-200',
  no: 'bg-red-50 border-red-200',
  maybe: 'bg-amber-50 border-amber-200',
};

export default function CollectionCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<CardDetail | null>(null);
  const [scanType, setScanType] = useState<string>('multi');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCard() {
      try {
        const res = await fetch(`/api/collection/${cardId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load card');
        }
        const data = await res.json();
        setCard(data.card);
        setScanType(data.scanType);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load card');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCard();
  }, [cardId]);

  const handleDelete = async () => {
    if (!confirm('Delete this card from your collection?')) return;
    try {
      const res = await fetch(`/api/collection/${cardId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/collection');
      }
    } catch {
      // Ignore — user stays on page
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted-light rounded w-24 animate-pulse" />
        <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
          <div className="h-6 bg-muted-light rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted-light rounded w-1/2 mb-4" />
          <div className="h-3 bg-muted-light rounded w-1/3" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
          <div className="h-4 bg-muted-light rounded w-1/2 mb-3" />
          <div className="h-20 bg-muted-light rounded" />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="space-y-4">
        <Link
          href="/collection"
          className="text-sm text-muted hover:text-foreground flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm text-red-700">{error || 'Card not found'}</p>
        </div>
      </div>
    );
  }

  const isSingleScan = scanType === 'single';

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <Link
        href="/collection"
        className="text-sm text-muted hover:text-foreground flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Collection
      </Link>

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

      {/* PSA Grade Estimate (single scan only) */}
      {isSingleScan && card.estimatedPsaGradeLow != null && card.estimatedPsaGradeHigh != null && (
        <div className="bg-primary-light rounded-2xl p-5 text-center">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">
            Estimated PSA Grade
          </p>
          <p className="text-3xl font-extrabold text-primary">
            {formatGradeRange(card.estimatedPsaGradeLow, card.estimatedPsaGradeHigh)}
          </p>
        </div>
      )}

      {/* Grading Breakdown (single scan only) */}
      {isSingleScan &&
        card.centeringScore != null &&
        card.cornersScore != null &&
        card.edgesScore != null &&
        card.surfaceScore != null && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <GradingBreakdown
              centering={{ score: card.centeringScore, notes: '' }}
              corners={{ score: card.cornersScore, notes: '' }}
              edges={{ score: card.edgesScore, notes: '' }}
              surface={{ score: card.surfaceScore, notes: '' }}
            />
          </div>
        )}

      {/* Grading Explanation (single scan) */}
      {isSingleScan && (card.gradingExplanation || card.gradeImprovementTips) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          {card.gradingExplanation && (
            <div>
              <h3 className="font-bold text-sm mb-1">Grade Analysis</h3>
              <p className="text-xs text-muted leading-relaxed">{card.gradingExplanation}</p>
            </div>
          )}
          {card.gradeImprovementTips && (
            <div>
              <h3 className="font-bold text-sm mb-1">What Would Change the Grade</h3>
              <p className="text-xs text-muted leading-relaxed">{card.gradeImprovementTips}</p>
            </div>
          )}
        </div>
      )}

      {/* PSA Recommendation (multi scan) */}
      {!isSingleScan && card.psaRecommendation && (
        <div className={`rounded-2xl border p-4 ${recommendationBg[card.psaRecommendation] || 'bg-muted-light border-border'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-muted">
            PSA Recommendation
          </p>
          <p className={`text-lg font-bold ${recommendationColor[card.psaRecommendation] || 'text-foreground'}`}>
            {recommendationLabel[card.psaRecommendation] || card.psaRecommendation}
          </p>
          {card.psaRecommendationReason && (
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {card.psaRecommendationReason}
            </p>
          )}
        </div>
      )}

      {/* Condition Summary (multi scan) */}
      {!isSingleScan && card.conditionSummary && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-bold text-sm mb-1">Condition Summary</h3>
          <p className="text-xs text-muted leading-relaxed">{card.conditionSummary}</p>
        </div>
      )}

      {/* Value Estimate */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-bold text-sm mb-3">Value Estimate</h3>
        <div className="bg-muted-light rounded-xl p-4 text-center">
          <p className="text-xs text-muted mb-1">Estimated Raw Value</p>
          <p className="text-lg font-bold text-primary">
            {formatPriceRange(card.rawPriceLow, card.rawPriceHigh)}
          </p>
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

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="w-full font-semibold py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Card
      </button>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
