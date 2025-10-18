import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface OnlineStatusProps {
  userId: string;
  groupId: string;
  showBadge?: boolean;
  className?: string;
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({ 
  userId, 
  groupId, 
  showBadge = true,
  className 
}) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId || !groupId) return;

    // Check initial online status
    checkOnlineStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`online-status-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_online_status',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new && payload.new.user_id === userId) {
            const newData = payload.new as any;
            setIsOnline(newData.is_online);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, groupId]);

    const checkOnlineStatus = async () => {
    try {
      const { data } = await supabase
        .from('user_online_status')
        .select('is_online, last_seen_at')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .maybeSingle();

      if (data) {
        // Consider user online if last seen within 3 minutes (more strict)
        const lastSeen = new Date(data.last_seen_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
        
        setIsOnline(data.is_online && diffMinutes < 3);
      }
    } catch (error) {
      console.error('Error checking online status:', error);
    }
  };

  // Update current user's online status
  useEffect(() => {
    if (!user || user.id !== userId) return;

    const updateOnlineStatus = async () => {
      try {
        await supabase
          .from('user_online_status')
          .upsert({
            user_id: userId,
            group_id: groupId,
            is_online: true,
            last_seen_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,group_id'
          });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User left the page, mark as offline
        try {
          await supabase
            .from('user_online_status')
            .update({
              is_online: false,
              last_seen_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('group_id', groupId);
        } catch (error) {
          console.error('Error updating offline status:', error);
        }
      } else {
        // User returned, mark as online
        updateOnlineStatus();
      }
    };

    const handleBeforeUnload = async () => {
      navigator.sendBeacon('/api/offline', JSON.stringify({ userId, groupId }));
    };

    // Set initial online status
    updateOnlineStatus();

    // Update every 90 seconds to keep status fresh and more accurate
    const interval = setInterval(updateOnlineStatus, 90 * 1000);

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Mark as offline when component unmounts
      supabase
        .from('user_online_status')
        .update({
          is_online: false,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('group_id', groupId);
    };
  }, [user, userId, groupId]);

  if (!showBadge) {
    return (
      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} ${className}`} />
    );
  }

  return (
    <Badge 
      variant={isOnline ? "default" : "secondary"} 
      className={`text-xs ${isOnline ? 'bg-green-500 hover:bg-green-600' : ''} ${className}`}
    >
      <div className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-100' : 'bg-gray-400'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </Badge>
  );
};
