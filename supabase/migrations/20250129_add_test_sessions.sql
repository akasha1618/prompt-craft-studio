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

-- Enable RLS on test_sessions
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_sessions
CREATE POLICY "Users can view own test sessions" ON public.test_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test sessions" ON public.test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions" ON public.test_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test sessions" ON public.test_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX idx_test_sessions_created_at ON public.test_sessions(created_at);
CREATE INDEX idx_test_sessions_prompt_id ON public.test_sessions(prompt_id); 