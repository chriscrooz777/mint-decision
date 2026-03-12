-- ==============================================
-- Mint Decision AI — Migration 002
-- Adds: mint_id column, RPC functions, DELETE policy
-- ==============================================

-- 1. Add mint_id column (nullable for backfill)
ALTER TABLE public.card_results
  ADD COLUMN mint_id INTEGER;

-- 2. Backfill existing rows with sequential numbers per user
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.card_results
)
UPDATE public.card_results cr
SET mint_id = numbered.rn
FROM numbered
WHERE cr.id = numbered.id;

-- 3. Make NOT NULL after backfill
ALTER TABLE public.card_results
  ALTER COLUMN mint_id SET NOT NULL;

-- 4. Unique constraint per user + index for fast lookups
ALTER TABLE public.card_results
  ADD CONSTRAINT uq_card_results_user_mint_id UNIQUE (user_id, mint_id);

CREATE INDEX idx_card_results_user_mint_id
  ON public.card_results(user_id, mint_id DESC);

-- 5. RPC: Get next mint_id for a single card (atomic)
CREATE OR REPLACE FUNCTION public.next_mint_id(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(mint_id), 0) + 1
  INTO next_id
  FROM public.card_results
  WHERE user_id = p_user_id;
  RETURN next_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Reserve a batch of mint_ids for multi-scan (returns start ID)
CREATE OR REPLACE FUNCTION public.next_mint_ids(
  p_user_id UUID,
  p_count INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  start_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(mint_id), 0) + 1
  INTO start_id
  FROM public.card_results
  WHERE user_id = p_user_id;
  RETURN start_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. DELETE policy on card_results (needed for swipe-to-delete)
CREATE POLICY "Users can delete own card results"
  ON public.card_results
  FOR DELETE
  USING (auth.uid() = user_id);
