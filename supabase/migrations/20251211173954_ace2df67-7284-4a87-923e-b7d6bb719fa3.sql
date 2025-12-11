-- Create table for AI Teachers configuration
CREATE TABLE public.ai_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  personality TEXT NOT NULL,
  personality_traits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI posting settings
CREATE TABLE public.ai_posting_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_frequency_hours INTEGER NOT NULL DEFAULT 12,
  tip_frequency_hours INTEGER NOT NULL DEFAULT 6,
  last_interaction_run TIMESTAMP WITH TIME ZONE,
  last_tip_run TIMESTAMP WITH TIME ZONE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_posting_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_teachers - admins can manage
CREATE POLICY "Admins can view ai_teachers"
ON public.ai_teachers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ai_teachers"
ON public.ai_teachers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ai_teachers"
ON public.ai_teachers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ai_teachers"
ON public.ai_teachers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for ai_posting_settings
CREATE POLICY "Admins can view ai_posting_settings"
ON public.ai_posting_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ai_posting_settings"
ON public.ai_posting_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert the 4 AI teachers with their personalities
INSERT INTO public.ai_teachers (name, email, personality, personality_traits) VALUES
('Júnior', 'junior.ai@aulaclick.com', 'playful', '{"style": "brincalhão e amigável", "approach": "explica com exemplos divertidos e criativos", "tone": "descontraído mas educativo", "examples": "usa analogias do dia-a-dia e humor"}'),
('Maria', 'maria.ai@aulaclick.com', 'serious', '{"style": "séria e direta", "approach": "usa exemplos clássicos e sempre sugere atividades", "tone": "educada e profissional", "examples": "referências a literatura e situações formais"}'),
('Vitória', 'vitoria.ai@aulaclick.com', 'helpful', '{"style": "simpática e prestativa", "approach": "traz vocabulário e expressões úteis", "tone": "participativa e encorajadora", "examples": "expressões idiomáticas e vocabulário prático"}'),
('Juliana', 'juliana.ai@aulaclick.com', 'concise', '{"style": "simpática porém direta", "approach": "explicações curtas que atingem o objetivo", "tone": "objetiva e eficiente", "examples": "respostas precisas e práticas"}');

-- Insert default posting settings
INSERT INTO public.ai_posting_settings (interaction_frequency_hours, tip_frequency_hours) VALUES (12, 6);

-- Function to check if a user is an AI teacher
CREATE OR REPLACE FUNCTION public.is_ai_teacher(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ai_teachers WHERE email = user_email AND is_active = true
  )
$$;

-- Function to get AI teacher by email
CREATE OR REPLACE FUNCTION public.get_ai_teacher_personality(teacher_email TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'name', name,
    'personality', personality,
    'traits', personality_traits
  )
  FROM public.ai_teachers 
  WHERE email = teacher_email AND is_active = true
  LIMIT 1
$$;