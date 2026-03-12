import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai/client';
import { buildWhyExplanationPrompt } from '@/lib/openai/prompts';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId } = await params;
    const body = await request.json();
    const { cardResultId } = body;

    if (!cardResultId) {
      return NextResponse.json(
        { error: 'cardResultId is required' },
        { status: 400 }
      );
    }

    // Fetch the card result
    const { data: cardResult, error: fetchError } = await supabase
      .from('card_results')
      .select('*')
      .eq('id', cardResultId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !cardResult) {
      return NextResponse.json(
        { error: 'Card result not found' },
        { status: 404 }
      );
    }

    // If already has explanation, return it
    if (cardResult.psa_recommendation_reason) {
      return NextResponse.json({
        explanation: cardResult.psa_recommendation_reason,
      });
    }

    // Generate explanation (text-only, no image — cheaper and faster)
    const prompt = buildWhyExplanationPrompt(
      cardResult.player_name,
      cardResult.card_year,
      cardResult.card_set,
      cardResult.sport,
      cardResult.psa_recommendation
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for text explanation
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    });

    const explanation =
      response.choices[0].message.content ||
      'Unable to generate explanation.';

    // Save the explanation
    await supabase
      .from('card_results')
      .update({ psa_recommendation_reason: explanation })
      .eq('id', cardResultId);

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error('Explain error:', err);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
