import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          {APP_NAME}
        </h1>
        <p className="text-lg text-muted max-w-md mb-10 leading-relaxed">
          Snap a photo of your sports cards and get instant AI-powered
          identification, valuation, and PSA grading recommendations.
        </p>

        {/* CTA */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/signup"
            className="w-full bg-primary text-white text-center font-semibold py-3.5 px-6 rounded-xl shadow-sm hover:bg-primary-dark transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="w-full text-primary text-center font-semibold py-3.5 px-6 rounded-xl border-2 border-primary hover:bg-primary-light transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 max-w-sm w-full text-left">
          <FeatureItem
            icon="camera"
            title="Quick Scan"
            description="Scan up to 9 cards at once and get instant identification and pricing."
          />
          <FeatureItem
            icon="shield"
            title="PSA Grade Estimates"
            description="Deep single-card evaluation with centering, corners, edges, and surface analysis."
          />
          <FeatureItem
            icon="dollar"
            title="Market Pricing"
            description="Raw card values based on PSA, eBay sold listings, and more."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}

const iconPaths: Record<string, React.ReactNode> = {
  camera: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </>
  ),
  shield: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  ),
  dollar: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
};

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {iconPaths[icon]}
        </svg>
      </div>
      <div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}
