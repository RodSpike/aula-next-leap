-- Fix infinite recursion in group_members RLS policies
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can join any group" ON group_members;
DROP POLICY IF EXISTS "Users can invite others to their groups" ON group_members;
DROP POLICY IF EXISTS "Users can update their own membership status" ON group_members;
DROP POLICY IF EXISTS "Admins can view all group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can update memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can view memberships where they are members" ON group_members;
DROP POLICY IF EXISTS "Group creators can view all members in their groups" ON group_members;

-- Create simple, non-recursive security definer functions
CREATE OR REPLACE FUNCTION public.is_group_creator(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_groups 
    WHERE id = group_uuid AND created_by = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_admin_role(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new, simple RLS policies using security definer functions
CREATE POLICY "Users can view their own memberships" 
ON group_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships" 
ON group_members FOR SELECT 
USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Group creators can view their group memberships" 
ON group_members FOR SELECT 
USING (is_group_creator(group_id, auth.uid()));

CREATE POLICY "Users can join groups" 
ON group_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
ON group_members FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Group creators can manage memberships" 
ON group_members FOR UPDATE 
USING (is_group_creator(group_id, auth.uid()));

CREATE POLICY "Admins can manage all memberships" 
ON group_members FOR UPDATE 
USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Users can leave groups" 
ON group_members FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Group creators can remove members" 
ON group_members FOR DELETE 
USING (is_group_creator(group_id, auth.uid()));

CREATE POLICY "Admins can remove any members" 
ON group_members FOR DELETE 
USING (user_has_admin_role(auth.uid()));