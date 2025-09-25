-- Fix the lesson_content section_type constraint to include all valid types
ALTER TABLE public.lesson_content DROP CONSTRAINT IF EXISTS lesson_content_section_type_check;

-- Add the updated constraint with all valid section types
ALTER TABLE public.lesson_content ADD CONSTRAINT lesson_content_section_type_check 
CHECK (section_type IN ('introduction', 'grammar', 'vocabulary', 'reading', 'speaking', 'writing', 'practice', 'explanation', 'summary', 'culture', 'pronunciation', 'dialogue'));

-- Also update any existing 'explanation' entries to use a valid type
UPDATE public.lesson_content SET section_type = 'introduction' WHERE section_type = 'explanation';