-- Fix subscription flow: regular users need to subscribe before getting access
-- Free users get active status, regular users get inactive status until they subscribe

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

  -- Insert into profiles
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
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Insert into user_subscriptions with appropriate status
  -- Free users: active with no trial
  -- Regular users: inactive until they subscribe (trial starts after Stripe checkout)
  INSERT INTO public.user_subscriptions (
    user_id,
    plan,
    subscription_status,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    'free',
    CASE WHEN is_free_user THEN 'active' ELSE 'inactive' END,
    NULL  -- Trial starts only after Stripe checkout for regular users
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;