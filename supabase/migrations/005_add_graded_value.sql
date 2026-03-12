-- Add graded value columns (estimated value IF graded at the predicted PSA grade)
ALTER TABLE public.card_results
  ADD COLUMN IF NOT EXISTS graded_value_low NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS graded_value_high NUMERIC(10,2);
