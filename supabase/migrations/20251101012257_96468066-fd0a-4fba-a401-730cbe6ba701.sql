-- Fix handle_new_user to use correct profiles schema and ensure trigger is present

-- 1) Replace the function to insert into profiles(user_id, ...) instead of profiles(id,...)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

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
$$;

-- 2) Ensure the trigger exists on auth.users to run this function after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();