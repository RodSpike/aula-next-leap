-- Add profile customization fields and notifications
BEGIN;

-- 1) Extend profiles with customization and main post fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS intro_message text,
  ADD COLUMN IF NOT EXISTS main_profile_post text,
  ADD COLUMN IF NOT EXISTS main_profile_post_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS header_bg_color text,
  ADD COLUMN IF NOT EXISTS header_image_url text,
  ADD COLUMN IF NOT EXISTS favorite_song_url text;

-- 2) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their notifications'
  ) THEN
    CREATE POLICY "Users can view their notifications"
      ON public.notifications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can insert their notifications'
  ) THEN
    CREATE POLICY "Users can insert their notifications"
      ON public.notifications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update their notifications'
  ) THEN
    CREATE POLICY "Users can update their notifications"
      ON public.notifications
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Trigger to notify friends when main_profile_post changes
CREATE OR REPLACE FUNCTION public.notify_friends_on_main_post_change()
RETURNS trigger AS $$
DECLARE
  friend_record RECORD;
BEGIN
  -- Only act when the main_profile_post actually changed to a non-null value
  IF (NEW.main_profile_post IS DISTINCT FROM OLD.main_profile_post) AND NEW.main_profile_post IS NOT NULL THEN
    FOR friend_record IN
      SELECT 
        CASE 
          WHEN f.requester_id = NEW.user_id THEN f.requested_id 
          ELSE f.requester_id 
        END AS friend_id
      FROM public.friends f
      WHERE f.status = 'accepted'
        AND (f.requester_id = NEW.user_id OR f.requested_id = NEW.user_id)
    LOOP
      INSERT INTO public.notifications (user_id, type, data)
      VALUES (
        friend_record.friend_id,
        'friend_main_post_updated',
        jsonb_build_object(
          'friend_id', NEW.user_id,
          'friend_display_name', NEW.display_name,
          'preview', LEFT(COALESCE(NEW.main_profile_post, ''), 160),
          'updated_at', now()
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_friends_on_main_post_change ON public.profiles;
CREATE TRIGGER trg_notify_friends_on_main_post_change
AFTER UPDATE OF main_profile_post ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_friends_on_main_post_change();

COMMIT;