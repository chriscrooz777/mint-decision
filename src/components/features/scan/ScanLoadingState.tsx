'use client';

export default function ScanLoadingState({ type = 'multi' }: { type?: 'multi' | 'single' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
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
        {type === 'multi' ? 'Analyzing Your Cards...' : 'Evaluating Card...'}
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
    </div>
  );
}
