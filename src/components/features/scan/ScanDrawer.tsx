'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ScanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Override Quick Scan navigation with a callback — use when already on /scan/multi */
  onQuickScan?: () => void;
}

export default function ScanDrawer({ isOpen, onClose, onQuickScan }: ScanDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-card rounded-t-2xl shadow-xl max-w-lg mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 pt-2 pb-4">
            <h2 className="text-lg font-bold">New Scan</h2>
            <p className="text-sm text-muted">Choose how to evaluate your cards</p>
          </div>

          {/* Options */}
          <div className="px-5 pb-6 space-y-3">
            {/* Quick Scan */}
            {onQuickScan ? (
              <button
                onClick={onQuickScan}
                className="group w-full text-left flex items-start gap-4 bg-card rounded-2xl border-2 border-border p-4 hover:border-primary transition-colors"
              >
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <svg className="w-6 h-6 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold">Quick Scan</h3>
                  <p className="text-sm text-muted mt-0.5">Scan up to 9 cards at once for fast identification and pricing.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-primary text-white font-semibold px-2.5 py-1 rounded-full">1-9 cards</span>
                    <span className="text-xs bg-border text-slate-300 font-semibold px-2.5 py-1 rounded-full">Fast results</span>
                  </div>
                </div>
              </button>
            ) : (
            <Link
              href="/scan/multi"
              onClick={onClose}
              className="group flex items-start gap-4 bg-card rounded-2xl border-2 border-border p-4 hover:border-primary transition-colors"
            >
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                <svg
                  className="w-6 h-6 text-primary group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold">Quick Scan</h3>
                <p className="text-sm text-muted mt-0.5">
                  Scan up to 9 cards at once for fast identification and pricing.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-primary text-white font-semibold px-2.5 py-1 rounded-full">
                    1-9 cards
                  </span>
                  <span className="text-xs bg-border text-slate-300 font-semibold px-2.5 py-1 rounded-full">
                    Fast results
                  </span>
                </div>
              </div>
            </Link>
            )}

            {/* Deep Evaluation */}
            <Link
              href="/scan/single"
              onClick={onClose}
              className="group flex items-start gap-4 bg-card rounded-2xl border-2 border-border p-4 hover:border-primary transition-colors"
            >
              <div className="w-12 h-12 bg-amber-950/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                <svg
                  className="w-6 h-6 text-accent group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold">Deep Evaluation</h3>
                <p className="text-sm text-muted mt-0.5">
                  Detailed PSA grading analysis with centering, corners, edges, and surface scoring.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-amber-950/30 text-amber-400 font-semibold px-2.5 py-1 rounded-full">
                    1 card
                  </span>
                  <span className="text-xs bg-border text-slate-300 font-semibold px-2.5 py-1 rounded-full">
                    Detailed grading
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Safe area padding */}
          <div className="pb-safe" />
        </div>
      </div>
    </>
  );
}
