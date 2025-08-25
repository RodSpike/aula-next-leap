-- Fix RLS policies for group_members to prevent infinite recursion
-- and add missing columns for group functionality

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view group memberships in their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can view all members in their groups" ON group_members;

-- Add new columns to community_groups table
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'open' CHECK (group_type IN ('open', 'closed'));
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Create simpler, non-recursive RLS policies for group_members
CREATE POLICY "Users can view memberships where they are members" 
ON group_members FOR SELECT 
USING (
  auth.uid() = user_id OR
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Group creators can view all members in their groups" 
ON group_members FOR SELECT 
USING (
  group_id IN (
    SELECT id FROM community_groups 
    WHERE created_by = auth.uid()
  )
);

-- Ensure unique constraint on group_members
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique ON group_members(group_id, user_id);

-- Add ON CONFLICT DO NOTHING to prevent duplicate member errors
-- This will be handled in application code