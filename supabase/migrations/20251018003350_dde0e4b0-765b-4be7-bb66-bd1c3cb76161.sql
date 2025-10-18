-- Fix RLS policies for community_groups deletion
-- Ensure admins and group creators can delete groups

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins can delete groups" ON community_groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON community_groups;

-- Create new deletion policies
CREATE POLICY "Admins can delete groups"
ON community_groups
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Group creators can delete their own groups"
ON community_groups
FOR DELETE
USING (created_by = auth.uid());

-- Update policies to allow group creators to update (archive) their groups
DROP POLICY IF EXISTS "Group creators can update their groups" ON community_groups;

CREATE POLICY "Group creators can update their groups"
ON community_groups
FOR UPDATE
USING (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));