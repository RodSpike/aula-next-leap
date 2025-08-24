-- Add username to profiles table
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create friends table for friend relationships
CREATE TABLE public.friends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  requested_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, requested_id),
  CONSTRAINT no_self_friend CHECK (requester_id != requested_id)
);

-- Enable RLS on friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- RLS policies for friends table
CREATE POLICY "Users can view their own friend requests" 
ON public.friends 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = requested_id);

CREATE POLICY "Users can send friend requests" 
ON public.friends 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friend requests they received" 
ON public.friends 
FOR UPDATE 
USING (auth.uid() = requested_id);

CREATE POLICY "Users can delete their own friend requests" 
ON public.friends 
FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- Add file attachments to community posts
ALTER TABLE public.group_posts ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for community files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-files', 'community-files', true);

-- Storage policies for community files
CREATE POLICY "Users can upload community files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view community files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'community-files');

CREATE POLICY "Users can update their own community files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own community files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles RLS to allow viewing usernames for friend search
CREATE POLICY "Users can search profiles by username" 
ON public.profiles 
FOR SELECT 
USING (true);