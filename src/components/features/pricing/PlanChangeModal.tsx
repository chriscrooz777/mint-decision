'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { Tier, TIER_CONFIGS } from '@/types/pricing';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier: Tier | null;
  currentTier: Tier;
  onComplete: () => void;
}

type ModalState = 'confirm' | 'processing' | 'success' | 'error';

const TIER_PRICES: Record<Tier, number> = {
  free: 0,
  pro: 10,
  premium: 20,
};

function getDirection(current: Tier, target: Tier): 'upgrade' | 'downgrade' | 'downgrade-free' {
  if (target === 'free') return 'downgrade-free';
  if (TIER_PRICES[target] > TIER_PRICES[current]) return 'upgrade';
  return 'downgrade';
}

export default function PlanChangeModal({
  isOpen,
  onClose,
  targetTier,
  currentTier,
  onComplete,
}: PlanChangeModalProps) {
  const [state, setState] = useState<ModalState>('confirm');
  const [errorMsg, setErrorMsg] = useState('');

  const direction = targetTier ? getDirection(currentTier, targetTier) : 'upgrade';
  const targetName = targetTier ? TIER_CONFIGS[targetTier].name : '';

  // Reset state when modal opens — always show confirm first
  useEffect(() => {
    if (isOpen && targetTier) {
      setErrorMsg('');
      setState('confirm');
    }
  }, [isOpen, targetTier, direction]);

  // Auto-start processing only when explicitly triggered (not on confirm)
  useEffect(() => {
    if (isOpen && state === 'processing' && targetTier) {
      processChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, state, targetTier]);

  const processChange = useCallback(async () => {
    if (!targetTier) return;

    const startTime = Date.now();

    try {
      const res = await fetch('/api/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to change plan.');
      }

      // Ensure minimum 1.5s of "processing" for UX
      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise((r) => setTimeout(r, 1500 - elapsed));
      }

      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  }, [targetTier]);

  const handleConfirm = () => {
    setState('processing');
  };

  const handleDone = () => {
    onComplete();
    onClose();
  };

  const handleRetry = () => {
    setErrorMsg('');
    setState('confirm');
  };

  // Prevent backdrop close during processing
  const handleClose = () => {
    if (state === 'processing') return;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="text-center py-2">
        {/* ─── Confirm State (all directions) ─── */}
        {state === 'confirm' && (
          <div className="space-y-4">
            {/* Icon */}
            {direction === 'upgrade' ? (
              <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            ) : direction === 'downgrade-free' ? (
              <div className="w-14 h-14 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="w-14 h-14 bg-muted-light rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold">
                {direction === 'upgrade'
                  ? `Upgrade to ${targetName}?`
                  : direction === 'downgrade-free'
                    ? 'Downgrade to Free?'
                    : `Switch to ${targetName}?`}
              </h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {direction === 'upgrade'
                  ? `You'll be switched to the ${targetName} plan immediately.`
                  : direction === 'downgrade-free'
                    ? 'This will remove your saved collection and limit you to your 5 most recent scan results. This action cannot be undone.'
                    : `You'll be switched to the ${targetName} plan immediately.`}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted-light text-foreground hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  direction === 'downgrade-free'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {direction === 'upgrade' ? 'Confirm Upgrade' : direction === 'downgrade-free' ? 'Downgrade' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Processing State ─── */}
        {state === 'processing' && (
          <div className="space-y-4 py-6">
            {/* Spinner */}
            <div className="w-12 h-12 mx-auto">
              <svg className="w-12 h-12 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold">
                {direction === 'upgrade'
                  ? 'Processing Payment'
                  : direction === 'downgrade-free'
                    ? 'Downgrading Plan'
                    : 'Updating Plan'}
              </h3>
              <p className="text-sm text-muted mt-1">This will only take a moment</p>
            </div>
          </div>
        )}

        {/* ─── Success State ─── */}
        {state === 'success' && (
          <div className="space-y-4 py-4">
            {/* Checkmark with celebration */}
            <div className="relative">
              {/* Sparkle dots for upgrades */}
              {direction === 'upgrade' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="sparkle-container">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="sparkle-dot"
                        style={{
                          '--angle': `${i * 45}deg`,
                          '--delay': `${i * 0.05}s`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Green checkmark circle */}
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto animate-success-scale">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold">
                {direction === 'upgrade'
                  ? 'Plan Upgraded!'
                  : direction === 'downgrade-free'
                    ? 'Plan Downgraded'
                    : 'Plan Updated'}
              </h3>
              <p className="text-sm text-muted mt-1">
                {direction === 'upgrade'
                  ? `You're now on the ${targetName} plan`
                  : direction === 'downgrade-free'
                    ? 'You\'re now on the Free plan'
                    : `You're now on the ${targetName} plan`}
              </p>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors mt-2"
            >
              Done
            </button>
          </div>
        )}

        {/* ─── Error State ─── */}
        {state === 'error' && (
          <div className="space-y-4 py-4">
            {/* Error icon */}
            <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold">Something Went Wrong</h3>
              <p className="text-sm text-muted mt-1">{errorMsg}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted-light text-foreground hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes success-scale {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-success-scale {
          animation: success-scale 0.4s ease-out;
        }

        .sparkle-container {
          position: relative;
          width: 80px;
          height: 80px;
        }
        .sparkle-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fbbf24;
          animation: sparkle 0.6s ease-out forwards;
          animation-delay: var(--delay);
          opacity: 0;
        }
        @keyframes sparkle {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-36px);
            opacity: 0;
          }
        }
      `}</style>
    </Modal>
  );
}
