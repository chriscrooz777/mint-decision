import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await params;

    // Fetch full card result with scan info
    const { data: card, error } = await supabase
      .from('card_results')
      .select(`
        id, mint_id, scan_id, card_index,
        player_name, card_year, card_set, card_number,
        sport, manufacturer, condition_summary,
        raw_price_low, raw_price_high,
        psa_recommendation, psa_recommendation_reason,
        centering_score, corners_score, edges_score, surface_score,
        estimated_psa_grade_low, estimated_psa_grade_high,
        grading_explanation, grade_improvement_tips,
        graded_value_low, graded_value_high,
        image_path, back_image_path,
        created_at
      `)
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Determine scan type by checking if grading scores exist
    const isSingleScan = card.centering_score !== null;

    // Get scan type from scans table for confirmation
    const { data: scan } = await supabase
      .from('scans')
      .select('scan_type')
      .eq('id', card.scan_id)
      .single();

    return NextResponse.json({
      card: {
        id: card.id,
        mintId: card.mint_id,
        scanId: card.scan_id,
        cardIndex: card.card_index,
        playerName: card.player_name,
        cardYear: card.card_year,
        cardSet: card.card_set,
        cardNumber: card.card_number,
        sport: card.sport,
        manufacturer: card.manufacturer,
        conditionSummary: card.condition_summary,
        rawPriceLow: card.raw_price_low,
        rawPriceHigh: card.raw_price_high,
        psaRecommendation: card.psa_recommendation,
        psaRecommendationReason: card.psa_recommendation_reason,
        // Single-scan grading details (null for multi-scan)
        centeringScore: card.centering_score,
        cornersScore: card.corners_score,
        edgesScore: card.edges_score,
        surfaceScore: card.surface_score,
        estimatedPsaGradeLow: card.estimated_psa_grade_low,
        estimatedPsaGradeHigh: card.estimated_psa_grade_high,
        gradingExplanation: card.grading_explanation,
        gradeImprovementTips: card.grade_improvement_tips,
        gradedValueLow: card.graded_value_low,
        gradedValueHigh: card.graded_value_high,
        imagePath: card.image_path || null,
        backImagePath: card.back_image_path || null,
        createdAt: card.created_at,
      },
      scanType: scan?.scan_type || (isSingleScan ? 'single' : 'multi'),
    });
  } catch (err) {
    console.error('Card detail error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await params;

    // Fetch image paths before deleting so we can clean up storage
    const { data: cardData } = await supabase
      .from('card_results')
      .select('image_path, back_image_path')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    // Delete from card_results (RLS ensures user can only delete own)
    const { error } = await supabase
      .from('card_results')
      .delete()
      .eq('id', cardId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete card error:', error);
      return NextResponse.json(
        { error: 'Failed to delete card' },
        { status: 500 }
      );
    }

    // Clean up storage images (front + back)
    const pathsToRemove: string[] = [];
    if (cardData?.image_path) pathsToRemove.push(cardData.image_path);
    if (cardData?.back_image_path) pathsToRemove.push(cardData.back_image_path);
    if (pathsToRemove.length > 0) {
      await supabase.storage
        .from('card-images')
        .remove(pathsToRemove);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete card error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
