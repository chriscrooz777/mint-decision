import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentMonthYear } from '@/lib/utils/format';
import { TIER_CONFIGS, Tier } from '@/types/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const monthYear = getCurrentMonthYear();

    // Get profile tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.tier || 'free') as Tier;
    const config = TIER_CONFIGS[tier];

    // Get current scan usage
    const { data: usage } = await supabase
      .from('scan_usage')
      .select('scan_count')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single();

    const scansUsed = usage?.scan_count || 0;

    // Get collection count
    const { count: collectionCount } = await supabase
      .from('collection_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      tier,
      scansUsed,
      scansLimit: config.scansPerMonth,
      collectionCount: collectionCount || 0,
      collectionLimit: config.collectionLimit,
      monthYear,
    });
  } catch (err) {
    console.error('Usage error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
