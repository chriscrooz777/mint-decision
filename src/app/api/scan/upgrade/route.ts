import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai/client';
import { SINGLE_CARD_SYSTEM_PROMPT } from '@/lib/openai/prompts';
import { singleCardSchema } from '@/lib/openai/schemas';
import { AISingleScanResponse } from '@/types/scan';
import { getCurrentMonthYear } from '@/lib/utils/format';
import { cleanupFreeResults } from '@/lib/utils/cleanupFreeResults';
import { uploadCardDeepFrontImageServer, uploadCardDeepBackImageServer } from '@/lib/supabase/server-storage';
import sharp from 'sharp';

export const maxDuration = 60;

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
    const { cardId, imageFront, mimeTypeFront, imageBack, mimeTypeBack } = body;

    if (!cardId || !imageFront || !mimeTypeFront) {
      return NextResponse.json(
        { error: 'Card ID and front image are required' },
        { status: 400 }
      );
    }

    // Fetch existing card — verify ownership and that it's a Quick Scan
    const { data: existingCard, error: fetchError } = await supabase
      .from('card_results')
      .select('id, mint_id, player_name, card_year, card_set, card_number, sport, manufacturer, centering_score')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (existingCard.centering_score !== null) {
      return NextResponse.json(
        { error: 'This card already has a Deep Evaluation' },
        { status: 400 }
      );
    }

    // Check scan usage
    const monthYear = getCurrentMonthYear();
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.tier || 'free';
    const { data: usage } = await supabase
      .from('scan_usage')
      .select('scan_count')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single();

    const currentScans = usage?.scan_count || 0;
    const limits: Record<string, number> = { free: 25, pro: 1000, premium: 5000 };
    const scanLimit = limits[tier] || 25;

    if (currentScans >= scanLimit) {
      return NextResponse.json(
        { error: 'Monthly scan limit reached. Upgrade your plan for more scans.' },
        { status: 429 }
      );
    }

    // Create new scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: 'single',
        image_front_path: `${user.id}/single/${Date.now()}_front.jpg`,
        image_back_path: imageBack
          ? `${user.id}/single/${Date.now()}_back.jpg`
          : null,
        status: 'processing',
      })
      .select('id')
      .single();

    if (scanError || !scan) {
      console.error('Failed to create scan:', scanError);
      return NextResponse.json(
        { error: 'Failed to create scan record' },
        { status: 500 }
      );
    }

    // Build image content for OpenAI
    const imageContent: Array<{
      type: 'image_url';
      image_url: { url: string; detail: 'high' | 'low' | 'auto' };
    }> = [
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeTypeFront};base64,${imageFront}`,
          detail: 'high',
        },
      },
    ];

    if (imageBack && mimeTypeBack) {
      imageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeTypeBack};base64,${imageBack}`,
          detail: 'high',
        },
      });
    }

    // Build enhanced user message with known card identity
    const identityParts = [
      `Known card identity: ${existingCard.player_name}`,
      existingCard.card_year && existingCard.card_year !== 'unknown' ? `Year: ${existingCard.card_year}` : '',
      existingCard.card_set && existingCard.card_set !== 'unknown' ? `Set: ${existingCard.card_set}` : '',
      existingCard.card_number && existingCard.card_number !== 'unknown' ? `Card number: ${existingCard.card_number}` : '',
      existingCard.sport && existingCard.sport !== 'unknown' ? `Sport: ${existingCard.sport}` : '',
      existingCard.manufacturer && existingCard.manufacturer !== 'unknown' ? `Manufacturer: ${existingCard.manufacturer}` : '',
    ].filter(Boolean).join('\n');

    const baseText = imageBack
      ? 'Here are the front and back of the card. Please provide a detailed evaluation.'
      : 'Here is the front of the card. The back was not provided. Please evaluate what you can see and note any limitations.';

    const userText = `${baseText}\n\n${identityParts}\n\nPlease cross-reference this identity with what you see in the images and provide your detailed grading.`;

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SINGLE_CARD_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: userText },
          ],
        },
      ],
      response_format: singleCardSchema,
      max_tokens: 4096,
      temperature: 0.2,
    });

    const aiResult: AISingleScanResponse = JSON.parse(
      response.choices[0].message.content || '{}'
    );

    if (!aiResult.card) {
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scan.id);
      return NextResponse.json(
        { error: 'Could not evaluate the card. Please try a clearer photo.' },
        { status: 422 }
      );
    }

    const c = aiResult.card;

    // UPDATE existing card_results row (not INSERT — preserve mint_id)
    const { error: updateError } = await supabase
      .from('card_results')
      .update({
        scan_id: scan.id,
        // Card identity (AI may refine)
        player_name: c.player_name,
        card_year: c.card_year,
        card_set: c.card_set,
        card_number: c.card_number,
        sport: c.sport,
        manufacturer: c.manufacturer,
        // Grading scores (were NULL, now populated)
        centering_score: c.centering_score,
        corners_score: c.corners_score,
        edges_score: c.edges_score,
        surface_score: c.surface_score,
        estimated_psa_grade_low: c.estimated_psa_grade_low,
        estimated_psa_grade_high: c.estimated_psa_grade_high,
        grading_explanation: c.grading_explanation,
        grade_improvement_tips: c.grade_improvement_tips,
        // Updated values
        raw_price_low: c.raw_price_low,
        raw_price_high: c.raw_price_high,
        graded_value_low: c.graded_value_low,
        graded_value_high: c.graded_value_high,
      })
      .eq('id', cardId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update card:', updateError);
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scan.id);
      return NextResponse.json(
        { error: 'Failed to update card' },
        { status: 500 }
      );
    }

    // Mark scan completed
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        card_count: 1,
        raw_ai_response: aiResult,
      })
      .eq('id', scan.id);

    // Increment scan usage
    await supabase.rpc('increment_scan_usage', {
      p_user_id: user.id,
      p_month_year: monthYear,
    });

    // Free tier: keep only latest 5 card_results
    if (tier === 'free') {
      await cleanupFreeResults(supabase, user.id);
    }

    // Upload images to Supabase Storage (server-side).
    // Uses _deep / _deep_back paths so the URL differs from the original
    // quick-scan crop, avoiding any CDN cache collision.
    try {
      const frontBuffer = Buffer.from(imageFront, 'base64');
      const frontJpeg = await sharp(frontBuffer)
        .rotate() // apply EXIF orientation from phone cameras
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      const frontPath = await uploadCardDeepFrontImageServer(supabase, frontJpeg, user.id, cardId);

      let backPath: string | null = null;
      if (imageBack) {
        const backBuffer = Buffer.from(imageBack, 'base64');
        const backJpeg = await sharp(backBuffer)
          .rotate()
          .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        backPath = await uploadCardDeepBackImageServer(supabase, backJpeg, user.id, cardId);
      }

      if (frontPath || backPath) {
        await supabase
          .from('card_results')
          .update({
            ...(frontPath ? { image_path: frontPath } : {}),
            ...(backPath ? { back_image_path: backPath } : {}),
          })
          .eq('id', cardId)
          .eq('user_id', user.id);
      }
    } catch (imgErr) {
      console.error('Failed to upload upgrade scan images:', imgErr);
    }

    const card = {
      id: existingCard.id,
      mintId: existingCard.mint_id,
      scanId: scan.id,
      playerName: c.player_name,
      cardYear: c.card_year,
      cardSet: c.card_set,
      cardNumber: c.card_number,
      sport: c.sport,
      manufacturer: c.manufacturer,
      rawPriceLow: c.raw_price_low,
      rawPriceHigh: c.raw_price_high,
      centering: { score: c.centering_score, notes: c.centering_notes },
      corners: { score: c.corners_score, notes: c.corners_notes },
      edges: { score: c.edges_score, notes: c.edges_notes },
      surface: { score: c.surface_score, notes: c.surface_notes },
      estimatedPsaGradeLow: c.estimated_psa_grade_low,
      estimatedPsaGradeHigh: c.estimated_psa_grade_high,
      gradingExplanation: c.grading_explanation,
      gradeImprovementTips: c.grade_improvement_tips,
      gradedValueLow: c.graded_value_low,
      gradedValueHigh: c.graded_value_high,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ scanId: scan.id, card });
  } catch (err) {
    console.error('Upgrade scan error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
