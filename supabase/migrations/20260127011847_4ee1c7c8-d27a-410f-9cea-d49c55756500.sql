-- Create cron job for AI teacher tips (every 6 hours)
SELECT cron.schedule(
  'ai-teacher-tips',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://frbmvljizolvxcxdkefa.supabase.co/functions/v1/ai-community-post',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYm12bGppem9sdnhjeGRrZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjI2NjksImV4cCI6MjA2MjgzODY2OX0.Nf9C4xKUqBR5kYZBV6mZvFyqGG1NixmaSLCNGvuNdJc"}'::jsonb,
    body := '{"action": "tip"}'::jsonb
  ) AS request_id;
  $$
);

-- Create cron job for AI teacher interactions (every 12 hours)
SELECT cron.schedule(
  'ai-teacher-interactions',
  '0 */12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://frbmvljizolvxcxdkefa.supabase.co/functions/v1/ai-community-post',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYm12bGppem9sdnhjeGRrZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjI2NjksImV4cCI6MjA2MjgzODY2OX0.Nf9C4xKUqBR5kYZBV6mZvFyqGG1NixmaSLCNGvuNdJc"}'::jsonb,
    body := '{"action": "interact"}'::jsonb
  ) AS request_id;
  $$
);