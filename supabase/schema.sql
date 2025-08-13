-- PromptCraft Studio - Complete Database Schema
-- Run this entire file in your Supabase SQL Editor to set up the database

-- Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  parent_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_versions table
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL,
  response TEXT NOT NULL,
  response_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_sessions table for tracking prompt test runs
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  test_input TEXT,
  results JSONB NOT NULL,
  models_tested TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Prompts policies
CREATE POLICY "Users can view own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = user_id);

-- Prompt versions policies
CREATE POLICY "Users can view own prompt versions" ON public.prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_versions.prompt_id
      AND prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own prompt versions" ON public.prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_versions.prompt_id
      AND prompts.user_id = auth.uid()
    )
  );

-- Tests policies
CREATE POLICY "Users can view own tests" ON public.tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = tests.prompt_id
      AND prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tests" ON public.tests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = tests.prompt_id
      AND prompts.user_id = auth.uid()
    )
  );

-- Test sessions policies
CREATE POLICY "Users can view own test sessions" ON public.test_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test sessions" ON public.test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions" ON public.test_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test sessions" ON public.test_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON public.prompts(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_parent ON public.prompts(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_tests_prompt_id ON public.tests(prompt_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_created_at ON public.test_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_test_sessions_prompt_id ON public.test_sessions(prompt_id);

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 