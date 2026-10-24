-- ==============================================================================
-- PolicySnap - Migrasi P0: Keamanan & Integritas Data (2026-10-24)
-- Jalankan sekali di Supabase SQL Editor untuk database yang sudah ada.
-- Aman dijalankan ulang (idempotent). schema.sql sudah memuat perubahan yang sama.
-- ==============================================================================

-- 1. Kredensial login email (hash scrypt). Hanya diakses server via service role.
CREATE TABLE IF NOT EXISTS public.auth_credentials (
  email TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- tanpa FK: kredensial dibuat sebelum profil di-upsert
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.auth_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_credentials FROM anon, authenticated;

-- 2. XP awal pengguna baru = 0 (PRD FR-7: Level 1 mulai dari 0 XP)
ALTER TABLE public.profiles ALTER COLUMN total_xp SET DEFAULT 0;

-- 3. Tutup semua akses tulis dari anon key. Penulisan hanya lewat API server (service role).
DROP POLICY IF EXISTS "Allow All Inserts Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow All Updates Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow All Inserts Issues" ON public.issues;
DROP POLICY IF EXISTS "Allow All Updates Issues" ON public.issues;
DROP POLICY IF EXISTS "Allow All Inserts Evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Allow All Inserts Arguments" ON public.arguments;
DROP POLICY IF EXISTS "Allow All Inserts Votes" ON public.argument_votes;
DROP POLICY IF EXISTS "Allow All Deletes Votes" ON public.argument_votes;

-- 4. Email pengguna tidak boleh terbaca publik lewat anon key
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, name, avatar, total_xp, rank_level, evaluations_count, cat_avatar, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- 5. Trigger evaluasi: argumen otomatis kini disertai self-upvote di argument_votes,
--    agar hitungan upvote tidak "hilang" saat vote pertama dihitung ulang.
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

-- 6. Trigger vote: XP +1/-1 untuk penulis juga saat vote diganti (up<->down),
--    dan tidak ada XP dari vote penulis pada argumennya sendiri.
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
