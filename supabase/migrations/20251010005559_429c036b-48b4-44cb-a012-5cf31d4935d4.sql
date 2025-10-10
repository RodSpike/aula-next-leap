-- Update the handle_new_user trigger to also create a 7-day trial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO profiles (user_id, email, display_name) 
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Give default user role
  INSERT INTO user_roles (user_id, role) 
  VALUES (NEW.id, 'user');
  
  -- Initialize gamification
  INSERT INTO user_gamification (user_id, total_xp, current_level) 
  VALUES (NEW.id, 0, 1);
  
  -- Grant 7-day trial subscription
  INSERT INTO user_subscriptions (
    user_id, 
    subscription_status, 
    trial_ends_at, 
    current_period_end,
    plan
  ) VALUES (
    NEW.id, 
    'trialing',
    now() + INTERVAL '7 days',
    now() + INTERVAL '7 days',
    'premium'
  );
  
  RETURN NEW;
END;
$function$;