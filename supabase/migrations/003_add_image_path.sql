-- ==============================================
-- Mint Decision AI — Migration 003
-- Adds: image_path column to card_results
-- ==============================================

-- Nullable — existing cards without images fall back to sport text badge
ALTER TABLE public.card_results
  ADD COLUMN IF NOT EXISTS image_path TEXT;
