'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/features/scan/ImageUploader';
import ScanLoadingState from '@/components/features/scan/ScanLoadingState';
import MultiCardResults from '@/components/features/scan/MultiCardResults';
import Button from '@/components/ui/Button';
import { useScanStore } from '@/stores/scanStore';

export default function MultiScanPage() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const { isScanning, multiResults, gridLayout, originalImageDataUrl, error, startScan, setMultiResults, setScanError, reset } =
    useScanStore();
  const router = useRouter();

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
          onSaveToCollection={handleSaveToCollection}
          savedCards={savedCards}
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
        label="Photograph your cards"
        hint="Lay cards flat with good lighting. Supports 1-9 cards per photo."
        onImageReady={handleImageReady}
        onClear={() => {
          setImageBase64(null);
          setImageMimeType(null);
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
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
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Tips for best results</h3>
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
