-- Create table for video likes
CREATE TABLE public.english_tv_video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate likes
ALTER TABLE public.english_tv_video_likes 
ADD CONSTRAINT unique_user_video_like UNIQUE (user_id, video_id);

-- Enable Row Level Security
ALTER TABLE public.english_tv_video_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view all video likes" 
ON public.english_tv_video_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can add their own likes" 
ON public.english_tv_video_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.english_tv_video_likes 
FOR DELETE 
USING (auth.uid() = user_id);