-- Fix ON CONFLICT usage for user_roles to match unique index (user_id, role)
-- This prevents 500 errors on signup due to invalid ON CONFLICT target

-- Update handle_new_user_subscription function
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create subscription record for new user
  INSERT INTO public.user_subscriptions (user_id, plan, trial_ends_at)
  VALUES (NEW.id, 'free', now() + INTERVAL '3 days');
  
  -- Give default user role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_free_user boolean;
BEGIN
  -- Check if user's email is in admin_free_users with case-insensitive comparison
  SELECT EXISTS (
    SELECT 1 FROM admin_free_users 
    WHERE LOWER(email) = LOWER(NEW.email) 
      AND active = true
  ) INTO is_free_user;

  -- Insert into profiles (correct column name is user_id)
  INSERT INTO public.profiles (user_id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_roles (idempotent, correct conflict target)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Initialize user_gamification
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_subscriptions with appropriate status
  INSERT INTO public.user_subscriptions (
    user_id,
    plan,
    subscription_status,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    CASE WHEN is_free_user THEN 'free_admin_granted' ELSE 'free' END,
    CASE WHEN is_free_user THEN 'active' ELSE 'trial' END,
    CASE WHEN is_free_user THEN NULL ELSE (now() + interval '7 days') END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
