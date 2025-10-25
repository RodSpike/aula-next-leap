-- Create pronunciation evaluations table
CREATE TABLE IF NOT EXISTS public.pronunciation_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  audio_url TEXT,
  transcription TEXT NOT NULL,
  expected_text TEXT,
  detected_language TEXT NOT NULL,
  pronunciation_score INTEGER CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
  grammar_score INTEGER CHECK (grammar_score >= 0 AND grammar_score <= 100),
  fluency_score INTEGER CHECK (fluency_score >= 0 AND fluency_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  corrected_text TEXT,
  context TEXT DEFAULT 'practice',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pronunciation_evaluations_user_id ON public.pronunciation_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_evaluations_lesson_id ON public.pronunciation_evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_evaluations_created_at ON public.pronunciation_evaluations(created_at DESC);

-- Enable RLS
ALTER TABLE public.pronunciation_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pronunciation evaluations"
  ON public.pronunciation_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pronunciation evaluations"
  ON public.pronunciation_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pronunciation evaluations"
  ON public.pronunciation_evaluations FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pronunciation_evaluations_updated_at
  BEFORE UPDATE ON public.pronunciation_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();