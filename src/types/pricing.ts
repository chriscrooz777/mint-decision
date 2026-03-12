export type Tier = 'free' | 'pro' | 'premium';

export interface TierConfig {
  id: Tier;
  name: string;
  price: number; // monthly price in USD
  scansPerMonth: number;
  collectionLimit: number;
  features: string[];
}

export interface UsageRecord {
  tier: Tier;
  scansUsed: number;
  scansLimit: number;
  collectionCount: number;
  collectionLimit: number;
  monthYear: string;
}

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    scansPerMonth: 25,
    collectionLimit: 0,
    features: [
      '25 scans per month',
      'Multi-card scanning (up to 9)',
      'Single card deep evaluation',
      'PSA grade recommendations',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 10,
    scansPerMonth: 1000,
    collectionLimit: 1000,
    features: [
      '1,000 scans per month',
      'Multi-card scanning (up to 9)',
      'Single card deep evaluation',
      'PSA grade recommendations',
      'Collection storage (up to 1,000 cards)',
      'Collection value tracking',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 20,
    scansPerMonth: 5000,
    collectionLimit: 10000,
    features: [
      '5,000 scans per month',
      'Multi-card scanning (up to 9)',
      'Single card deep evaluation',
      'PSA grade recommendations',
      'Collection storage (up to 10,000 cards)',
      'Collection value tracking',
    ],
  },
};
