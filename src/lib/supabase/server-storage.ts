import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'card-images';

/**
 * Upload a card image to Supabase Storage from the server side.
 * Returns the storage path or null on failure.
 */
export async function uploadCardImageServer(
  supabase: SupabaseClient,
  imageBuffer: Buffer,
  userId: string,
  cardResultId: string
): Promise<string | null> {
  const path = `${userId}/${cardResultId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Server storage upload error:', error);
    return null;
  }

  return path;
}

/**
 * Upload a back-of-card image to Supabase Storage from the server side.
 * Uses a "_back" suffix to distinguish from the front image.
 */
export async function uploadCardBackImageServer(
  supabase: SupabaseClient,
  imageBuffer: Buffer,
  userId: string,
  cardResultId: string
): Promise<string | null> {
  const path = `${userId}/${cardResultId}_back.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Server storage back image upload error:', error);
    return null;
  }

  return path;
}
