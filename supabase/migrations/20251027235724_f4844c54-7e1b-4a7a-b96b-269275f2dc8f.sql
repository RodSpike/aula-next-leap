-- Fix handle_new_user function to check for free users and use correct plan values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_free_user BOOLEAN;
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
  
  -- Check if user is in free users list
  SELECT EXISTS (
    SELECT 1 FROM admin_free_users 
    WHERE email = NEW.email AND active = true
  ) INTO is_free_user;
  
  -- Grant subscription based on free user status
  IF is_free_user THEN
    -- Free users get permanent free access
    INSERT INTO user_subscriptions (
      user_id, 
      subscription_status, 
      current_period_end,
      plan
    ) VALUES (
      NEW.id, 
      'active',
      now() + INTERVAL '100 years', -- Essentially permanent
      'free'
    );
  ELSE
    -- Regular users get 7-day trial
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
      'paid'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;