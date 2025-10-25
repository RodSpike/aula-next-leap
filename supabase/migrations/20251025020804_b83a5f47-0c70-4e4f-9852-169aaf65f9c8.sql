-- Add audio columns to lessons table
ALTER TABLE lessons 
ADD COLUMN audio_url text,
ADD COLUMN audio_segments jsonb,
ADD COLUMN audio_duration numeric,
ADD COLUMN audio_generated_at timestamp with time zone;

-- Create lesson-audio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-audio', 'lesson-audio', true);

-- RLS policies for lesson-audio bucket
CREATE POLICY "Public can view lesson audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-audio');

CREATE POLICY "Admins can upload lesson audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-audio' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete lesson audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-audio' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);