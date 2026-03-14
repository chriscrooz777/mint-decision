'use client';

import { TierConfig, Tier } from '@/types/pricing';

interface TierCardProps {
  config: TierConfig;
  currentTier: Tier;
  onSelect: (tier: Tier) => void;
}

export default function TierCard({ config, currentTier, onSelect }: TierCardProps) {
  const isCurrent = config.id === currentTier;
  const isUpgrade = !isCurrent;
  const isPopular = config.id === 'pro';

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-colors ${
        isCurrent
          ? 'border-primary bg-primary-light'
          : isPopular
            ? 'border-primary bg-card'
            : 'border-border bg-card'
      }`}
    >
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
            Popular
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center mb-4 pt-1">
        <h3 className="text-lg font-bold">{config.name}</h3>
        <div className="mt-1">
          {config.price === 0 ? (
            <span className="text-2xl font-extrabold">Free</span>
          ) : (
            <>
              <span className="text-2xl font-extrabold">${config.price}</span>
              <span className="text-sm text-muted">/month</span>
            </>
          )}
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {config.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs">
            <svg
              className="w-4 h-4 text-secondary shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {isUpgrade ? (
        <button
          onClick={() => onSelect(config.id)}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isPopular
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-muted-light text-foreground hover:bg-border'
          }`}
        >
          {config.price === 0 ? 'Downgrade' : 'Upgrade'}
        </button>
      ) : (
        <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center text-secondary bg-emerald-900/30">
          Active
        </div>
      )}
    </div>
  );
}
