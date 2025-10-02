-- Gamification System Tables

-- Achievement categories and types
CREATE TYPE achievement_category AS ENUM ('social', 'learning', 'community', 'streak', 'special');
CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- Achievements definition table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category achievement_category NOT NULL,
  tier achievement_tier NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User achievements (unlocked badges)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Profile frames
CREATE TABLE profile_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  required_level INTEGER NOT NULL DEFAULT 1,
  required_achievement_id UUID REFERENCES achievements(id),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User levels and XP
CREATE TABLE user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  selected_badge_id UUID REFERENCES achievements(id),
  selected_frame_id UUID REFERENCES profile_frames(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User XP history
CREATE TABLE user_xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Everyone can view achievements"
ON achievements FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON user_achievements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' unlocked achievements"
ON user_achievements FOR SELECT
TO authenticated
USING (unlocked_at IS NOT NULL);

CREATE POLICY "Users can update their own achievement progress"
ON user_achievements FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profile_frames (everyone can view)
CREATE POLICY "Everyone can view profile frames"
ON profile_frames FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for user_gamification
CREATE POLICY "Users can view their own gamification data"
ON user_gamification FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' gamification data"
ON user_gamification FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own gamification data"
ON user_gamification FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_xp_history
CREATE POLICY "Users can view their own XP history"
ON user_xp_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP history"
ON user_xp_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to add XP and level up
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id UUID,
  p_xp INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_xp_for_next_level INTEGER;
  v_leveled_up BOOLEAN := false;
BEGIN
  -- Get current XP and level
  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM user_gamification
  WHERE user_id = p_user_id;
  
  -- If user doesn't exist in gamification table, create entry
  IF NOT FOUND THEN
    INSERT INTO user_gamification (user_id, total_xp, current_level)
    VALUES (p_user_id, 0, 1)
    RETURNING total_xp, current_level INTO v_current_xp, v_current_level;
  END IF;
  
  -- Add XP
  v_new_xp := v_current_xp + p_xp;
  v_new_level := v_current_level;
  
  -- Calculate level (100 XP per level, exponential growth)
  LOOP
    v_xp_for_next_level := v_new_level * 100;
    EXIT WHEN v_new_xp < v_xp_for_next_level;
    v_new_xp := v_new_xp - v_xp_for_next_level;
    v_new_level := v_new_level + 1;
    v_leveled_up := true;
  END LOOP;
  
  -- Update user gamification
  UPDATE user_gamification
  SET total_xp = total_xp + p_xp,
      current_level = v_new_level,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log XP gain
  INSERT INTO user_xp_history (user_id, xp_amount, source, description)
  VALUES (p_user_id, p_xp, p_source, p_description);
  
  RETURN jsonb_build_object(
    'leveled_up', v_leveled_up,
    'new_level', v_new_level,
    'total_xp', v_current_xp + p_xp,
    'xp_gained', p_xp
  );
END;
$$;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
  p_user_id UUID,
  p_achievement_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_id UUID;
  v_requirement_count INTEGER;
  v_xp_reward INTEGER;
  v_current_progress INTEGER;
  v_new_progress INTEGER;
  v_unlocked BOOLEAN := false;
BEGIN
  -- Get achievement details
  SELECT id, requirement_count, xp_reward INTO v_achievement_id, v_requirement_count, v_xp_reward
  FROM achievements
  WHERE key = p_achievement_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Achievement not found');
  END IF;
  
  -- Get or create user achievement
  INSERT INTO user_achievements (user_id, achievement_id, progress)
  VALUES (p_user_id, v_achievement_id, 0)
  ON CONFLICT (user_id, achievement_id) DO NOTHING
  RETURNING progress INTO v_current_progress;
  
  IF NOT FOUND THEN
    SELECT progress INTO v_current_progress
    FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id;
  END IF;
  
  -- Skip if already unlocked
  IF EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id AND unlocked_at IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('already_unlocked', true);
  END IF;
  
  -- Update progress
  v_new_progress := v_current_progress + p_increment;
  
  IF v_new_progress >= v_requirement_count THEN
    -- Unlock achievement
    UPDATE user_achievements
    SET progress = v_requirement_count,
        unlocked_at = now()
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id;
    
    -- Award XP
    PERFORM add_user_xp(p_user_id, v_xp_reward, 'achievement', p_achievement_key);
    
    v_unlocked := true;
  ELSE
    -- Just update progress
    UPDATE user_achievements
    SET progress = v_new_progress
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id;
  END IF;
  
  RETURN jsonb_build_object(
    'unlocked', v_unlocked,
    'progress', v_new_progress,
    'requirement', v_requirement_count,
    'xp_awarded', CASE WHEN v_unlocked THEN v_xp_reward ELSE 0 END
  );
END;
$$;

-- Trigger to initialize gamification data for new users
CREATE OR REPLACE FUNCTION initialize_user_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_gamification (user_id, total_xp, current_level)
  VALUES (NEW.id, 0, 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_init_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_gamification();

-- Insert initial achievements
INSERT INTO achievements (key, name, description, category, tier, icon, xp_reward, requirement_count) VALUES
  -- Social achievements
  ('first_friend', 'Fazer Amigos', 'Adicione seu primeiro amigo', 'social', 'bronze', '🤝', 10, 1),
  ('social_butterfly', 'Borboleta Social', 'Tenha 10 amigos', 'social', 'silver', '🦋', 50, 10),
  ('popular', 'Popular', 'Tenha 25 amigos', 'social', 'gold', '⭐', 100, 25),
  ('first_post', 'Primeira Postagem', 'Crie sua primeira postagem', 'social', 'bronze', '📝', 10, 1),
  ('content_creator', 'Criador de Conteúdo', 'Crie 10 postagens', 'social', 'silver', '✍️', 50, 10),
  ('influencer', 'Influenciador', 'Crie 50 postagens', 'social', 'gold', '📢', 150, 50),
  ('first_comment', 'Primeiro Comentário', 'Comente em uma postagem', 'social', 'bronze', '💬', 5, 1),
  ('commentator', 'Comentarista', 'Faça 25 comentários', 'social', 'silver', '💭', 50, 25),
  
  -- Learning achievements
  ('first_lesson', 'Primeira Lição', 'Complete sua primeira lição', 'learning', 'bronze', '📚', 15, 1),
  ('dedicated_learner', 'Aluno Dedicado', 'Complete 10 lições', 'learning', 'silver', '🎓', 75, 10),
  ('scholar', 'Estudioso', 'Complete 50 lições', 'learning', 'gold', '👨‍🎓', 200, 50),
  ('master_learner', 'Mestre do Aprendizado', 'Complete 100 lições', 'learning', 'platinum', '🏆', 500, 100),
  ('perfect_score', 'Pontuação Perfeita', 'Obtenha 100% em uma lição', 'learning', 'bronze', '💯', 20, 1),
  ('perfectionist', 'Perfeccionista', 'Obtenha 100% em 10 lições', 'learning', 'gold', '✨', 150, 10),
  ('first_test', 'Primeiro Teste', 'Complete um teste de nível', 'learning', 'bronze', '📋', 25, 1),
  ('test_master', 'Mestre dos Testes', 'Passe em 5 testes de nível', 'learning', 'gold', '🎯', 200, 5),
  
  -- Community achievements
  ('community_helper', 'Ajudante da Comunidade', 'Responda a 10 mensagens', 'community', 'bronze', '🤲', 30, 10),
  ('mentor', 'Mentor', 'Ajude 25 alunos', 'community', 'silver', '👨‍🏫', 100, 25),
  ('group_creator', 'Criador de Grupo', 'Crie seu primeiro grupo', 'community', 'bronze', '👥', 20, 1),
  
  -- Streak achievements
  ('week_streak', 'Sequência Semanal', 'Estude por 7 dias seguidos', 'streak', 'bronze', '🔥', 50, 7),
  ('month_streak', 'Sequência Mensal', 'Estude por 30 dias seguidos', 'streak', 'silver', '⚡', 200, 30),
  ('unstoppable', 'Imparável', 'Estude por 100 dias seguidos', 'streak', 'gold', '💪', 1000, 100),
  
  -- Special achievements
  ('early_bird', 'Madrugador', 'Estude antes das 7h da manhã', 'special', 'bronze', '🌅', 15, 1),
  ('night_owl', 'Coruja Noturna', 'Estude depois das 11h da noite', 'special', 'bronze', '🦉', 15, 1),
  ('speed_demon', 'Demônio da Velocidade', 'Complete uma lição em menos de 5 minutos', 'special', 'silver', '⚡', 30, 1);

-- Insert initial profile frames
INSERT INTO profile_frames (key, name, description, image_url, required_level, is_premium) VALUES
  ('default', 'Padrão', 'Moldura padrão', '/frames/default.png', 1, false),
  ('bronze', 'Bronze', 'Moldura bronze - Nível 5', '/frames/bronze.png', 5, false),
  ('silver', 'Prata', 'Moldura prata - Nível 10', '/frames/silver.png', 10, false),
  ('gold', 'Ouro', 'Moldura ouro - Nível 25', '/frames/gold.png', 25, false),
  ('platinum', 'Platina', 'Moldura platina - Nível 50', '/frames/platinum.png', 50, false),
  ('diamond', 'Diamante', 'Moldura diamante - Nível 100', '/frames/diamond.png', 100, false),
  ('rainbow', 'Arco-íris', 'Moldura especial arco-íris', '/frames/rainbow.png', 1, true);