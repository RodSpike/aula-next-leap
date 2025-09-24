-- Allow group creators and admins to add members to their groups
CREATE POLICY "Group creators and admins can add group members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  is_group_creator(group_id, auth.uid())
  OR user_has_admin_role(auth.uid())
  OR auth.uid() = user_id
);