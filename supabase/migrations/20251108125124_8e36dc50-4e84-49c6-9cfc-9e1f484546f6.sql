-- Fix signup failures by standardizing plan values and removing duplicate subscription inserts
BEGIN;

-- 1) Update handle_new_user to use a valid plan and idempotent inserts
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
  -- IMPORTANT: use a valid plan value 'free' to satisfy check constraint
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

-- 2) Remove any legacy triggers on auth.users that call handle_new_user_subscription
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth'
      AND event_object_table = 'users'
      AND action_statement ILIKE '%handle_new_user_subscription%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', r.trigger_name);
  END LOOP;
END;
$$;

-- 3) Ensure we only have a single trigger that calls handle_new_user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema='auth'
      AND event_object_table='users'
      AND trigger_name = 'on_auth_user_created'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
  END IF;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

COMMIT;