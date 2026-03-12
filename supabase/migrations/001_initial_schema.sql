-- ==============================================
-- Mint Decision AI — Initial Database Schema
-- ==============================================

-- 1. Profiles (extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Scans
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('multi', 'single')),
  image_front_path TEXT,
  image_back_path TEXT,
  card_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  raw_ai_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_created_at ON public.scans(created_at DESC);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
  ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scans"
  ON public.scans FOR UPDATE USING (auth.uid() = user_id);


-- 3. Card Results
CREATE TABLE public.card_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_index INTEGER NOT NULL DEFAULT 0,

  -- Identification
  player_name TEXT NOT NULL,
  card_year TEXT,
  card_set TEXT,
  card_number TEXT,
  sport TEXT,
  manufacturer TEXT,
  condition_summary TEXT,

  -- Valuation
  raw_price_low NUMERIC(10,2),
  raw_price_high NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- PSA Recommendation (multi-scan)
  psa_recommendation TEXT
    CHECK (psa_recommendation IN ('yes', 'no', 'maybe')),
  psa_recommendation_reason TEXT,

  -- Detailed Grading (single-scan)
  centering_score NUMERIC(3,1),
  corners_score NUMERIC(3,1),
  edges_score NUMERIC(3,1),
  surface_score NUMERIC(3,1),
  estimated_psa_grade_low NUMERIC(3,1),
  estimated_psa_grade_high NUMERIC(3,1),
  grading_explanation TEXT,
  grade_improvement_tips TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_results_scan_id ON public.card_results(scan_id);
CREATE INDEX idx_card_results_user_id ON public.card_results(user_id);

ALTER TABLE public.card_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card results"
  ON public.card_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card results"
  ON public.card_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card results"
  ON public.card_results FOR UPDATE USING (auth.uid() = user_id);


-- 4. Collection Cards
CREATE TABLE public.collection_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_result_id UUID REFERENCES public.card_results(id) ON DELETE SET NULL,

  player_name TEXT NOT NULL,
  card_year TEXT,
  card_set TEXT,
  card_number TEXT,
  sport TEXT,
  manufacturer TEXT,
  estimated_value_low NUMERIC(10,2),
  estimated_value_high NUMERIC(10,2),
  psa_grade NUMERIC(3,1),
  image_path TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collection_user_id ON public.collection_cards(user_id);
CREATE INDEX idx_collection_sport ON public.collection_cards(sport);
CREATE INDEX idx_collection_player ON public.collection_cards(player_name);

ALTER TABLE public.collection_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection"
  ON public.collection_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collection"
  ON public.collection_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collection"
  ON public.collection_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collection"
  ON public.collection_cards FOR DELETE USING (auth.uid() = user_id);


-- 5. Scan Usage
CREATE TABLE public.scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, month_year)
);

CREATE INDEX idx_scan_usage_user_month ON public.scan_usage(user_id, month_year);

ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.scan_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage"
  ON public.scan_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage"
  ON public.scan_usage FOR UPDATE USING (auth.uid() = user_id);


-- 6. Helper function: Increment scan usage (upsert)
CREATE OR REPLACE FUNCTION public.increment_scan_usage(
  p_user_id UUID,
  p_month_year TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.scan_usage (user_id, month_year, scan_count)
  VALUES (p_user_id, p_month_year, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET scan_count = scan_usage.scan_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Storage bucket (run this in Supabase Dashboard > Storage)
-- Create bucket: card-images
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/heic
