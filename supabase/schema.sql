-- ==============================================================================
-- PolicySnap - Supabase Database Schema & Automation Triggers
-- Architecture: PostgreSQL + Supabase Cloud
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTION: XP TO RANK CONVERSION
-- Menetapkan 7 Strata Pangkat Gamifikasi Publik sesuai FR-7
CREATE OR REPLACE FUNCTION get_rank_for_xp(xp_val INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF xp_val >= 5001 THEN
    RETURN 'negarawan';
  ELSIF xp_val >= 2501 THEN
    RETURN 'menteri-bayangan';
  ELSIF xp_val >= 1001 THEN
    RETURN 'advokat-kebijakan';
  ELSIF xp_val >= 501 THEN
    RETURN 'konsultan';
  ELSIF xp_val >= 201 THEN
    RETURN 'auditor-regulasi';
  ELSIF xp_val >= 51 THEN
    RETURN 'netizen-kritis';
  ELSE
    RETURN 'warga-aktif';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. TABLE: PROFILES (User Gamification & Cat Avatar)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Warga Publik',
  email TEXT,
  avatar TEXT DEFAULT '',
  total_xp INTEGER NOT NULL DEFAULT 0,
  rank_level TEXT NOT NULL DEFAULT 'warga-aktif',
  evaluations_count INTEGER NOT NULL DEFAULT 0,
  cat_avatar JSONB NOT NULL DEFAULT '{
    "gender": "boy",
    "breed": "domestic-shorthair",
    "colors": {
      "fur": "#F97316",
      "chest": "#FED7AA",
      "eyes": "#10B981"
    },
    "equippedCostumes": {
      "hat": "",
      "glasses": "",
      "outfit": "",
      "accessory": ""
    },
    "catName": "Kocheng Kebijakan"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: ISSUES (Kebijakan Publik yang Dievaluasi)
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Pendidikan & Kesehatan',
  source_url TEXT DEFAULT '',
  actor_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  total_evaluations INTEGER NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  criteria_descriptions JSONB,
  actor_cards JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLE: EVALUATIONS (Penilaian Metodologis Pengguna)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id TEXT PRIMARY KEY DEFAULT ('eval-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  scores JSONB NOT NULL, -- { effectiveness: 8, efficiency: 7, equity: 5, responsiveness: 6 }
  composite_score NUMERIC(4, 2) NOT NULL DEFAULT 6.5,
  actor_votes JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "actor-1": "approve", "actor-2": "reject" }
  stance TEXT NOT NULL DEFAULT 'Dukung Bersyarat',
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_issue_eval UNIQUE (user_id, issue_id) -- FR-3: 1 user hanya 1 kali evaluasi per isu
);

