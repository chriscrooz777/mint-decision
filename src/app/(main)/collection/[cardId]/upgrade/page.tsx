'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ImageUploader from '@/components/features/scan/ImageUploader';
import ScanLoadingState from '@/components/features/scan/ScanLoadingState';
import Button from '@/components/ui/Button';
import { formatMintId } from '@/lib/utils/format';

interface CardIdentity {
  id: string;
  mintId: number;
  playerName: string;
  cardYear: string;
  cardSet: string;
  cardNumber: string;
  sport: string;
  manufacturer: string;
}

export default function UpgradeCardPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<CardIdentity | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(true);
  const [frontBase64, setFrontBase64] = useState<string | null>(null);
  const [frontMimeType, setFrontMimeType] = useState<string | null>(null);
  const [backBase64, setBackBase64] = useState<string | null>(null);
  const [backMimeType, setBackMimeType] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing card data
  useEffect(() => {
    async function fetchCard() {
      try {
        const res = await fetch(`/api/collection/${cardId}`);
        if (!res.ok) throw new Error('Failed to load card');
        const data = await res.json();

        // If already a Deep Evaluation, redirect back
        if (data.scanType === 'single' || data.card.centeringScore !== null) {
          router.replace(`/collection/${cardId}`);
          return;
        }

        setCard({
          id: data.card.id,
          mintId: data.card.mintId,
          playerName: data.card.playerName,
          cardYear: data.card.cardYear,
          cardSet: data.card.cardSet,
          cardNumber: data.card.cardNumber,
          sport: data.card.sport,
          manufacturer: data.card.manufacturer,
        });
      } catch {
        setError('Failed to load card details');
      } finally {
        setIsLoadingCard(false);
      }
    }

    fetchCard();
  }, [cardId, router]);

  const handleFrontReady = useCallback((base64: string, mimeType: string) => {
    setFrontBase64(base64);
    setFrontMimeType(mimeType);
  }, []);

  const handleBackReady = useCallback((base64: string, mimeType: string) => {
    setBackBase64(base64);
    setBackMimeType(mimeType);
  }, []);

  const handleUpgrade = async () => {
    if (!frontBase64 || !frontMimeType) return;

    setIsUpgrading(true);
    setError(null);

    try {
      // Call upgrade API
      const res = await fetch('/api/scan/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          imageFront: frontBase64,
          mimeTypeFront: frontMimeType,
          imageBack: backBase64 || undefined,
          mimeTypeBack: backMimeType || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upgrade failed. Please try again.');
      }

      // Images are uploaded server-side by the upgrade API route.
      // Redirect to the card detail page (now showing Deep Evaluation)
      router.push(`/collection/${cardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsUpgrading(false);
    }
  };

  // Loading card data
  if (isLoadingCard) {
    return (
      <div className="space-y-6">
        <div className="h-4 bg-muted-light rounded w-24 animate-pulse" />
        <div className="h-8 bg-muted-light rounded w-3/4 animate-pulse" />
        <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
          <div className="h-6 bg-muted-light rounded w-1/2 mb-2" />
          <div className="h-4 bg-muted-light rounded w-1/3" />
        </div>
      </div>
    );
  }

  // Running evaluation
  if (isUpgrading) {
    return <ScanLoadingState type="single" />;
  }

  // Error loading card
  if (!card) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push(`/collection/${cardId}`)}
          className="text-sm text-muted hover:text-foreground flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Card
        </button>
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center">
          <p className="text-sm text-red-400">{error || 'Card not found'}</p>
        </div>
      </div>
    );
  }

  const subtitle = [
    card.cardYear && card.cardYear !== 'unknown' ? card.cardYear : '',
    card.cardSet && card.cardSet !== 'unknown' ? card.cardSet : '',
    card.cardNumber && card.cardNumber !== 'unknown' ? `#${card.cardNumber}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.push(`/collection/${cardId}`)}
        className="text-sm text-muted hover:text-foreground flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Card
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Upgrade to Deep Evaluation</h1>
        <p className="text-muted text-sm mt-1">
          Get detailed PSA-style grading for this card.
        </p>
      </div>

      {/* Card identity context */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{card.playerName}</h2>
          {card.mintId && (
            <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full shrink-0">
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
        </div>
      </div>

      {/* Front image (required) */}
      <ImageUploader
        label="Front of card"
        hint="Required — capture a clear, well-lit photo of the front"
        onImageReady={handleFrontReady}
        onClear={() => {
          setFrontBase64(null);
          setFrontMimeType(null);
        }}
      />

      {/* Back image (optional) */}
      <ImageUploader
        label="Back of card"
        hint="Recommended for better centering and condition accuracy"
        optional
        onImageReady={handleBackReady}
        onClear={() => {
          setBackBase64(null);
          setBackMimeType(null);
        }}
      />

      {/* Back image tip */}
      {!backBase64 && frontBase64 && (
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-300">
            Adding the back of the card improves grading accuracy, especially for centering assessment.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleUpgrade}
        fullWidth
        size="lg"
        disabled={!frontBase64}
      >
        Evaluate Card
      </Button>
    </div>
  );
}
