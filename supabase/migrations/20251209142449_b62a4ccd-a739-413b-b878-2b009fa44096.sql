-- Create table for weekly challenges
CREATE TABLE public.click_of_week_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty TEXT NOT NULL DEFAULT 'mixed',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

-- Create table for user attempts
CREATE TABLE public.click_of_week_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.click_of_week_challenges(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  lives_remaining INTEGER NOT NULL DEFAULT 3,
  current_question INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for weekly leaderboard
CREATE TABLE public.click_of_week_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.click_of_week_challenges(id) ON DELETE CASCADE,
  best_score INTEGER NOT NULL DEFAULT 0,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create table for weekly winners
CREATE TABLE public.click_of_week_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.click_of_week_challenges(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  final_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id)
);

-- Enable RLS
ALTER TABLE public.click_of_week_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_of_week_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_of_week_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_of_week_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Everyone can view active challenges" ON public.click_of_week_challenges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage challenges" ON public.click_of_week_challenges
  FOR ALL USING (user_has_admin_role(auth.uid()));

-- RLS Policies for attempts
CREATE POLICY "Users can view own attempts" ON public.click_of_week_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts" ON public.click_of_week_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON public.click_of_week_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for leaderboard
CREATE POLICY "Everyone can view leaderboard" ON public.click_of_week_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own leaderboard entry" ON public.click_of_week_leaderboard
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for winners
CREATE POLICY "Everyone can view winners" ON public.click_of_week_winners
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage winners" ON public.click_of_week_winners
  FOR ALL USING (user_has_admin_role(auth.uid()));

-- Add Click of the Week achievements
INSERT INTO public.achievements (key, name, description, icon, category, tier, xp_reward, requirement_count) VALUES
  ('click_first_attempt', 'First Click', 'Complete your first Click of the Week challenge', '🎯', 'engagement', 'bronze', 50, 1),
  ('click_perfect_score', 'Perfect Click', 'Get a perfect score in Click of the Week (50/50)', '⭐', 'engagement', 'gold', 200, 1),
  ('click_weekly_winner', 'Weekly Champion', 'Win Click of the Week', '🏆', 'milestone', 'gold', 300, 1),
  ('click_streak_3', 'Click Streak', 'Complete 3 weekly challenges', '🔥', 'engagement', 'silver', 100, 3),
  ('click_streak_10', 'Click Master', 'Complete 10 weekly challenges', '💎', 'engagement', 'platinum', 500, 10),
  ('click_high_scorer', 'High Scorer', 'Score 40+ points in a single challenge', '🎖️', 'engagement', 'silver', 150, 1);

-- Function to get current week challenge
CREATE OR REPLACE FUNCTION public.get_current_week_challenge()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge_id UUID;
BEGIN
  SELECT id INTO v_challenge_id
  FROM click_of_week_challenges
  WHERE CURRENT_DATE BETWEEN week_start AND week_end
    AND is_active = true
  LIMIT 1;
  
  RETURN v_challenge_id;
END;
$$;

-- Function to check if user can attempt
CREATE OR REPLACE FUNCTION public.can_attempt_click_of_week(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge_id UUID;
  v_attempt RECORD;
  v_result JSONB;
BEGIN
  -- Get current challenge
  v_challenge_id := get_current_week_challenge();
  
  IF v_challenge_id IS NULL THEN
    RETURN jsonb_build_object('can_attempt', false, 'reason', 'no_challenge', 'message', 'No active challenge this week');
  END IF;
  
  -- Get latest attempt for this challenge
  SELECT * INTO v_attempt
  FROM click_of_week_attempts
  WHERE user_id = p_user_id AND challenge_id = v_challenge_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- No attempt yet - can play
  IF v_attempt IS NULL THEN
    RETURN jsonb_build_object('can_attempt', true, 'challenge_id', v_challenge_id, 'is_new', true);
  END IF;
  
  -- Has ongoing attempt with lives
  IF NOT v_attempt.completed AND v_attempt.lives_remaining > 0 THEN
    RETURN jsonb_build_object('can_attempt', true, 'challenge_id', v_challenge_id, 'attempt_id', v_attempt.id, 'is_continuation', true);
  END IF;
  
  -- Check cooldown
  IF v_attempt.next_attempt_at IS NOT NULL AND v_attempt.next_attempt_at > now() THEN
    RETURN jsonb_build_object(
      'can_attempt', false, 
      'reason', 'cooldown', 
      'next_attempt_at', v_attempt.next_attempt_at,
      'message', 'You must wait before trying again'
    );
  END IF;
  
  -- Can start new attempt
  RETURN jsonb_build_object('can_attempt', true, 'challenge_id', v_challenge_id, 'is_new', true);
END;
$$;