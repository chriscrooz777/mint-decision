-- Add back_image_path column for storing back-of-card images (Deep Evaluation scans)
ALTER TABLE public.card_results
  ADD COLUMN IF NOT EXISTS back_image_path TEXT;
