-- Fix the group_members RLS policies to allow proper group joining
-- Drop all existing policies on group_members
DROP POLICY IF EXISTS "Group creators can invite members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join default groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can update their own memberships" ON public.group_members;
DROP POLICY IF EXISTS "Everyone can view group memberships" ON public.group_members;

-- Create new, simplified policies that work correctly
CREATE POLICY "Anyone can view group memberships" 
ON public.group_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join any group" 
ON public.group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can invite others to their groups" 
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

CREATE POLICY "Users can update their own membership status" 
ON public.group_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Group creators and admins can update memberships" 
ON public.group_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE id = group_members.group_id 
    AND created_by = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Group creators and admins can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM community_groups 
    WHERE id = group_members.group_id 
    AND created_by = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  auth.uid() = user_id
);