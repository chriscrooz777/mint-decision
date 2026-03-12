import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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
    const body = await request.json();
    const { imagePath, backImagePath } = body;

    if (!imagePath || typeof imagePath !== 'string') {
      return NextResponse.json(
        { error: 'imagePath is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = { image_path: imagePath };
    if (backImagePath && typeof backImagePath === 'string') {
      updateData.back_image_path = backImagePath;
    }

    const { error } = await supabase
      .from('card_results')
      .update(updateData)
      .eq('id', cardId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Update image_path error:', error);
      return NextResponse.json(
        { error: 'Failed to update image path' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Card image update error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
