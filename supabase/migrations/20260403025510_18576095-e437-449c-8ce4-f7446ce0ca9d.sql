
-- Add flashcards JSONB column to teacher_guides
ALTER TABLE public.teacher_guides ADD COLUMN IF NOT EXISTS flashcards jsonb DEFAULT '[]'::jsonb;

-- Create teacher-guide-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-guide-images', 'teacher-guide-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket
CREATE POLICY "Public read access for teacher guide images"
ON storage.objects FOR SELECT
USING (bucket_id = 'teacher-guide-images');

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload teacher guide images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'teacher-guide-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to upload (edge functions)
CREATE POLICY "Service role can manage teacher guide images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'teacher-guide-images');
