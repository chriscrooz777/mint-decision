'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/features/scan/ImageUploader';
import ScanLoadingState from '@/components/features/scan/ScanLoadingState';
import SingleCardResults from '@/components/features/scan/SingleCardResults';
import Button from '@/components/ui/Button';
import { useScanStore } from '@/stores/scanStore';

export default function SingleScanPage() {
  const [frontBase64, setFrontBase64] = useState<string | null>(null);
  const [frontMimeType, setFrontMimeType] = useState<string | null>(null);
  const [backBase64, setBackBase64] = useState<string | null>(null);
  const [backMimeType, setBackMimeType] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [tier, setTier] = useState<string>('free');
  const { isScanning, singleResult, error, startScan, setSingleResult, setScanError, reset } =
    useScanStore();
  const router = useRouter();

  const isFree = tier === 'free';

  // Clear stale results when navigating back to this page
  useEffect(() => {
    reset();
    setFrontBase64(null);
    setFrontMimeType(null);
    setBackBase64(null);
    setBackMimeType(null);
    setIsSaved(false);
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

  const handleUnsaveFromCollection = useCallback(async () => {
    if (!singleResult) return;
    try {
      const res = await fetch(`/api/collection/${singleResult.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to remove card.');
        return;
      }
      setIsSaved(false);
    } catch {
      alert('Failed to remove card from collection.');
    }
  }, [singleResult]);

  const handleSaveToCollection = useCallback(async () => {
    if (!singleResult) return;
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardResultId: singleResult.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to save card.');
        return;
      }

      setIsSaved(true);
    } catch {
      alert('Failed to save card to collection.');
    }
  }, [singleResult]);

  const handleFrontReady = useCallback((base64: string, mimeType: string) => {
    setFrontBase64(base64);
    setFrontMimeType(mimeType);
  }, []);

  const handleBackReady = useCallback((base64: string, mimeType: string) => {
    setBackBase64(base64);
    setBackMimeType(mimeType);
  }, []);

  const handleScan = async () => {
    if (!frontBase64 || !frontMimeType) return;

    startScan();

    try {
      const res = await fetch('/api/scan/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageFront: frontBase64,
          mimeTypeFront: frontMimeType,
          imageBack: backBase64 || undefined,
          mimeTypeBack: backMimeType || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Evaluation failed. Please try again.');
      }

      const data = await res.json();
      setSingleResult(data.scanId, data.card);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const handleNewScan = () => {
    reset();
    setFrontBase64(null);
    setFrontMimeType(null);
    setBackBase64(null);
    setBackMimeType(null);
    setIsSaved(false);
  };

  if (isScanning) {
    return <ScanLoadingState type="single" />;
  }

  if (singleResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Evaluation Results</h1>
          <button
            onClick={handleNewScan}
            className="text-sm text-primary font-semibold hover:underline"
          >
            New Evaluation
          </button>
        </div>
        <SingleCardResults
          card={singleResult}
          frontImageDataUrl={
            frontBase64 && frontMimeType
              ? `data:${frontMimeType};base64,${frontBase64}`
              : undefined
          }
          backImageDataUrl={
            backBase64 && backMimeType
              ? `data:${backMimeType};base64,${backBase64}`
              : undefined
          }
          onSaveToCollection={isFree ? undefined : handleSaveToCollection}
          onUnsaveFromCollection={isFree ? undefined : handleUnsaveFromCollection}
          isSaved={isSaved}
          isFree={isFree}
        />
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold">Deep Evaluation</h1>
        <p className="text-muted text-sm mt-1">
          Get a detailed PSA-style grading analysis for a single card.
        </p>
      </div>

      {/* Front image (required) */}
      <div>
        <ImageUploader
          label="Front of card"
          hint="Required — capture a clear, well-lit photo of the front"
          onImageReady={handleFrontReady}
          onClear={() => {
            setFrontBase64(null);
            setFrontMimeType(null);
          }}
        />
      </div>

      {/* Back image (optional) */}
      <div>
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
      </div>

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

      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleScan}
        fullWidth
        size="lg"
        disabled={!frontBase64}
      >
        Evaluate Card
      </Button>
    </div>
  );
}
