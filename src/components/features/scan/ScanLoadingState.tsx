'use client';

import { useMemo } from 'react';

const QUICK_TIPS = [
  'Holo and foil cards are hard to scan accurately due to glare. Use Deep Evaluation for best results.',
];

export default function ScanLoadingState({ type = 'multi' }: { type?: 'multi' | 'single' }) {
  const tip = useMemo(() => QUICK_TIPS[Math.floor(Math.random() * QUICK_TIPS.length)], []);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      {/* Animated card icon */}
      <div className="relative mb-8">
        <div className="w-20 h-28 bg-primary-light rounded-xl border-2 border-primary animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">
        {type === 'multi' ? 'Analyzing Your Cards' : 'Evaluating Card'}
      </h2>
      <p className="text-sm text-muted text-center max-w-xs">
        {type === 'multi'
          ? 'Our AI is identifying each card, estimating values, and generating PSA recommendations.'
          : 'Running detailed grading analysis on centering, corners, edges, and surface quality.'}
      </p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-6">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Quick Tip */}
      <div className="mt-8 bg-muted-light border border-border rounded-2xl px-4 py-3 max-w-xs w-full">
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wide text-primary">Quick Tip</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
