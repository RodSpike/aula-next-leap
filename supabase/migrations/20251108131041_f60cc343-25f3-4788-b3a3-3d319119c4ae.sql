-- Remove duplicate insert cause during signup by not inserting into user_gamification here
-- We keep idempotent inserts for profiles, roles and subscriptions only
BEGIN;

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

  -- Insert into user_roles (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- NOTE: Do NOT insert into user_gamification here to avoid duplicate inserts from other triggers
  -- Any initialization for gamification should be handled by its own trigger/process

  -- Insert into user_subscriptions with appropriate status (idempotent)
  INSERT INTO public.user_subscriptions (
    user_id,
    plan,
    subscription_status,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    'free',
    CASE WHEN is_free_user THEN 'active' ELSE 'trial' END,
    CASE WHEN is_free_user THEN NULL ELSE (now() + interval '7 days') END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

COMMIT;