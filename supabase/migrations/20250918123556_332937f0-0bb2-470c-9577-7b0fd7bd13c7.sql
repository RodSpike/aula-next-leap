-- Create post_likes table for Instagram-style likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create post_comments table for Instagram-style comments  
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on post_comments  
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Users can like posts in groups they're members of" 
ON public.post_likes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM group_members gm 
    JOIN group_posts gp ON gm.group_id = gp.group_id 
    WHERE gm.user_id = auth.uid() 
    AND gm.status = 'accepted' 
    AND gp.id = post_id
  )
);

CREATE POLICY "Users can unlike their own likes" 
ON public.post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes in accessible groups" 
ON public.post_likes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    JOIN group_posts gp ON gm.group_id = gp.group_id 
    WHERE gm.user_id = auth.uid() 
    AND gm.status = 'accepted' 
    AND gp.id = post_id
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for post_comments
CREATE POLICY "Users can comment on posts in groups they're members of" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM group_members gm 
    JOIN group_posts gp ON gm.group_id = gp.group_id 
    WHERE gm.user_id = auth.uid() 
    AND gm.status = 'accepted' 
    AND gp.id = post_id
  )
);

CREATE POLICY "Users can view comments in accessible groups" 
ON public.post_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    JOIN group_posts gp ON gm.group_id = gp.group_id 
    WHERE gm.user_id = auth.uid() 
    AND gm.status = 'accepted' 
    AND gp.id = post_id
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comments" 
ON public.post_comments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updating updated_at on comments
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add archived field to community_groups for soft deletion
ALTER TABLE public.community_groups ADD COLUMN archived BOOLEAN DEFAULT false;

-- Remove objective field from community_groups (as requested)
ALTER TABLE public.community_groups DROP COLUMN IF EXISTS objective;