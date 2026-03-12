import { Tier, TIER_CONFIGS } from '@/types/pricing';

export function canScan(tier: Tier, currentScans: number): boolean {
  const config = TIER_CONFIGS[tier];
  return currentScans < config.scansPerMonth;
}

export function canAddToCollection(
  tier: Tier,
  currentCollectionSize: number
): boolean {
  const config = TIER_CONFIGS[tier];
  if (config.collectionLimit === 0) return false;
  return currentCollectionSize < config.collectionLimit;
}

export function getRemainingScans(tier: Tier, currentScans: number): number {
  const config = TIER_CONFIGS[tier];
  return Math.max(0, config.scansPerMonth - currentScans);
}

export function getUsagePercentage(tier: Tier, currentScans: number): number {
  const config = TIER_CONFIGS[tier];
  return Math.min(100, (currentScans / config.scansPerMonth) * 100);
}

export function getNextTier(currentTier: Tier): Tier | null {
  switch (currentTier) {
    case 'free':
      return 'pro';
    case 'pro':
      return 'premium';
    case 'premium':
      return null;
  }
}
