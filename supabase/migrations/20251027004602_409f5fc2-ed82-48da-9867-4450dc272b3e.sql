-- Create table for English TV videos
CREATE TABLE public.english_tv_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.english_tv_videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view videos
CREATE POLICY "Everyone can view English TV videos"
ON public.english_tv_videos
FOR SELECT
USING (true);

-- Only admins can insert videos
CREATE POLICY "Admins can insert English TV videos"
ON public.english_tv_videos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update videos
CREATE POLICY "Admins can update English TV videos"
ON public.english_tv_videos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete videos
CREATE POLICY "Admins can delete English TV videos"
ON public.english_tv_videos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_english_tv_videos_order ON public.english_tv_videos(order_index);