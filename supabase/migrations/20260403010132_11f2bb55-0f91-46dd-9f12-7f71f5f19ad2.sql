-- Update user_subscriptions table defaults to remove trial references
ALTER TABLE public.user_subscriptions 
  ALTER COLUMN trial_ends_at SET DEFAULT NULL,
  ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- Update handle_new_user_subscription to remove trial logic
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, subscription_status, trial_ends_at)
  VALUES (NEW.id, 'free', 'inactive', NULL);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;