'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import UsageMeter from '@/components/features/pricing/UsageMeter';
import { UsageRecord } from '@/types/pricing';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<{ email?: string; displayName?: string } | null>(null);
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser({
          email: user.email,
          displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
        });
      }

      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch {
        // Silently fail
      }

      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted-light rounded w-1/3" />
        <div className="h-20 bg-muted-light rounded-2xl" />
        <div className="h-20 bg-muted-light rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted text-sm mt-1">
          Manage your account and subscription
        </p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-bold">{user?.displayName}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <UsageMeter
          tier={usage.tier}
          scansUsed={usage.scansUsed}
          scansLimit={usage.scansLimit}
        />
      )}

      {/* Current Plan */}
      {usage && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Current Plan</p>
              <p className="text-xs text-muted capitalize">{usage.tier}</p>
            </div>
            <Link
              href="/pricing"
              className="text-sm text-primary font-semibold hover:underline"
            >
              {usage.tier === 'free' ? 'Upgrade' : 'Manage'} →
            </Link>
          </div>
        </div>
      )}

      {/* Collection info */}
      {usage && usage.collectionLimit > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Collection</p>
              <p className="text-xs text-muted">
                {usage.collectionCount} / {usage.collectionLimit} cards
              </p>
            </div>
            <Link
              href="/collection"
              className="text-sm text-primary font-semibold hover:underline"
            >
              View →
            </Link>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <Button onClick={handleSignOut} variant="outline" fullWidth>
        Sign Out
      </Button>
    </div>
  );
}
