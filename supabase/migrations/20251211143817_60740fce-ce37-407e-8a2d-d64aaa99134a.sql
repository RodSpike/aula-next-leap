-- Create table to store placement test attempts with answer history
CREATE TABLE public.placement_test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  version_id UUID REFERENCES placement_test_versions(id),
  final_level TEXT NOT NULL,
  score NUMERIC,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.placement_test_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view own placement test attempts"
ON public.placement_test_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own placement test attempts"
ON public.placement_test_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all attempts
CREATE POLICY "Admins can view all placement test attempts"
ON public.placement_test_attempts
FOR SELECT
USING (user_has_admin_role(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_placement_test_attempts_user_id ON public.placement_test_attempts(user_id);
CREATE INDEX idx_placement_test_attempts_completed_at ON public.placement_test_attempts(completed_at DESC);