-- =============================================
-- Phase 1: Clean Database Schema - Fixed Order
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS has_role(UUID, app_role) CASCADE;

DROP TABLE IF EXISTS user_lesson_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_gamification CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_members CASCADE;
DROP TABLE IF EXISTS chat_groups CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS achievement_tier CASCADE;
DROP TYPE IF EXISTS achievement_category CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;

CREATE TYPE app_role AS ENUM ('admin', 'user');

-- ===================
-- TABLES (No RLS yet)
-- ===================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  header_image_url TEXT,
  header_bg_color TEXT DEFAULT '#0ea5e9',
  intro_message TEXT,
  main_profile_post TEXT,
  favorite_song_url TEXT,
  birthdate DATE,
  cambridge_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(requester_id, requested_id),
  CHECK (requester_id != requested_id)
);

CREATE TABLE chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  is_direct_message BOOLEAN DEFAULT false NOT NULL,
  is_private BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id, created_at DESC);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);

CREATE TABLE user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,
  selected_badge_id UUID,
  selected_frame_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TYPE achievement_category AS ENUM ('learning', 'social', 'engagement', 'milestone');
CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category achievement_category NOT NULL,
  tier achievement_tier NOT NULL,
  xp_reward INTEGER DEFAULT 0 NOT NULL,
  requirement_count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0 NOT NULL,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  score NUMERIC DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- ===================
-- RLS POLICIES
-- ===================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own friendships" ON friends FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = requested_id);
CREATE POLICY "Users can send friend requests" ON friends FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update received requests" ON friends FOR UPDATE USING (auth.uid() = requested_id);
CREATE POLICY "Users can delete own friendships" ON friends FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = requested_id);

ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their chats" ON chat_groups FOR SELECT USING (EXISTS (SELECT 1 FROM chat_members WHERE chat_members.chat_id = chat_groups.id AND chat_members.user_id = auth.uid()));
CREATE POLICY "Users can create chats" ON chat_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update chats" ON chat_groups FOR UPDATE USING (auth.uid() = created_by);

ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view chat membership" ON chat_members FOR SELECT USING (EXISTS (SELECT 1 FROM chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid()));
CREATE POLICY "Chat creators can add members" ON chat_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_groups WHERE chat_groups.id = chat_members.chat_id AND chat_groups.created_by = auth.uid()));
CREATE POLICY "Users can leave chats" ON chat_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Members can update last_read" ON chat_members FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view chat messages" ON chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_members WHERE chat_members.chat_id = chat_messages.chat_id AND chat_members.user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM chat_members WHERE chat_members.chat_id = chat_messages.chat_id AND chat_members.user_id = auth.uid()));
CREATE POLICY "Senders can update own messages" ON chat_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Senders can delete own messages" ON chat_messages FOR DELETE USING (auth.uid() = sender_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all gamification" ON user_gamification FOR SELECT USING (true);
CREATE POLICY "Users can update own gamification" ON user_gamification FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all unlocked achievements" ON user_achievements FOR SELECT USING (unlocked_at IS NOT NULL OR auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view courses" ON courses FOR SELECT USING (true);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view lessons" ON lessons FOR SELECT USING (true);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON user_lesson_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================
-- FUNCTIONS
-- ===================

CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, email, display_name) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO user_gamification (user_id, total_xp, current_level) VALUES (NEW.id, 0, 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_groups_updated_at BEFORE UPDATE ON chat_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;