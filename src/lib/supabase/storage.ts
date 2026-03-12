import { createClient } from '@/lib/supabase/client';

const BUCKET = 'card-images';

/**
 * Upload a card thumbnail image to Supabase Storage.
 * Returns the storage path (e.g. "{userId}/{cardResultId}.jpg")
 * or null on failure.
 */
export async function uploadCardImage(
  blob: Blob,
  userId: string,
  cardResultId: string
): Promise<string | null> {
  const supabase = createClient();
  const path = `${userId}/${cardResultId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }

  return path;
}

/**
 * Upload the back-of-card image to Supabase Storage (Deep Evaluation only).
 * Stored with a "_back" suffix to distinguish from front.
 */
export async function uploadCardBackImage(
  blob: Blob,
  userId: string,
  cardResultId: string
): Promise<string | null> {
  const supabase = createClient();
  const path = `${userId}/${cardResultId}_back.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Storage back image upload error:', error);
    return null;
  }

  return path;
}

/**
 * Get a public URL for a card image stored in Supabase Storage.
 * Returns the URL string, or null if imagePath is falsy.
 */
export function getCardImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  const supabase = createClient();
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(imagePath);
  return data?.publicUrl || null;
}
