'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPriceRange, formatMintId, formatGradeRange } from '@/lib/utils/format';
import { DISCLAIMER_TEXT, PRICING_SOURCES } from '@/lib/constants';
import GradingBreakdown from '@/components/features/scan/GradingBreakdown';
import { getCardImageUrl } from '@/lib/supabase/storage';

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
  gradedValueLow: number | null;
  gradedValueHigh: number | null;
  imagePath: string | null;
  backImagePath: string | null;
  createdAt: string;
}

const recommendationLabel: Record<string, string> = {
  yes: 'Yes — Worth Grading',
  no: 'No — Skip Grading',
  maybe: 'Maybe — Consider It',
};

const recommendationColor: Record<string, string> = {
  yes: 'text-emerald-400',
  no: 'text-red-400',
  maybe: 'text-amber-400',
};

const recommendationBannerBg: Record<string, string> = {
  yes: 'bg-emerald-950/30',
  no: 'bg-red-950/30',
  maybe: 'bg-amber-950/30',
};

const recommendationBorder: Record<string, string> = {
  yes: 'border-emerald-800/50',
  no: 'border-red-800/50',
  maybe: 'border-amber-800/50',
};

export default function CollectionCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<CardDetail | null>(null);
  const [scanType, setScanType] = useState<string>('multi');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
    if (!confirm('Remove this card from your collection?')) return;
    try {
      const res = await fetch(`/api/collection/${cardId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/collection');
      }
    } catch {
      // Ignore — user stays on page
    }
  };

  // Loading skeleton — mirrors 4-zone layout
  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* Hero skeleton */}
        <div className="-mx-4 -mt-4 px-4 pb-6">
          <div className="h-4 bg-muted-light rounded w-20 animate-pulse mb-5 mt-4" />
          <div className="w-full h-52 bg-muted-light rounded-xl animate-pulse" />
          <div className="h-7 bg-muted-light rounded w-3/4 mt-4 animate-pulse" />
          <div className="h-4 bg-muted-light rounded w-1/2 mt-2 animate-pulse" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 bg-muted-light rounded-full w-12 animate-pulse" />
            <div className="h-5 bg-muted-light rounded-full w-16 animate-pulse" />
          </div>
        </div>
        {/* Grade card skeleton */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
          <div className="bg-primary-light/50 h-20 w-full" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-muted-light rounded w-full" />
            <div className="h-3 bg-muted-light rounded w-full" />
            <div className="h-3 bg-muted-light rounded w-full" />
            <div className="h-3 bg-muted-light rounded w-full" />
          </div>
        </div>
        {/* Value skeleton */}
        <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 bg-muted-light rounded w-28" />
            <div className="h-5 bg-muted-light rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
          Collection
        </Link>
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center">
          <p className="text-sm text-red-400">{error || 'Card not found'}</p>
        </div>
      </div>
    );
  }

  const isSingleScan = scanType === 'single';
  const frontUrl = getCardImageUrl(card.imagePath);
  const backUrl = getCardImageUrl(card.backImagePath);
  const hasMultipleImages = isSingleScan && !!frontUrl && !!backUrl;
  const currentImageUrl = imageIndex === 0 ? frontUrl : backUrl;

  const subtitle = [
    card.cardYear && card.cardYear !== 'unknown' ? card.cardYear : '',
    card.cardSet && card.cardSet !== 'unknown' ? card.cardSet : '',
    card.cardNumber && card.cardNumber !== 'unknown' ? `#${card.cardNumber}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-5">
      {/* ───────────── ZONE 1: Hero ───────────── */}
      <div className="-mx-4 -mt-4 px-4 pb-6 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
        {/* Back nav */}
        <Link
          href="/collection"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-5 pt-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Collection
        </Link>

        {/* Card image(s) */}
        {frontUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl!}
              alt={imageIndex === 0 ? `${card.playerName} front` : `${card.playerName} back`}
              className="w-full max-h-72 object-contain rounded-xl shadow-lg shadow-black/5"
            />
            {/* Front/Back toggle for Deep Evaluation */}
            {hasMultipleImages && (
              <>
                {/* Arrow buttons */}
                <button
                  onClick={() => setImageIndex(imageIndex === 0 ? 1 : 0)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm shadow flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setImageIndex(imageIndex === 0 ? 1 : 0)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm shadow flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setImageIndex(0)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      imageIndex === 0
                        ? 'bg-primary text-white'
                        : 'bg-border text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setImageIndex(1)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      imageIndex === 1
                        ? 'bg-primary text-white'
                        : 'bg-border text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* No-image placeholder */
          <div className="w-full h-44 bg-muted-light rounded-xl flex items-center justify-center">
            <svg className="w-12 h-12 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Card identity */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold leading-tight">{card.playerName}</h1>
            {card.mintId && (
              <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full shrink-0">
                {formatMintId(card.mintId)}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted mt-0.5">{subtitle}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {card.sport && card.sport !== 'unknown' && (
              <span className="text-[10px] bg-border text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                {card.sport}
              </span>
            )}
            {card.manufacturer && card.manufacturer !== 'unknown' && (
              <span className="text-[10px] bg-border text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                {card.manufacturer}
              </span>
            )}
            {/* Scan type badge */}
            {isSingleScan ? (
              <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Deep Evaluation
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-300 bg-border px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Quick Scan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ───────────── ZONE 2: Grade Report ───────────── */}
      {isSingleScan ? (
        /* Deep Evaluation — PSA grade + score bars + analysis */
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Grade banner */}
          {card.estimatedPsaGradeLow != null && card.estimatedPsaGradeHigh != null && (
            <div className="bg-primary-light px-5 pt-5 pb-4 text-center">
              <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">
                Estimated PSA Grade
              </p>
              <p className="text-3xl font-extrabold text-primary">
                {formatGradeRange(card.estimatedPsaGradeLow, card.estimatedPsaGradeHigh)}
              </p>
            </div>
          )}

          <div className="px-5 pt-4 pb-5">
            {/* Score bars */}
            {card.centeringScore != null &&
              card.cornersScore != null &&
              card.edgesScore != null &&
              card.surfaceScore != null && (
                <GradingBreakdown
                  centering={{ score: card.centeringScore, notes: '' }}
                  corners={{ score: card.cornersScore, notes: '' }}
                  edges={{ score: card.edgesScore, notes: '' }}
                  surface={{ score: card.surfaceScore, notes: '' }}
                  hideTitle
                />
              )}

            {/* Analysis */}
            {(card.gradingExplanation || card.gradeImprovementTips) && (
              <>
                <div className="border-t border-border my-4" />
                {card.gradingExplanation && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                      Analysis
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      {card.gradingExplanation}
                    </p>
                  </div>
                )}
                {card.gradeImprovementTips && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                      Improvement Tips
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      {card.gradeImprovementTips}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Quick Scan — Recommendation verdict + condition summary */
        card.psaRecommendation && (
          <div
            className={`rounded-2xl border overflow-hidden ${
              recommendationBorder[card.psaRecommendation] || 'border-border'
            }`}
          >
            {/* Recommendation banner */}
            <div
              className={`px-5 pt-5 pb-4 text-center ${
                recommendationBannerBg[card.psaRecommendation] || 'bg-muted-light'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                PSA Recommendation
              </p>
              <p
                className={`text-2xl font-bold ${
                  recommendationColor[card.psaRecommendation] || 'text-foreground'
                }`}
              >
                {recommendationLabel[card.psaRecommendation] || card.psaRecommendation}
              </p>
            </div>

            <div className="bg-card px-5 pt-4 pb-5">
              {card.psaRecommendationReason && (
                <p className="text-xs text-muted leading-relaxed">
                  {card.psaRecommendationReason}
                </p>
              )}

              {card.conditionSummary && (
                <>
                  <div className="border-t border-border my-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                    Condition Summary
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {card.conditionSummary}
                  </p>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* ───────────── Upgrade CTA (Quick Scan only) ───────────── */}
      {!isSingleScan && (
        <Link
          href={`/collection/${cardId}/upgrade`}
          className="block bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-4 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Upgrade to Deep Evaluation</p>
              <p className="text-xs text-white/80 mt-0.5">
                Get PSA grade estimates, scores, and detailed analysis
              </p>
            </div>
            <svg className="w-5 h-5 text-white/70 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* ───────────── ZONE 3: Value & Market ───────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted font-medium">Estimated Raw Value</p>
          <p className="text-lg font-bold text-primary">
            {formatPriceRange(card.rawPriceLow, card.rawPriceHigh)}
          </p>
        </div>
        {/* PSA Graded Value — Deep Evaluation only */}
        {isSingleScan && card.gradedValueLow != null && card.gradedValueHigh != null && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted font-medium">Estimated PSA Graded Value</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatPriceRange(card.gradedValueLow, card.gradedValueHigh)}
            </p>
          </div>
        )}
        <div className="border-t border-border my-3" />
        <p className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-2">
          Verify Pricing
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRICING_SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary font-semibold bg-primary-light px-2 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              {source.name} ↗
            </a>
          ))}
        </div>
      </div>

      {/* ───────────── ZONE 4: Footer ───────────── */}
      <div className="pt-2 pb-2 space-y-3">
        {/* Collapsible disclaimer */}
        <div className="text-center">
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            className="inline-flex items-center gap-1.5 text-[10px] text-muted hover:text-foreground transition-colors mx-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI-generated estimates
            <svg
              className={`w-3 h-3 transition-transform ${showDisclaimer ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDisclaimer && (
            <p className="text-[10px] text-muted leading-relaxed mt-2 px-2">
              {DISCLAIMER_TEXT}
            </p>
          )}
        </div>

        {/* Delete — subtle text link */}
        <div className="text-center">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium transition-colors py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove from collection
          </button>
        </div>
      </div>
    </div>
  );
}
