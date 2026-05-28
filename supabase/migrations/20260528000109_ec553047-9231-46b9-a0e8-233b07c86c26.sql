
-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Game scores
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  accuracy NUMERIC GENERATED ALWAYS AS (CASE WHEN total = 0 THEN 0 ELSE correct::numeric / total END) STORED,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX game_scores_game_user_idx ON public.game_scores(game_id, user_id);
CREATE INDEX game_scores_game_correct_idx ON public.game_scores(game_id, correct DESC, accuracy DESC);
GRANT SELECT ON public.game_scores TO anon;
GRANT SELECT, INSERT ON public.game_scores TO authenticated;
GRANT ALL ON public.game_scores TO service_role;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scores are viewable by everyone" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Users insert own scores" ON public.game_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup, populate from Google identity metadata when present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leaderboard view: best score per user per game
CREATE OR REPLACE VIEW public.user_best_scores
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (gs.user_id, gs.game_id)
  gs.user_id,
  gs.game_id,
  gs.correct,
  gs.total,
  gs.accuracy,
  gs.played_at,
  p.display_name,
  p.avatar_url
FROM public.game_scores gs
LEFT JOIN public.profiles p ON p.id = gs.user_id
ORDER BY gs.user_id, gs.game_id, gs.correct DESC, gs.accuracy DESC, gs.played_at ASC;

GRANT SELECT ON public.user_best_scores TO anon, authenticated;