-- 6. TABLE: ARGUMENTS (Komentar Berbobot untuk Top Arguments)
CREATE TABLE IF NOT EXISTS public.arguments (
  id TEXT PRIMARY KEY DEFAULT ('arg-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  stance TEXT NOT NULL DEFAULT 'Dukung Bersyarat',
  comment TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  net_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLE: ARGUMENT_VOTES (Upvote / Downvote Komunitas)
CREATE TABLE IF NOT EXISTS public.argument_votes (
  id TEXT PRIMARY KEY DEFAULT ('vote-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
  argument_id TEXT NOT NULL REFERENCES public.arguments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_argument_vote UNIQUE (argument_id, user_id) -- FR-4: 1 vote per user per argumen
);

-- 8. TABLE: AUTH_CREDENTIALS (hash password login email; hanya diakses server)
CREATE TABLE IF NOT EXISTS public.auth_credentials (
  email TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- tanpa FK: kredensial dibuat sebelum profil di-upsert
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DATABASE TRIGGERS & AUTOMATION
-- ==============================================================================

-- A. TRIGGER: Automatic XP & Evaluations Count upon Evaluation Submission
CREATE OR REPLACE FUNCTION handle_new_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  v_arg_id TEXT;
BEGIN
  UPDATE public.profiles
  SET
    total_xp = total_xp + 10,
    evaluations_count = evaluations_count + 1,
    rank_level = get_rank_for_xp(total_xp + 10),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  UPDATE public.issues
  SET total_evaluations = total_evaluations + 1
  WHERE id = NEW.issue_id;

  IF NEW.comment IS NOT NULL AND LENGTH(TRIM(NEW.comment)) > 0 THEN
    v_arg_id := 'arg-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);

    INSERT INTO public.arguments (id, user_id, issue_id, stance, comment, upvotes, downvotes, net_votes)
    VALUES (v_arg_id, NEW.user_id, NEW.issue_id, NEW.stance, TRIM(NEW.comment), 0, 0, 0)
    ON CONFLICT DO NOTHING;

    -- Self-upvote (trigger vote menghitung ulang upvotes = 1, tanpa XP untuk diri sendiri)
    INSERT INTO public.argument_votes (argument_id, user_id, vote_type)
    VALUES (v_arg_id, NEW.user_id, 'up')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_after_evaluation_insert ON public.evaluations;
CREATE TRIGGER tr_after_evaluation_insert
AFTER INSERT ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION handle_new_evaluation();

-- B. TRIGGER: Automatic Vote Aggregation and XP Award on Upvote
CREATE OR REPLACE FUNCTION handle_argument_vote_change()
RETURNS TRIGGER AS $$
DECLARE
  v_arg_author_id TEXT;
  v_target_arg_id TEXT;
  v_voter_id TEXT;
  v_up_count INTEGER;
  v_down_count INTEGER;
  v_xp_delta INTEGER := 0;
BEGIN
  v_target_arg_id := COALESCE(NEW.argument_id, OLD.argument_id);
  v_voter_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'up'),
    COUNT(*) FILTER (WHERE vote_type = 'down')
  INTO v_up_count, v_down_count
  FROM public.argument_votes
  WHERE argument_id = v_target_arg_id;

  UPDATE public.arguments
  SET
    upvotes = v_up_count,
    downvotes = v_down_count,
    net_votes = (v_up_count - v_down_count)
  WHERE id = v_target_arg_id
  RETURNING user_id INTO v_arg_author_id;

  IF TG_OP = 'INSERT' AND NEW.vote_type = 'up' THEN
    v_xp_delta := 1;
  ELSIF TG_OP = 'DELETE' AND OLD.vote_type = 'up' THEN
    v_xp_delta := -1;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote_type <> NEW.vote_type THEN
    v_xp_delta := CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END;
  END IF;

  IF v_xp_delta <> 0 AND v_arg_author_id IS NOT NULL AND v_arg_author_id <> v_voter_id THEN
    UPDATE public.profiles
    SET
      total_xp = GREATEST(0, total_xp + v_xp_delta),
      rank_level = get_rank_for_xp(GREATEST(0, total_xp + v_xp_delta)),
      updated_at = NOW()
    WHERE id = v_arg_author_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_argument_vote_sync ON public.argument_votes;
CREATE TRIGGER tr_argument_vote_sync
AFTER INSERT OR UPDATE OR DELETE ON public.argument_votes
FOR EACH ROW EXECUTE FUNCTION handle_argument_vote_change();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.argument_votes ENABLE ROW LEVEL SECURITY;

-- Allow Public Read
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Public Read Evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "Public Read Arguments" ON public.arguments FOR SELECT USING (true);
CREATE POLICY "Public Read Votes" ON public.argument_votes FOR SELECT USING (true);

ALTER TABLE public.auth_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_credentials FROM anon, authenticated;

-- Tidak ada policy INSERT/UPDATE/DELETE: semua penulisan lewat API server (service role
-- melewati RLS). Anon key yang terekspos di browser hanya bisa membaca data publik.

-- Email pengguna tidak boleh terbaca publik lewat anon key
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, name, avatar, total_xp, rank_level, evaluations_count, cat_avatar, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
