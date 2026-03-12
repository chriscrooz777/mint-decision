import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanupFreeResults } from '@/lib/utils/cleanupFreeResults';

const VALID_TIERS = ['free', 'pro', 'premium'] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be free, pro, or premium.' },
        { status: 400 }
      );
    }

    // Get current tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const currentTier = profile?.tier || 'free';

    if (currentTier === tier) {
      return NextResponse.json(
        { error: 'Already on this plan.' },
        { status: 400 }
      );
    }

    // Update tier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Tier update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update plan.' },
        { status: 500 }
      );
    }

    // If downgrading to free, clean up collection and card_results
    if (tier === 'free') {
      // Delete all collection_cards for this user
      await supabase
        .from('collection_cards')
        .delete()
        .eq('user_id', user.id);

      // Trim card_results to 5 and clean up storage images
      await cleanupFreeResults(supabase, user.id);
    }

    return NextResponse.json({ success: true, tier });
  } catch (err) {
    console.error('Tier change error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
