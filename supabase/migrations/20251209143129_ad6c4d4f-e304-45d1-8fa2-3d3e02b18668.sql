-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the weekly challenge generation every Monday at 00:01 UTC
SELECT cron.schedule(
  'generate-weekly-click-challenge',
  '1 0 * * 1', -- Every Monday at 00:01 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://frbmvljizolvxcxdkefa.supabase.co/functions/v1/generate-weekly-challenge',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYm12bGppem9sdnhjeGRrZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTI2MjIsImV4cCI6MjA3MTQ2ODYyMn0.xfmKb2qQmHU3PDwQIhbHCp0cyRhyN-FPikZRa_apzpA"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);