-- Add promoted_by column to track who promoted each admin
ALTER TABLE user_roles ADD COLUMN promoted_by UUID REFERENCES auth.users(id);

-- Add undo_data column to audit_logs for storing restoration data
ALTER TABLE audit_logs ADD COLUMN undo_data JSONB;
ALTER TABLE audit_logs ADD COLUMN can_undo BOOLEAN DEFAULT true;

-- Create function to demote admin (only master admin can do this)
CREATE OR REPLACE FUNCTION public.admin_demote_user(target_user_id uuid, admin_description text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_email TEXT;
  target_email TEXT;
  promoted_by_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can demote users';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get target user email
  SELECT email INTO target_email FROM profiles WHERE user_id = target_user_id;
  
  -- Get who promoted this user
  SELECT promoted_by INTO promoted_by_id FROM user_roles 
  WHERE user_id = target_user_id AND role = 'admin'::app_role;
  
  -- Prevent demoting the person who promoted you (unless you're master admin)
  IF promoted_by_id = auth.uid() AND admin_email != 'rodspike2k8@gmail.com' THEN
    RAISE EXCEPTION 'Cannot demote the admin who promoted you';
  END IF;
  
  -- Only master admin can demote other admins
  IF admin_email != 'rodspike2k8@gmail.com' THEN
    RAISE EXCEPTION 'Only master admin can demote other admins';
  END IF;
  
  -- Remove admin role
  DELETE FROM user_roles 
  WHERE user_id = target_user_id AND role = 'admin'::app_role;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description,
    undo_data
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'demote_user', 
    'user', 
    target_user_id, 
    jsonb_build_object('target_email', target_email, 'promoted_by', promoted_by_id),
    COALESCE(admin_description, 'User demoted from admin'),
    jsonb_build_object('user_id', target_user_id, 'role', 'admin', 'promoted_by', promoted_by_id)
  );
  
  RETURN TRUE;
END;
$function$;

-- Update the promotion function to track who promoted
CREATE OR REPLACE FUNCTION public.admin_promote_user(target_user_id uuid, admin_description text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Add admin role with promotion tracking
  INSERT INTO user_roles (user_id, role, promoted_by) 
  VALUES (target_user_id, 'admin'::app_role, auth.uid());
  
  -- Insert audit log
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description,
    undo_data
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'promote_user', 
    'user', 
    target_user_id, 
    jsonb_build_object('target_email', target_email),
    COALESCE(admin_description, 'User promoted to admin'),
    jsonb_build_object('user_id', target_user_id, 'role_removed', 'admin')
  );
  
  RETURN TRUE;
END;
$function$;

-- Create function to undo user deletion
CREATE OR REPLACE FUNCTION public.admin_undo_user_deletion(audit_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_record RECORD;
  user_data JSONB;
  admin_email TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can undo actions';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the audit log record
  SELECT * INTO log_record FROM audit_logs 
  WHERE id = audit_log_id AND action_type = 'delete_user' AND can_undo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot find undoable user deletion record';
  END IF;
  
  -- Extract user data
  user_data := log_record.target_data;
  
  -- Note: We cannot restore auth.users as that's managed by Supabase
  -- This function would need to be called alongside Supabase Auth Admin API
  -- For now, we'll mark it as restoration attempted
  
  -- Mark as undone
  UPDATE audit_logs SET can_undo = false WHERE id = audit_log_id;
  
  -- Log the undo action
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description,
    can_undo
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'undo_user_deletion', 
    'user', 
    log_record.target_id, 
    user_data,
    'Attempted to undo user deletion - manual auth restoration required',
    false
  );
  
  RETURN TRUE;
END;
$function$;

-- Create function to undo post deletion
CREATE OR REPLACE FUNCTION public.admin_undo_post_deletion(audit_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_record RECORD;
  post_data JSONB;
  admin_email TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can undo actions';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the audit log record
  SELECT * INTO log_record FROM audit_logs 
  WHERE id = audit_log_id AND action_type = 'delete_post' AND can_undo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot find undoable post deletion record';
  END IF;
  
  -- Extract post data
  post_data := log_record.target_data;
  
  -- Restore the post
  INSERT INTO group_posts (id, group_id, user_id, content, attachments, created_at, updated_at)
  VALUES (
    (post_data->>'id')::uuid,
    (post_data->>'group_id')::uuid,
    (post_data->>'user_id')::uuid,
    post_data->>'content',
    COALESCE(post_data->'attachments', '[]'::jsonb),
    (post_data->>'created_at')::timestamp with time zone,
    (post_data->>'updated_at')::timestamp with time zone
  );
  
  -- Mark as undone
  UPDATE audit_logs SET can_undo = false WHERE id = audit_log_id;
  
  -- Log the undo action
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description,
    can_undo
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'undo_post_deletion', 
    'post', 
    log_record.target_id, 
    post_data,
    'Restored deleted post',
    false
  );
  
  RETURN TRUE;
END;
$function$;

-- Create function to undo user promotion
CREATE OR REPLACE FUNCTION public.admin_undo_user_promotion(audit_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_record RECORD;
  admin_email TEXT;
  target_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can undo actions';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the audit log record
  SELECT * INTO log_record FROM audit_logs 
  WHERE id = audit_log_id AND action_type = 'promote_user' AND can_undo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot find undoable user promotion record';
  END IF;
  
  target_user_id := log_record.target_id;
  
  -- Remove admin role
  DELETE FROM user_roles 
  WHERE user_id = target_user_id AND role = 'admin'::app_role;
  
  -- Mark as undone
  UPDATE audit_logs SET can_undo = false WHERE id = audit_log_id;
  
  -- Log the undo action
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description,
    can_undo
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'undo_user_promotion', 
    'user', 
    target_user_id, 
    log_record.target_data,
    'Undid user promotion to admin',
    false
  );
  
  RETURN TRUE;
END;
$function$;

-- Create function to undo user demotion
CREATE OR REPLACE FUNCTION public.admin_undo_user_demotion(audit_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_record RECORD;
  admin_email TEXT;
  target_user_id UUID;
  undo_data JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can undo actions';
  END IF;

  -- Get admin email
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the audit log record
  SELECT * INTO log_record FROM audit_logs 
  WHERE id = audit_log_id AND action_type = 'demote_user' AND can_undo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot find undoable user demotion record';
  END IF;
  
  target_user_id := log_record.target_id;
  undo_data := log_record.undo_data;
  
  -- Restore admin role
  INSERT INTO user_roles (user_id, role, promoted_by) 
  VALUES (
    target_user_id, 
    'admin'::app_role, 
    (undo_data->>'promoted_by')::uuid
  );
  
  -- Mark as undone
  UPDATE audit_logs SET can_undo = false WHERE id = audit_log_id;
  
  -- Log the undo action
  INSERT INTO audit_logs (
    admin_user_id, 
    admin_email, 
    action_type, 
    target_type, 
    target_id, 
    target_data, 
    description,
    can_undo
  ) VALUES (
    auth.uid(), 
    admin_email, 
    'undo_user_demotion', 
    'user', 
    target_user_id, 
    log_record.target_data,
    'Undid user demotion from admin',
    false
  );
  
  RETURN TRUE;
END;
$function$;