-- Create lesson_content table for structured educational content
CREATE TABLE IF NOT EXISTS public.lesson_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing', 'exercise', 'assessment')),
  title TEXT NOT NULL,
  explanation TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  content JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view lesson content" 
ON public.lesson_content 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage lesson content" 
ON public.lesson_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_lesson_content_updated_at
  BEFORE UPDATE ON public.lesson_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update exercises table to support more question types
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS exercise_type TEXT DEFAULT 'multiple_choice';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;

-- Add constraint for exercise_type
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_exercise_type_check 
CHECK (exercise_type IN ('multiple_choice', 'fill_blank', 'true_false', 'essay', 'speaking', 'listening'));

-- Create user_exercise_attempts for tracking student progress
CREATE TABLE IF NOT EXISTS public.user_exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN,
  score NUMERIC DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_exercise_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_exercise_attempts
CREATE POLICY "Users can view their own attempts" 
ON public.user_exercise_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts" 
ON public.user_exercise_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts" 
ON public.user_exercise_attempts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));