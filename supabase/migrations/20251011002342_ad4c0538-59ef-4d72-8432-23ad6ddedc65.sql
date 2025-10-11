-- Fix: create trigger and backfill subscriptions using allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- Backfill missing user_subscriptions with a 7-day trial
INSERT INTO public.user_subscriptions (
  user_id,
  subscription_status,
  trial_ends_at,
  current_period_end,
  plan
)
SELECT 
  u.id AS user_id,
  'trial'::text AS subscription_status,
  now() + interval '7 days' AS trial_ends_at,
  NULL::timestamptz AS current_period_end,
  'free'::text AS plan
FROM auth.users u
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
