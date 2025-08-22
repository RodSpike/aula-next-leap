-- Fix group_members RLS policies to allow users to join default groups
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group creators can invite members" ON public.group_members;
DROP POLICY IF EXISTS "Users can accept their own invitations" ON public.group_members;

-- Create new policies that allow joining default groups
CREATE POLICY "Group creators can invite members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  invited_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE id = group_members.group_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can join default groups"
ON public.group_members
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE id = group_members.group_id 
    AND is_default = true
  )
);

CREATE POLICY "Users can update their own memberships" 
ON public.group_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix group_posts RLS to only show posts to group members
DROP POLICY IF EXISTS "Everyone can view posts" ON public.group_posts;

CREATE POLICY "Group members can view posts" 
ON public.group_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_posts.group_id 
    AND group_members.user_id = auth.uid() 
    AND group_members.status = 'accepted'
  ) OR
  -- Group creators can see all posts in their groups
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE community_groups.id = group_posts.group_id 
    AND community_groups.created_by = auth.uid()
  ) OR
  -- Admins can see all posts
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow group members to update and delete their own posts
CREATE POLICY "Users can update their own posts" 
ON public.group_posts 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  -- Group creators can update posts in their groups
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE community_groups.id = group_posts.group_id 
    AND community_groups.created_by = auth.uid()
  ) OR
  -- Admins can update any posts
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their own posts" 
ON public.group_posts 
FOR DELETE 
USING (
  auth.uid() = user_id OR
  -- Group creators can delete posts in their groups
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE community_groups.id = group_posts.group_id 
    AND community_groups.created_by = auth.uid()
  ) OR
  -- Admins can delete any posts
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add birthdate column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Add cambridge_level column to profiles table for placement test results
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cambridge_level TEXT;

-- Give admin role to luccadtoledo@gmail.com
-- First check if user exists, if not we'll handle it when they sign up
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Try to find user by email in profiles table
    SELECT user_id INTO user_uuid FROM public.profiles WHERE email = 'luccadtoledo@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- User exists, give them admin role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_uuid, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;