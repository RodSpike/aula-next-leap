-- Create function for master admin to promote user to teacher
CREATE OR REPLACE FUNCTION public.admin_promote_to_teacher(target_user_id uuid, admin_description text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  admin_user_email text;
BEGIN
  admin_user_id := auth.uid();
  
  -- Get admin email
  SELECT email INTO admin_user_email FROM auth.users WHERE id = admin_user_id;
  
  -- Only master admin can promote to teacher
  IF admin_user_email NOT IN ('rodspike2k8@gmail.com', 'luccadtoledo@gmail.com') THEN
    RAISE EXCEPTION 'Only master admin can promote users to teacher';
  END IF;
  
  -- Check if user already has teacher role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'teacher') THEN
    RETURN TRUE; -- Already a teacher
  END IF;
  
  -- Add teacher role
  INSERT INTO public.user_roles (user_id, role, promoted_by)
  VALUES (target_user_id, 'teacher', admin_user_id);
  
  -- Log the action
  INSERT INTO public.audit_logs (
    admin_user_id, admin_email, action_type, target_type, target_id, 
    description, can_undo, undo_data
  )
  VALUES (
    admin_user_id, admin_user_email, 'PROMOTE_TEACHER', 'user', target_user_id,
    COALESCE(admin_description, 'Promoted user to teacher'),
    TRUE, jsonb_build_object('user_id', target_user_id, 'role', 'teacher')
  );
  
  RETURN TRUE;
END;
$$;

-- Create function for master admin to demote user from teacher
CREATE OR REPLACE FUNCTION public.admin_demote_from_teacher(target_user_id uuid, admin_description text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  admin_user_email text;
BEGIN
  admin_user_id := auth.uid();
  
  -- Get admin email
  SELECT email INTO admin_user_email FROM auth.users WHERE id = admin_user_id;
  
  -- Only master admin can demote from teacher
  IF admin_user_email NOT IN ('rodspike2k8@gmail.com', 'luccadtoledo@gmail.com') THEN
    RAISE EXCEPTION 'Only master admin can demote users from teacher';
  END IF;
  
  -- Remove teacher role
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'teacher';
  
  -- Log the action
  INSERT INTO public.audit_logs (
    admin_user_id, admin_email, action_type, target_type, target_id, 
    description, can_undo, undo_data
  )
  VALUES (
    admin_user_id, admin_user_email, 'DEMOTE_TEACHER', 'user', target_user_id,
    COALESCE(admin_description, 'Demoted user from teacher'),
    TRUE, jsonb_build_object('user_id', target_user_id, 'role', 'teacher')
  );
  
  RETURN TRUE;
END;
$$;

-- Create helper function to check if user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid
      AND role = 'teacher'
  )
$$;