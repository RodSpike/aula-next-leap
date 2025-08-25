-- Create tables for tracking user learning data

-- Table for user courses
CREATE TABLE public.user_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_name TEXT NOT NULL,
  course_description TEXT,
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking study sessions and hours
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.user_courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_studied DECIMAL(4,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for certificates earned
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_name TEXT NOT NULL,
  certificate_type TEXT DEFAULT 'completion',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_courses
CREATE POLICY "Users can view their own courses" 
ON public.user_courses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" 
ON public.user_courses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" 
ON public.user_courses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all courses" 
ON public.user_courses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" 
ON public.study_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions" 
ON public.study_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" 
ON public.study_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all study sessions" 
ON public.study_sessions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for certificates
CREATE POLICY "Users can view their own certificates" 
ON public.certificates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates" 
ON public.certificates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates" 
ON public.certificates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_user_courses_updated_at
BEFORE UPDATE ON public.user_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing (optional - will only insert if no data exists)
INSERT INTO public.user_courses (user_id, course_name, course_description, total_lessons, completed_lessons, status)
SELECT 
  p.user_id,
  'English Fundamentals',
  'Master the basics of English grammar and vocabulary',
  10,
  3,
  'active'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_courses WHERE user_id = p.user_id)
LIMIT 5;

INSERT INTO public.user_courses (user_id, course_name, course_description, total_lessons, completed_lessons, status)
SELECT 
  p.user_id,
  'Conversation Practice',
  'Improve your speaking skills through interactive exercises',
  8,
  1,
  'active'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_courses WHERE user_id = p.user_id AND course_name = 'Conversation Practice')
LIMIT 3;

-- Insert study sessions for this week and last week
INSERT INTO public.study_sessions (user_id, course_id, session_date, hours_studied)
SELECT 
  uc.user_id,
  uc.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 6),
  CASE 
    WHEN random() > 0.3 THEN ROUND((random() * 3)::numeric, 1)
    ELSE 0
  END
FROM public.user_courses uc
WHERE NOT EXISTS (SELECT 1 FROM public.study_sessions WHERE user_id = uc.user_id);

-- Insert some certificates
INSERT INTO public.certificates (user_id, course_name, certificate_type, issued_date)
SELECT 
  p.user_id,
  'Basic English Certificate',
  'completion',
  CURRENT_DATE - INTERVAL '30 days'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id = p.user_id)
LIMIT 2;