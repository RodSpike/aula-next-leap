import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AchievementStats {
  speechSessions: number;
  speechMinutes: number;
  speechMessages: number;
  speechWords: number;
  friendsCount: number;
  postsCount: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
}

export const useAchievementSync = () => {
  const { user } = useAuth();

  const fetchStats = useCallback(async (): Promise<AchievementStats | null> => {
    if (!user) return null;

    try {
      // Fetch all stats in parallel
      const [speechData, friendsData, postsData, lessonsData, exercisesData] = await Promise.all([
        // Speech tutor stats
        supabase
          .from('speech_tutor_sessions')
          .select('duration_seconds, messages_count, words_spoken')
          .eq('user_id', user.id),
        
        // Friends count
        supabase
          .from('friends')
          .select('id')
          .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        
        // Posts count
        supabase
          .from('group_posts')
          .select('id')
          .eq('user_id', user.id),
        
        // Lessons completed
        supabase
          .from('user_lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', true),
        
        // Exercises completed
        supabase
          .from('user_exercise_attempts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_correct', true)
      ]);

      const sessions = speechData.data || [];
      
      return {
        speechSessions: sessions.length,
        speechMinutes: Math.floor(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60),
        speechMessages: sessions.reduce((sum, s) => sum + (s.messages_count || 0), 0),
        speechWords: sessions.reduce((sum, s) => sum + (s.words_spoken || 0), 0),
        friendsCount: friendsData.data?.length || 0,
        postsCount: postsData.data?.length || 0,
        lessonsCompleted: lessonsData.data?.length || 0,
        exercisesCompleted: exercisesData.data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching achievement stats:', error);
      return null;
    }
  }, [user]);

  const syncAchievements = useCallback(async () => {
    if (!user) return;

    const stats = await fetchStats();
    if (!stats) return;

    // Define all count-based achievements and their current values
    const achievementsToSync = [
      // Speech sessions
      { key: 'speech_first_session', value: stats.speechSessions },
      { key: 'speech_5_sessions', value: stats.speechSessions },
      { key: 'speech_25_sessions', value: stats.speechSessions },
      { key: 'speech_50_sessions', value: stats.speechSessions },
      
      // Speech minutes
      { key: 'speech_10_minutes', value: stats.speechMinutes },
      { key: 'speech_30_minutes', value: stats.speechMinutes },
      { key: 'speech_60_minutes', value: stats.speechMinutes },
      { key: 'speech_180_minutes', value: stats.speechMinutes },
      { key: 'speech_300_minutes', value: stats.speechMinutes },
      
      // Speech messages
      { key: 'speech_100_messages', value: stats.speechMessages },
      
      // Speech words
      { key: 'speech_500_words', value: stats.speechWords },
      { key: 'speech_1000_words', value: stats.speechWords },
      
      // Social - friends
      { key: 'first_friend', value: stats.friendsCount },
      { key: 'social_butterfly', value: stats.friendsCount },
      { key: 'popular', value: stats.friendsCount },
      { key: 'celebrity', value: stats.friendsCount },
      
      // Engagement - posts
      { key: 'first_post', value: stats.postsCount },
      { key: 'active_member', value: stats.postsCount },
      { key: 'helpful', value: stats.postsCount },
      { key: 'community_leader', value: stats.postsCount },
      { key: 'influencer', value: stats.postsCount },
      
      // Learning - lessons
      { key: 'first_lesson', value: stats.lessonsCompleted },
      { key: 'complete_10_lessons', value: stats.lessonsCompleted },
      { key: 'complete_50_lessons', value: stats.lessonsCompleted },
      { key: 'complete_100_lessons', value: stats.lessonsCompleted },
      { key: 'complete_250_lessons', value: stats.lessonsCompleted },
      
      // Learning - exercises
      { key: 'exercise_master', value: stats.exercisesCompleted },
    ];

    // Get current user achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, progress, unlocked_at, achievements(key)')
      .eq('user_id', user.id);

    const currentProgress: Record<string, { progress: number; unlocked: boolean }> = {};
    userAchievements?.forEach((ua: any) => {
      if (ua.achievements?.key) {
        currentProgress[ua.achievements.key] = {
          progress: ua.progress,
          unlocked: !!ua.unlocked_at
        };
      }
    });

    // Sync each achievement - set to absolute value
    for (const ach of achievementsToSync) {
      const current = currentProgress[ach.key];
      
      // Skip if already unlocked or if current progress is already correct
      if (current?.unlocked) continue;
      if (current?.progress === ach.value) continue;
      
      // Calculate the increment needed to reach the correct value
      const currentVal = current?.progress || 0;
      const increment = ach.value - currentVal;
      
      if (increment > 0) {
        await supabase.rpc('update_achievement_progress', {
          p_user_id: user.id,
          p_achievement_key: ach.key,
          p_increment: increment
        });
      }
    }
  }, [user, fetchStats]);

  return { syncAchievements, fetchStats };
};
