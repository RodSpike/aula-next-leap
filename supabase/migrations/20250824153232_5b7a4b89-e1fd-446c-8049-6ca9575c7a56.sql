-- Fix Critical Security Issues

-- 1. Fix Group Membership Privacy Exposure
-- Drop the overly permissive policy that allows anyone to view group memberships
DROP POLICY IF EXISTS "Anyone can view group memberships" ON public.group_members;

-- Create restrictive policies for group membership visibility
-- Group members can only see other members in groups they belong to
CREATE POLICY "Members can view group memberships in their groups" 
ON public.group_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.status = 'accepted'
  )
);

-- Group creators can see all members in groups they created
CREATE POLICY "Group creators can view all members in their groups" 
ON public.group_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.community_groups cg 
    WHERE cg.id = group_members.group_id 
    AND cg.created_by = auth.uid()
  )
);

-- Admins can view all memberships for moderation
CREATE POLICY "Admins can view all group memberships" 
ON public.group_members 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix Database Function Security Gaps
-- Update handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  
  -- Grant admin role to specific emails
  IF NEW.email IN ('rodspike2k8@gmail.com', 'luccadtoledo@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update has_role function with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update handle_new_user_subscription function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create subscription record for new user
  INSERT INTO public.user_subscriptions (user_id, plan, trial_ends_at)
  VALUES (NEW.id, 'free', now() + INTERVAL '3 days');
  
  -- Give default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

-- 3. Enhance Admin Role Protection
-- Add validation trigger to prevent unauthorized role escalation
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow admin role assignment during user creation or by existing admins
  IF NEW.role = 'admin'::app_role THEN
    -- Check if this is during user creation (via handle_new_user function)
    IF TG_OP = 'INSERT' AND NEW.user_id IN (
      SELECT id FROM auth.users WHERE email IN ('rodspike2k8@gmail.com', 'luccadtoledo@gmail.com')
    ) THEN
      RETURN NEW; -- Allow admin role for authorized emails
    END IF;
    
    -- Otherwise, only existing admins can assign admin roles
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();