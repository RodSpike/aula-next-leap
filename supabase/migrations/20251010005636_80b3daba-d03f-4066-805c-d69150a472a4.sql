-- Grant 7-day trials to existing users who don't have subscriptions
INSERT INTO user_subscriptions (
  user_id, 
  subscription_status, 
  trial_ends_at, 
  current_period_end,
  plan
)
SELECT 
  ur.user_id,
  'trialing',
  now() + INTERVAL '7 days',
  now() + INTERVAL '7 days',
  'premium'
FROM user_roles ur
LEFT JOIN user_subscriptions us ON ur.user_id = us.user_id
WHERE us.user_id IS NULL
  AND ur.role != 'admin'
ON CONFLICT (user_id) DO NOTHING;