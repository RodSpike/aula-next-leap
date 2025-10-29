-- Create virtual campus tables for Click Hangout

-- Virtual rooms table
CREATE TABLE public.virtual_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  room_type VARCHAR(50) NOT NULL, -- study, social, office, event, lobby
  capacity INTEGER NOT NULL DEFAULT 20,
  current_users INTEGER NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT false,
  map_data JSONB DEFAULT '{}'::jsonb,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User avatars table
CREATE TABLE public.user_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  avatar_style VARCHAR(50) NOT NULL DEFAULT 'default',
  avatar_data JSONB DEFAULT '{}'::jsonb,
  current_room_id UUID REFERENCES virtual_rooms(id) ON DELETE SET NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  direction VARCHAR(10) NOT NULL DEFAULT 'down',
  status VARCHAR(20) NOT NULL DEFAULT 'online',
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Campus events table
CREATE TABLE public.campus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  room_id UUID NOT NULL REFERENCES virtual_rooms(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 20,
  current_participants INTEGER NOT NULL DEFAULT 0,
  event_type VARCHAR(50) NOT NULL DEFAULT 'social',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Room messages table
CREATE TABLE public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES virtual_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin-only for beta)
CREATE POLICY "Admins can manage virtual rooms"
ON public.virtual_rooms
FOR ALL
USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage user avatars"
ON public.user_avatars
FOR ALL
USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage campus events"
ON public.campus_events
FOR ALL
USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage room messages"
ON public.room_messages
FOR ALL
USING (user_has_admin_role(auth.uid()));

-- Helper function to update room user count
CREATE OR REPLACE FUNCTION public.update_room_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.current_room_id IS NOT NULL THEN
    UPDATE virtual_rooms 
    SET current_users = current_users + 1 
    WHERE id = NEW.current_room_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.current_room_id IS NOT NULL AND OLD.current_room_id != NEW.current_room_id THEN
      UPDATE virtual_rooms 
      SET current_users = current_users - 1 
      WHERE id = OLD.current_room_id;
    END IF;
    IF NEW.current_room_id IS NOT NULL AND OLD.current_room_id != NEW.current_room_id THEN
      UPDATE virtual_rooms 
      SET current_users = current_users + 1 
      WHERE id = NEW.current_room_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.current_room_id IS NOT NULL THEN
    UPDATE virtual_rooms 
    SET current_users = current_users - 1 
    WHERE id = OLD.current_room_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for room user count
CREATE TRIGGER update_room_user_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_avatars
FOR EACH ROW
EXECUTE FUNCTION public.update_room_user_count();

-- Function to get nearby users
CREATE OR REPLACE FUNCTION public.get_nearby_users(
  p_user_id UUID,
  p_proximity_radius INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  position_x INTEGER,
  position_y INTEGER,
  distance FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_id,
    p.display_name,
    ua.position_x,
    ua.position_y,
    SQRT(POWER(ua.position_x - curr.position_x, 2) + POWER(ua.position_y - curr.position_y, 2)) as distance
  FROM user_avatars ua
  JOIN profiles p ON p.user_id = ua.user_id
  CROSS JOIN (
    SELECT position_x, position_y, current_room_id
    FROM user_avatars
    WHERE user_id = p_user_id
  ) curr
  WHERE ua.current_room_id = curr.current_room_id
    AND ua.user_id != p_user_id
    AND SQRT(POWER(ua.position_x - curr.position_x, 2) + POWER(ua.position_y - curr.position_y, 2)) <= p_proximity_radius;
END;
$$;

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_avatars;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE virtual_rooms;

-- Set replica identity for realtime
ALTER TABLE user_avatars REPLICA IDENTITY FULL;
ALTER TABLE room_messages REPLICA IDENTITY FULL;
ALTER TABLE virtual_rooms REPLICA IDENTITY FULL;

-- Seed initial rooms
INSERT INTO public.virtual_rooms (name, room_type, capacity, position_x, position_y, map_data) VALUES
  ('Main Lobby', 'lobby', 50, 400, 300, '{"spawn_x": 400, "spawn_y": 300, "width": 800, "height": 600}'::jsonb),
  ('Study Hall', 'study', 20, 200, 100, '{"spawn_x": 200, "spawn_y": 100, "width": 600, "height": 400}'::jsonb),
  ('Group Room A', 'study', 10, 600, 100, '{"spawn_x": 600, "spawn_y": 100, "width": 500, "height": 400}'::jsonb),
  ('Social Lounge', 'social', 30, 200, 500, '{"spawn_x": 200, "spawn_y": 500, "width": 600, "height": 400}'::jsonb),
  ('Teacher Office', 'office', 5, 600, 500, '{"spawn_x": 600, "spawn_y": 500, "width": 400, "height": 300}'::jsonb);