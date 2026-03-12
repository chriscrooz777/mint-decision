import { SupabaseClient } from '@supabase/supabase-js';

const FREE_RESULTS_LIMIT = 5;

/**
 * For free-tier users, keep only the latest 5 card_results.
 * Deletes the oldest excess rows and their associated storage images.
 */
export async function cleanupFreeResults(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Count total card_results for this user
  const { count: totalResults } = await supabase
    .from('card_results')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const excess = (totalResults || 0) - FREE_RESULTS_LIMIT;
  if (excess <= 0) return;

  // Fetch the oldest excess rows
  const { data: oldCards } = await supabase
    .from('card_results')
    .select('id, image_path, back_image_path')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(excess);

  if (!oldCards || oldCards.length === 0) return;

  const idsToDelete = oldCards.map((c) => c.id);

  // Collect storage paths to clean up
  const pathsToRemove: string[] = [];
  for (const c of oldCards) {
    if (c.image_path) pathsToRemove.push(c.image_path);
    if (c.back_image_path) pathsToRemove.push(c.back_image_path);
  }

  // Delete from card_results
  await supabase
    .from('card_results')
    .delete()
    .in('id', idsToDelete);

  // Clean up storage images
  if (pathsToRemove.length > 0) {
    await supabase.storage
      .from('card-images')
      .remove(pathsToRemove);
  }
}
