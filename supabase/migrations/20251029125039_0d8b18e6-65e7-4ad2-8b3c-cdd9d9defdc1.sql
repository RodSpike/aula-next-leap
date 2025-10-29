-- Ensure admins can join any group without restrictions
DROP POLICY IF EXISTS "Admins can join any group" ON public.group_members;
CREATE POLICY "Admins can join any group"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (user_has_admin_role(auth.uid()));

-- Ensure admins can view all group chat messages
DROP POLICY IF EXISTS "Admins can view all group chat messages" ON public.group_chat_messages;
CREATE POLICY "Admins can view all group chat messages"
ON public.group_chat_messages
FOR SELECT
TO authenticated
USING (user_has_admin_role(auth.uid()));

-- Ensure admins can send messages to any group
DROP POLICY IF EXISTS "Admins can post to any group chat" ON public.group_chat_messages;
CREATE POLICY "Admins can post to any group chat"
ON public.group_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (user_has_admin_role(auth.uid()));

-- Ensure admins can view all post comments
DROP POLICY IF EXISTS "Admins can view all comments" ON public.post_comments;
CREATE POLICY "Admins can view all comments"
ON public.post_comments
FOR SELECT
TO authenticated
USING (user_has_admin_role(auth.uid()));

-- Ensure admins can comment anywhere
DROP POLICY IF EXISTS "Admins can comment anywhere" ON public.post_comments;
CREATE POLICY "Admins can comment anywhere"
ON public.post_comments
FOR INSERT
TO authenticated
WITH CHECK (user_has_admin_role(auth.uid()));