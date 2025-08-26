-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'delete_user', 'delete_post', 'delete_group', 'promote_user', etc.
  target_type TEXT NOT NULL, -- 'user', 'post', 'group', 'comment', etc.
  target_id UUID,
  target_data JSONB, -- Store a copy of the deleted/modified content
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can create audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to safely delete user account (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID, admin_description TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data JSONB;
  admin_email TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get user data before deletion for audit log
  SELECT to_jsonb(profiles.*) INTO user_data 
  FROM profiles 
  WHERE user_id = target_user_id;
  
  -- Insert audit log before deletion
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'delete_user', 
    'user', 
    target_user_id, 
    user_data,
    COALESCE(admin_description, 'User account deleted')
  );
  
  -- Delete user data (cascading deletes will handle related data)
  DELETE FROM profiles WHERE user_id = target_user_id;
  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM user_subscriptions WHERE user_id = target_user_id;
  
  -- Delete from auth.users (this will cascade to other tables)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to promote user to admin (admin only)
CREATE OR REPLACE FUNCTION public.admin_promote_user(target_user_id UUID, admin_description TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT;
  target_email TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can promote users';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get target user email
  SELECT email INTO target_email FROM profiles WHERE user_id = target_user_id;
  
  -- Check if user already has admin role
  IF has_role(target_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;
  
  -- Add admin role
  INSERT INTO user_roles (user_id, role) 
  VALUES (target_user_id, 'admin'::app_role);
  
  -- Insert audit log
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'promote_user', 
    'user', 
    target_user_id, 
    jsonb_build_object('target_email', target_email),
    COALESCE(admin_description, 'User promoted to admin')
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to delete group post (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_post(post_id UUID, admin_description TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_data JSONB;
  admin_email TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete posts';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get post data before deletion for audit log
  SELECT to_jsonb(group_posts.*) INTO post_data 
  FROM group_posts 
  WHERE id = post_id;
  
  -- Insert audit log before deletion
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'delete_post', 
    'post', 
    post_id, 
    post_data,
    COALESCE(admin_description, 'Group post deleted')
  );
  
  -- Delete the post
  DELETE FROM group_posts WHERE id = post_id;
  
  RETURN TRUE;
END;
$$;

-- Update RLS policies to allow admins to delete users' profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies to allow admins to update any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update community groups
CREATE POLICY "Admins can update any group" 
ON public.community_groups 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete posts from any group
CREATE POLICY "Admins can delete any group post" 
ON public.group_posts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to track admin posts with brand identity
CREATE OR REPLACE FUNCTION public.create_admin_post(
  group_id_param UUID, 
  content_param TEXT, 
  attachments_param JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_id UUID;
  admin_email TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can use this function';
  END IF;

  -- Get admin email for audit
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Create the post
  INSERT INTO group_posts (group_id, user_id, content, attachments)
  VALUES (group_id_param, auth.uid(), content_param, attachments_param)
  RETURNING id INTO post_id;
  
  -- Log the admin action for traceability
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'create_admin_post', 
    'post', 
    post_id, 
    jsonb_build_object('group_id', group_id_param, 'content', content_param),
    'Admin created post as Aula Click'
  );
  
  RETURN post_id;
END;
$$;