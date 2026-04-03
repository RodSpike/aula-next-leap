ALTER TABLE public.teacher_guides 
ADD COLUMN IF NOT EXISTS screen_share_content jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS homework_suggestions text[] DEFAULT '{}'::text[];