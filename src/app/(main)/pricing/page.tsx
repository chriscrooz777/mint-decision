'use client';

import { useState, useEffect } from 'react';
import TierCard from '@/components/features/pricing/TierCard';
import UsageMeter from '@/components/features/pricing/UsageMeter';
import { TIER_CONFIGS, Tier, UsageRecord } from '@/types/pricing';

export default function PricingPage() {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const handleSelectTier = async (tier: Tier) => {
    // For now, just show a message since payments aren't connected
    alert(
      tier === 'free'
        ? 'Downgraded to Free tier.'
        : `Payment processing coming soon! You selected the ${TIER_CONFIGS[tier].name} plan ($${TIER_CONFIGS[tier].price}/mo).`
    );
  };

  const currentTier = usage?.tier || 'free';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plans & Pricing</h1>
        <p className="text-muted text-sm mt-1">
          Choose the plan that fits your collection
        </p>
      </div>

      {/* Usage meter */}
      {usage && (
        <UsageMeter
          tier={usage.tier}
          scansUsed={usage.scansUsed}
          scansLimit={usage.scansLimit}
        />
      )}

      {/* Tier cards */}
      <div className="space-y-4">
        {Object.values(TIER_CONFIGS).map((config) => (
          <TierCard
            key={config.id}
            config={config}
            currentTier={currentTier}
            onSelect={handleSelectTier}
          />
        ))}
      </div>

      {/* Coming soon notice */}
      <div className="bg-muted-light rounded-xl p-4 text-center">
        <p className="text-xs text-muted">
          💳 Payment processing coming soon. Tier selection is currently for preview purposes.
        </p>
      </div>
    </div>
  );
}
