-- ============================================================
-- AI Personal Learning OS — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── User Profiles Table ─────────────────────────────────────
-- Mirrors auth.users and stores public user info.
-- Automatically populated on signup via the trigger below.
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT UNIQUE NOT NULL,
    full_name     TEXT DEFAULT '',
    avatar_url    TEXT DEFAULT '',
    role          TEXT NOT NULL DEFAULT 'student'     -- 'student' | 'admin'
                      CHECK (role IN ('student', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Auth Sessions Table ──────────────────────────────────────
-- Records every login / logout event for audit purposes.
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event         TEXT NOT NULL DEFAULT 'login'       -- 'login' | 'logout' | 'register'
                      CHECK (event IN ('login', 'logout', 'register')),
    ip_address    TEXT DEFAULT '',
    user_agent    TEXT DEFAULT '',
    device_hint   TEXT DEFAULT '',                    -- e.g. 'Chrome on Windows'
    status        TEXT NOT NULL DEFAULT 'success'     -- 'success' | 'failed'
                      CHECK (status IN ('success', 'failed')),
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Documents Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'pdf',
    chunk_count INTEGER NOT NULL DEFAULT 0,
    file_size BIGINT DEFAULT 0,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Quizzes Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    document_ids TEXT[] DEFAULT '{}',
    topic TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Quiz Results Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    wrong_answers JSONB DEFAULT '[]'::jsonb,
    weak_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Roadmaps Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    total_days INTEGER DEFAULT 28,
    total_weeks INTEGER DEFAULT 4,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    adapted_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Flashcard Decks Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cards JSONB NOT NULL DEFAULT '[]'::jsonb,
    topic TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Activities Table (Learning Analytics) ───────────────────
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    topic TEXT DEFAULT '',
    score REAL,
    time_spent_minutes INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email    ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id  ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_event    ON public.auth_sessions(event);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_created  ON public.auth_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);


-- ============================================================
-- Row Level Security (RLS) — Users can only access their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Auth Sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.auth_sessions;
CREATE POLICY "Users can view own sessions" ON public.auth_sessions
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.auth_sessions;
CREATE POLICY "Users can insert own sessions" ON public.auth_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents policies
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Quizzes policies
DROP POLICY IF EXISTS "Users can view own quizzes" ON public.quizzes;
CREATE POLICY "Users can view own quizzes" ON public.quizzes
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own quizzes" ON public.quizzes;
CREATE POLICY "Users can insert own quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quiz Results policies
DROP POLICY IF EXISTS "Users can view own quiz results" ON public.quiz_results;
CREATE POLICY "Users can view own quiz results" ON public.quiz_results
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own quiz results" ON public.quiz_results;
CREATE POLICY "Users can insert own quiz results" ON public.quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Roadmaps policies
DROP POLICY IF EXISTS "Users can view own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can view own roadmaps" ON public.roadmaps
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can insert own roadmaps" ON public.roadmaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can update own roadmaps" ON public.roadmaps
    FOR UPDATE USING (auth.uid() = user_id);

-- Flashcard Decks policies
DROP POLICY IF EXISTS "Users can view own flashcards" ON public.flashcard_decks;
CREATE POLICY "Users can view own flashcards" ON public.flashcard_decks
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own flashcards" ON public.flashcard_decks;
CREATE POLICY "Users can insert own flashcards" ON public.flashcard_decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activities policies
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- Service Role Bypass — Allow backend (service_role key) full access
-- ============================================================
DROP POLICY IF EXISTS "Service role full access user_profiles" ON public.user_profiles;
CREATE POLICY "Service role full access user_profiles" ON public.user_profiles
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access auth_sessions" ON public.auth_sessions;
CREATE POLICY "Service role full access auth_sessions" ON public.auth_sessions
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access documents" ON public.documents;
CREATE POLICY "Service role full access documents" ON public.documents
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access quizzes" ON public.quizzes;
CREATE POLICY "Service role full access quizzes" ON public.quizzes
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access quiz_results" ON public.quiz_results;
CREATE POLICY "Service role full access quiz_results" ON public.quiz_results
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access roadmaps" ON public.roadmaps;
CREATE POLICY "Service role full access roadmaps" ON public.roadmaps
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access flashcard_decks" ON public.flashcard_decks;
CREATE POLICY "Service role full access flashcard_decks" ON public.flashcard_decks
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access activities" ON public.activities;
CREATE POLICY "Service role full access activities" ON public.activities
    FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- Trigger: auto-create user_profile row on new signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;

    -- Log the registration event
    INSERT INTO public.auth_sessions (user_id, event, status)
    VALUES (NEW.id, 'register', 'success');

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (fires after every INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: keep updated_at fresh on user_profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
