-- First fix the admin issue for carladmiranda@gmail.com
-- Check if this user exists and grant admin permissions
INSERT INTO public.user_roles (user_id, role, promoted_by)
SELECT 
  au.id,
  'admin'::app_role,
  (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com')
FROM auth.users au
WHERE au.email = 'carladmiranda@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = au.id AND ur.role = 'admin'::app_role
  );

-- Add avatar_url column to profiles table for profile pictures
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a table for user online status
CREATE TABLE IF NOT EXISTS public.user_online_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  is_online boolean DEFAULT true,
  last_seen_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS on user_online_status
ALTER TABLE public.user_online_status ENABLE ROW LEVEL SECURITY;

-- Create policies for user_online_status
CREATE POLICY "Users can view online status in groups they're members of"
ON public.user_online_status
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = user_online_status.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'accepted'
  )
);

CREATE POLICY "Users can update their own online status"
ON public.user_online_status
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a table for direct messages between users
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE
);

-- Enable RLS on direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for direct_messages
CREATE POLICY "Users can view messages they sent or received"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send direct messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create a table for group chat messages
CREATE TABLE IF NOT EXISTS public.group_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on group_chat_messages
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for group_chat_messages
CREATE POLICY "Group members can view chat messages"
ON public.group_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_chat_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'accepted'
  )
);

CREATE POLICY "Group members can send chat messages"
ON public.group_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_chat_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'accepted'
  )
);

-- Enable realtime for all messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_online_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_online_status_updated_at
  BEFORE UPDATE ON public.user_online_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_chat_messages_updated_at
  BEFORE UPDATE ON public.group_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();