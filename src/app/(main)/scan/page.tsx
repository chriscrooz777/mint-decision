import Link from 'next/link';

export default function ScanHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Cards</h1>
        <p className="text-muted text-sm mt-1">
          Choose how you&apos;d like to evaluate your cards
        </p>
      </div>

      <div className="grid gap-4">
        {/* Multi-Card Scan */}
        <Link
          href="/scan/multi"
          className="group block bg-card rounded-2xl border-2 border-border p-5 hover:border-primary transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
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
              <h2 className="text-lg font-bold">Quick Scan</h2>
              <p className="text-sm text-muted mt-1">
                Photograph up to 9 cards at once. Get player names, estimated
                values, and PSA submission recommendations.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-primary-light text-primary font-semibold px-2.5 py-1 rounded-full">
                  1-9 cards
                </span>
                <span className="text-xs bg-muted-light text-muted font-semibold px-2.5 py-1 rounded-full">
                  Fast results
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Single Card Deep Evaluation */}
        <Link
          href="/scan/single"
          className="group block bg-card rounded-2xl border-2 border-border p-5 hover:border-primary transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
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
              <h2 className="text-lg font-bold">Deep Evaluation</h2>
              <p className="text-sm text-muted mt-1">
                Detailed PSA grading analysis for a single card. Upload front
                and back for centering, corners, edges, and surface scoring.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                  1 card
                </span>
                <span className="text-xs bg-muted-light text-muted font-semibold px-2.5 py-1 rounded-full">
                  Detailed grading
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
