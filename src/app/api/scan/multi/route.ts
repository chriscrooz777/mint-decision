import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai/client';
import { MULTI_CARD_SYSTEM_PROMPT } from '@/lib/openai/prompts';
import { multiCardSchema } from '@/lib/openai/schemas';
import { cleanupFreeResults } from '@/lib/utils/cleanupFreeResults';
import { uploadCardImageServer } from '@/lib/supabase/server-storage';
import { AIMultiScanResponse } from '@/types/scan';
import { getCurrentMonthYear } from '@/lib/utils/format';
import sharp from 'sharp';

export const maxDuration = 60; // Allow up to 60s for OpenAI response

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image and mimeType are required' },
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

    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: 'multi',
        image_front_path: `${user.id}/multi/${Date.now()}.jpg`,
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

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: MULTI_CARD_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      response_format: multiCardSchema,
      max_tokens: 4096,
      temperature: 0.2,
    });

    const aiResult: AIMultiScanResponse = JSON.parse(
      response.choices[0].message.content || '{}'
    );

    if (!aiResult.cards || aiResult.cards.length === 0) {
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scan.id);
      return NextResponse.json(
        { error: 'No cards could be identified in the image. Please try a clearer photo.' },
        { status: 422 }
      );
    }

    // Reserve mint_ids for this batch
    const { data: startMintId } = await supabase.rpc('next_mint_ids', {
      p_user_id: user.id,
      p_count: aiResult.cards.length,
    });
    const mintIdStart = startMintId || 1;

    // Save card results
    const cardInserts = aiResult.cards.map((card, index) => ({
      scan_id: scan.id,
      user_id: user.id,
      card_index: card.card_index,
      mint_id: mintIdStart + index,
      player_name: card.player_name,
      card_year: card.card_year,
      card_set: card.card_set,
      card_number: card.card_number,
      sport: card.sport,
      manufacturer: card.manufacturer,
      condition_summary: card.condition_summary,
      raw_price_low: card.raw_price_low,
      raw_price_high: card.raw_price_high,
      psa_recommendation: card.psa_recommendation,
    }));

    const { data: savedCards, error: cardError } = await supabase
      .from('card_results')
      .insert(cardInserts)
      .select('id, card_index, mint_id');

    if (cardError) {
      console.error('Failed to save card results:', cardError);
    }

    // Update scan status
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        card_count: aiResult.cards.length,
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

    // Upload cropped card images to Supabase Storage (server-side with sharp)
    try {
      const imageBuffer = Buffer.from(image, 'base64');
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width || 1;
      const imgHeight = metadata.height || 1;

      for (const card of aiResult.cards) {
        const savedCard = savedCards?.find((sc) => sc.card_index === card.card_index);
        if (!savedCard) continue;

        const cellWidth = imgWidth / aiResult.grid_cols;
        const cellHeight = imgHeight / aiResult.grid_rows;
        const baseX = card.grid_col * cellWidth;
        const baseY = card.grid_row * cellHeight;

        // 5% inward padding (matches client-side CroppedCardThumbnail)
        const padX = cellWidth * 0.05;
        const padY = cellHeight * 0.05;

        const left = Math.max(0, Math.round(baseX + padX));
        const top = Math.max(0, Math.round(baseY + padY));
        const width = Math.min(Math.round(cellWidth - padX * 2), imgWidth - left);
        const height = Math.min(Math.round(cellHeight - padY * 2), imgHeight - top);

        if (width <= 0 || height <= 0) continue;

        try {
          const croppedBuffer = await sharp(imageBuffer)
            .extract({ left, top, width, height })
            .resize(400, 400, { fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();

          const storagePath = await uploadCardImageServer(supabase, croppedBuffer, user.id, savedCard.id);
          if (storagePath) {
            await supabase
              .from('card_results')
              .update({ image_path: storagePath })
              .eq('id', savedCard.id);
          }
        } catch (cropErr) {
          console.error(`Failed to crop/upload image for card ${savedCard.id}:`, cropErr);
        }
      }
    } catch (imgErr) {
      console.error('Failed to process images for upload:', imgErr);
    }

    // Build response
    const gridLayout = {
      gridRows: aiResult.grid_rows,
      gridCols: aiResult.grid_cols,
    };

    const cards = aiResult.cards.map((card, index) => {
      const savedCard = savedCards?.find((sc) => sc.card_index === card.card_index);
      return {
        id: savedCard?.id || crypto.randomUUID(),
        mintId: savedCard?.mint_id || (mintIdStart + index),
        scanId: scan.id,
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
        confidence: card.confidence,
        gridPosition: {
          gridRow: card.grid_row,
          gridCol: card.grid_col,
        },
        createdAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ scanId: scan.id, gridLayout, cards });
  } catch (err) {
    console.error('Multi-scan error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
