import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { gameSounds } from '@/utils/gameSounds';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  xp_reward: number;
  requirement_count: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
  achievements: Achievement;
}

interface GamificationData {
  total_xp: number;
  current_level: number;
  selected_badge_id: string | null;
  selected_frame_id: string | null;
}

// Callback for external celebration triggers (set by CelebrationProvider)
let celebrationCallback: ((type: string, title?: string, subtitle?: string) => void) | null = null;

export const setCelebrationCallback = (callback: typeof celebrationCallback) => {
  celebrationCallback = callback;
};

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
      fetchAchievements();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Initialize if not exists
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id, total_xp: 0, current_level: 1 })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setGamificationData(newData);
      } else {
        setGamificationData(data);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      setAchievements(data as any || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const addXP = async (amount: number, source: string, description?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_xp: amount,
        p_source: source,
        p_description: description
      });

      if (error) throw error;

      const result = data as any;
      if (result?.leveled_up) {
        // Play level up sound
        gameSounds.playLevelUp();
        
        // Trigger celebration if callback is set
        if (celebrationCallback) {
          celebrationCallback('level_up', `NÍVEL ${result.new_level}!`, 'Você subiu de nível! Continue assim!');
        } else {
          // Fallback to toast if no celebration callback
          toast({
            title: '🎉 Você subiu de nível!',
            description: `Parabéns! Agora você é nível ${result.new_level}`,
            duration: 5000,
          });
        }
      }

      await fetchGamificationData();
      return result;
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  const updateAchievement = async (achievementKey: string, increment: number = 1) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_achievement_key: achievementKey,
        p_increment: increment
      });

      if (error) throw error;

      const result = data as any;
      if (result?.unlocked) {
        // Play achievement sound
        gameSounds.playAchievement();
        
        const achievement = achievements.find(a => a.achievements.key === achievementKey);
        const icon = achievement?.achievements.icon || '🏆';
        const name = achievement?.achievements.name || 'Nova Conquista';
        
        // Trigger celebration if callback is set
        if (celebrationCallback) {
          celebrationCallback('achievement', 'CONQUISTA DESBLOQUEADA!', `${icon} ${name}`);
        } else {
          // Fallback to toast if no celebration callback
          toast({
            title: '🏆 Conquista Desbloqueada!',
            description: `${icon} ${name}`,
            duration: 5000,
          });
        }
      }

      await fetchAchievements();
      return result;
    } catch (error) {
      console.error('Error updating achievement:', error);
    }
  };

  const getXPForNextLevel = () => {
    if (!gamificationData) return 0;
    return gamificationData.current_level * 100;
  };

  const getProgressToNextLevel = () => {
    if (!gamificationData) return 0;
    const xpForNext = getXPForNextLevel();
    const currentLevelXP = gamificationData.total_xp % xpForNext;
    return (currentLevelXP / xpForNext) * 100;
  };

  return {
    gamificationData,
    achievements,
    loading,
    addXP,
    updateAchievement,
    getXPForNextLevel,
    getProgressToNextLevel,
    refetch: () => {
      fetchGamificationData();
      fetchAchievements();
    }
  };
};