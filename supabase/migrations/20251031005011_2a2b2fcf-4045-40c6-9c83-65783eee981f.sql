-- Ensure trigger exists for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update handle_new_user to use case-insensitive email matching for free users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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

  -- Insert into profiles
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_gamification
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