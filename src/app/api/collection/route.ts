import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TIER_CONFIGS, Tier } from '@/types/pricing';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const sport = url.searchParams.get('sport');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query card_results directly so all scanned cards appear in collection
    let query = supabase
      .from('card_results')
      .select('id, mint_id, player_name, card_year, card_set, card_number, sport, manufacturer, raw_price_low, raw_price_high, psa_recommendation, estimated_psa_grade_low, estimated_psa_grade_high, created_at, scan_id', { count: 'exact' })
      .eq('user_id', user.id);

    if (sport) {
      query = query.eq('sport', sport);
    }

    if (search) {
      query = query.or(
        `player_name.ilike.%${search}%,card_set.ilike.%${search}%`
      );
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        query = query.order('player_name', { ascending: true });
        break;
      case 'value':
        query = query.order('raw_price_high', { ascending: false });
        break;
      case 'sport':
        query = query.order('sport', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: rawCards, count, error } = await query;

    if (error) {
      console.error('Collection fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collection' },
        { status: 500 }
      );
    }

    // Map card_results fields to collection format
    const cards = (rawCards || []).map((c) => ({
      id: c.id,
      mint_id: c.mint_id,
      player_name: c.player_name,
      card_year: c.card_year,
      card_set: c.card_set,
      card_number: c.card_number,
      sport: c.sport,
      manufacturer: c.manufacturer,
      estimated_value_low: c.raw_price_low,
      estimated_value_high: c.raw_price_high,
      psa_grade: null,
      psa_recommendation: c.psa_recommendation,
      estimated_psa_grade_low: c.estimated_psa_grade_low,
      estimated_psa_grade_high: c.estimated_psa_grade_high,
      created_at: c.created_at,
    }));

    // Get totals from card_results
    const { data: stats } = await supabase
      .from('card_results')
      .select('raw_price_low, raw_price_high')
      .eq('user_id', user.id);

    const totalValueLow = stats?.reduce((sum, c) => sum + (c.raw_price_low || 0), 0) || 0;
    const totalValueHigh = stats?.reduce((sum, c) => sum + (c.raw_price_high || 0), 0) || 0;

    return NextResponse.json({
      cards,
      total: count || 0,
      page,
      limit,
      stats: {
        totalCards: count || 0,
        totalValueLow,
        totalValueHigh,
      },
    });
  } catch (err) {
    console.error('Collection error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tier allows collection
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.tier || 'free') as Tier;
    const config = TIER_CONFIGS[tier];

    if (config.collectionLimit === 0) {
      return NextResponse.json(
        { error: 'Collection storage requires a Pro or Premium plan.' },
        { status: 403 }
      );
    }

    // Check collection size
    const { count } = await supabase
      .from('collection_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= config.collectionLimit) {
      return NextResponse.json(
        { error: `Collection limit of ${config.collectionLimit} cards reached. Upgrade your plan.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { cardResultId } = body;

    if (!cardResultId) {
      return NextResponse.json(
        { error: 'cardResultId is required' },
        { status: 400 }
      );
    }

    // Fetch card result
    const { data: cardResult } = await supabase
      .from('card_results')
      .select('*')
      .eq('id', cardResultId)
      .eq('user_id', user.id)
      .single();

    if (!cardResult) {
      return NextResponse.json(
        { error: 'Card result not found' },
        { status: 404 }
      );
    }

    // Save to collection
    const { data: collectionCard, error: insertError } = await supabase
      .from('collection_cards')
      .insert({
        user_id: user.id,
        card_result_id: cardResultId,
        player_name: cardResult.player_name,
        card_year: cardResult.card_year,
        card_set: cardResult.card_set,
        card_number: cardResult.card_number,
        sport: cardResult.sport,
        manufacturer: cardResult.manufacturer,
        estimated_value_low: cardResult.raw_price_low,
        estimated_value_high: cardResult.raw_price_high,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Collection insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save card to collection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ card: collectionCard });
  } catch (err) {
    console.error('Collection POST error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
