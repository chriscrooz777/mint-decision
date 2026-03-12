'use client';

import { formatNumber } from '@/lib/utils/format';
import { getUsagePercentage } from '@/lib/utils/pricing';
import { Tier } from '@/types/pricing';

interface UsageMeterProps {
  tier: Tier;
  scansUsed: number;
  scansLimit: number;
}

export default function UsageMeter({ tier, scansUsed, scansLimit }: UsageMeterProps) {
  const percentage = getUsagePercentage(tier, scansUsed);
  const remaining = Math.max(0, scansLimit - scansUsed);

  const barColor =
    percentage >= 90
      ? 'bg-danger'
      : percentage >= 70
        ? 'bg-accent'
        : 'bg-primary';

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Monthly Scans</span>
        <span className="text-xs text-muted">
          {formatNumber(scansUsed)} / {formatNumber(scansLimit)}
        </span>
      </div>
      <div className="h-2.5 bg-muted-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-1.5">
        {remaining > 0
          ? `${formatNumber(remaining)} scans remaining this month`
          : 'Monthly limit reached — upgrade for more scans'}
      </p>
    </div>
  );
}
