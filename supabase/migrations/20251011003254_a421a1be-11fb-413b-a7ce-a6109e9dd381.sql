-- Backfill missing profiles, roles, and subscriptions for existing users
-- This fixes the issue where users created before triggers were set up don't have proper data

-- Insert missing profiles for users who don't have one
INSERT INTO public.profiles (user_id, email, display_name)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as display_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Insert missing user roles (default to 'user')
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant admin role to master admin (rodspike2k8@gmail.com)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'rodspike2k8@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert missing gamification records
INSERT INTO public.user_gamification (user_id, total_xp, current_level)
SELECT u.id, 0, 1
FROM auth.users u
LEFT JOIN public.user_gamification ug ON ug.user_id = u.id
WHERE ug.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Update subscriptions: Give all existing users permanent free access
UPDATE public.user_subscriptions
SET 
  subscription_status = 'active',
  trial_ends_at = NULL,
  current_period_end = NULL,
  plan = 'free'
WHERE user_id IN (SELECT id FROM auth.users);

-- Comment: This migration ensures all existing users have:
-- 1. A profile
-- 2. At least a 'user' role
-- 3. rodspike2k8@gmail.com gets 'admin' role
-- 4. Gamification records
-- 5. Active free subscription (no trial, permanent)