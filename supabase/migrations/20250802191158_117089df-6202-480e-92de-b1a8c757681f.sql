-- Set up daily cron job to post scripture at 6:00 AM UTC
SELECT cron.schedule(
  'daily-scripture-posting',
  '0 6 * * *', -- 6:00 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://joihvetbtjyrdcoflcgv.supabase.co/functions/v1/daily-scripture',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaWh2ZXRidGp5cmRjb2ZsY2d2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0MTIyMiwiZXhwIjoyMDY5NzE3MjIyfQ.VtbPjjcnxhfZr-9eQWUoNY_9YGnk7M1Rj-OJILhzuNo"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);