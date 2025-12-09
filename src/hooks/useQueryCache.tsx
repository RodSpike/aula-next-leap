import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Profile queries
export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['profile', targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Courses queries
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// User progress queries
export function useUserProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Gamification queries
export function useGamificationData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gamification', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// Achievements queries
export function useAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      if (!user) return { all: [], user: [] };
      
      const [{ data: all }, { data: userAchievements }] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
      ]);
      
      return { all: all || [], user: userAchievements || [] };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
}

// Friends queries
export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

// Community groups queries
export function useCommunityGroups() {
  return useQuery({
    queryKey: ['community-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .eq('is_private_chat', false)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Conversations queries
export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: memberships } = await supabase
        .from('group_members')
        .select(`
          group_id,
          community_groups (
            id, name, is_private_chat, created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      return memberships || [];
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute for conversations
  });
}

// Mutations with cache invalidation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: any) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

// Hook to prefetch common data
export function usePrefetchData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetch = async () => {
    if (!user) return;

    // Prefetch courses
    queryClient.prefetchQuery({
      queryKey: ['courses'],
      queryFn: async () => {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .order('order_index', { ascending: true });
        return data;
      },
    });

    // Prefetch profile
    queryClient.prefetchQuery({
      queryKey: ['profile', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        return data;
      },
    });

    // Prefetch gamification
    queryClient.prefetchQuery({
      queryKey: ['gamification', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', user.id)
          .single();
        return data;
      },
    });
  };

  return prefetch;
}
