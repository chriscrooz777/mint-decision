'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/features/scan/ImageUploader';
import ScanLoadingState from '@/components/features/scan/ScanLoadingState';
import MultiCardResults from '@/components/features/scan/MultiCardResults';
import Button from '@/components/ui/Button';
import { useScanStore } from '@/stores/scanStore';

export default function MultiScanPage() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [showBackUploader, setShowBackUploader] = useState(false);
  const [backBase64, setBackBase64] = useState<string | null>(null);
  const [backMimeType, setBackMimeType] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState<string>('free');
  const { isScanning, multiResults, gridLayout, originalImageDataUrl, error, startScan, setMultiResults, setScanError, reset } =
    useScanStore();
  const router = useRouter();

  const isFree = tier === 'free';

  // Clear stale results when navigating back to this page
  useEffect(() => {
    reset();
    setSavedCards(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user tier
  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setTier(data.tier);
        }
      } catch {
        // Default to free
      }
    }
    fetchTier();
  }, []);

  const handleSaveToCollection = useCallback(async (cardId: string) => {
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardResultId: cardId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to save card.');
        return;
      }

      setSavedCards((prev) => new Set(prev).add(cardId));
    } catch {
      alert('Failed to save card to collection.');
    }
  }, []);

  const handleUnsaveFromCollection = useCallback(async (cardId: string) => {
    try {
      const res = await fetch(`/api/collection/${cardId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to remove card.');
        return;
      }
      setSavedCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    } catch {
      alert('Failed to remove card from collection.');
    }
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!multiResults) return;
    const unsaved = multiResults.filter((c) => !savedCards.has(c.id));
    for (const card of unsaved) {
      await handleSaveToCollection(card.id);
    }
  }, [multiResults, savedCards, handleSaveToCollection]);

  const handleImageReady = useCallback((base64: string, mimeType: string) => {
    setImageBase64(base64);
    setImageMimeType(mimeType);
  }, []);

  const handleScan = async () => {
    if (!imageBase64 || !imageMimeType) return;

    startScan();

    try {
      const res = await fetch('/api/scan/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: imageMimeType,
          ...(showBackUploader && backBase64 && backMimeType
            ? { imageBack: backBase64, mimeTypeBack: backMimeType }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Scan failed. Please try again.');
      }

      const data = await res.json();
      // Build data URL from the original image for thumbnail cropping
      const dataUrl = `data:${imageMimeType};base64,${imageBase64}`;
      setMultiResults(data.scanId, data.cards, data.gridLayout, dataUrl);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const handleNewScan = () => {
    reset();
    setImageBase64(null);
    setImageMimeType(null);
    setShowBackUploader(false);
    setBackBase64(null);
    setBackMimeType(null);
  };

  // Loading state
  if (isScanning) {
    return <ScanLoadingState type="multi" />;
  }

  // Results state
  if (multiResults) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Scan Results</h1>
        <MultiCardResults
          cards={multiResults}
          imageDataUrl={originalImageDataUrl || undefined}
          gridLayout={gridLayout || undefined}
          onSaveToCollection={isFree ? undefined : handleSaveToCollection}
          onUnsaveFromCollection={isFree ? undefined : handleUnsaveFromCollection}
          onSaveAll={isFree ? undefined : handleSaveAll}
          onNewScan={handleNewScan}
          savedCards={savedCards}
          isFree={isFree}
        />
      </div>
    );
  }

  // Upload state
  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/scan')}
          className="text-sm text-muted hover:text-foreground mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Quick Scan</h1>
        <p className="text-muted text-sm mt-1">
          Take a photo of up to 9 cards to get instant identification and pricing.
        </p>
      </div>

      <ImageUploader
        label="Photograph your cards (fronts)"
        hint="Lay cards flat with good lighting. Supports 1-9 cards per photo."
        onImageReady={handleImageReady}
        onClear={() => {
          setImageBase64(null);
          setImageMimeType(null);
        }}
      />

      {/* Back image toggle */}
      <button
        onClick={() => {
          setShowBackUploader((prev) => {
            if (prev) {
              setBackBase64(null);
              setBackMimeType(null);
            }
            return !prev;
          });
        }}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors w-full"
      >
        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${showBackUploader ? 'bg-primary border-primary' : 'border-border'}`}>
          {showBackUploader ? (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </div>
        <span>Add back images <span className="text-muted/70">(optional — improves accuracy)</span></span>
      </button>

      {/* Back image uploader */}
      {showBackUploader && (
        <div className="space-y-2">
          <ImageUploader
            label="Photograph your cards (backs)"
            hint="Same layout as the fronts — same rows and columns."
            optional
            onImageReady={(b64, mime) => {
              setBackBase64(b64);
              setBackMimeType(mime);
            }}
            onClear={() => {
              setBackBase64(null);
              setBackMimeType(null);
            }}
          />
          <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-300 leading-relaxed">
              Place the backs in the <strong>same order</strong> as the fronts. The card in the top-left of your backs photo should be the back of the top-left card in your fronts photo.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleScan}
        fullWidth
        size="lg"
        disabled={!imageBase64}
      >
        Analyze Cards
      </Button>

      {/* Tips */}
      <div className="bg-muted-light rounded-xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Tips for Best Results</h3>
        <ul className="space-y-1.5 text-xs text-muted">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Use good, even lighting — avoid harsh shadows
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Lay cards flat on a contrasting background
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Make sure card text and images are clearly visible
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Leave some space between cards
          </li>
        </ul>
      </div>
    </div>
  );
}
