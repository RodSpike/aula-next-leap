import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create notification sound
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.3;

    // Subscribe to new direct messages
    const dmChannel = supabase
      .channel(`dm-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', message.sender_id)
            .single();

          // Show toast notification
          toast.message(sender?.display_name || 'Nova mensagem', {
            description: message.content?.substring(0, 100) || 'Enviou uma mensagem',
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = `/messages?userId=${message.sender_id}`;
              },
            },
          });

          // Play sound
          try {
            audioRef.current?.play();
          } catch (e) {
            // Audio may be blocked by browser
          }
        }
      )
      .subscribe();

    // Subscribe to group chat messages
    const groupChannel = supabase
      .channel(`group-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Don't notify for own messages
          if (message.sender_id === user.id) return;

          // Check if user is member of this group
          const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', message.group_id)
            .eq('user_id', user.id)
            .eq('status', 'accepted')
            .single();

          if (!membership) return;

          // Get sender and group info
          const [{ data: sender }, { data: group }] = await Promise.all([
            supabase.from('profiles').select('display_name').eq('user_id', message.sender_id).single(),
            supabase.from('community_groups').select('name').eq('id', message.group_id).single(),
          ]);

          toast.message(`${sender?.display_name || 'Alguém'} em ${group?.name || 'grupo'}`, {
            description: message.content?.substring(0, 80) || 'Enviou uma mensagem',
          });
        }
      )
      .subscribe();

    // Subscribe to friend requests
    const friendChannel = supabase
      .channel(`friend-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friends',
          filter: `requested_id=eq.${user.id}`,
        },
        async (payload) => {
          const request = payload.new as any;
          
          const { data: requester } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', request.requester_id)
            .single();

          toast.message('Solicitação de amizade', {
            description: `${requester?.display_name || 'Alguém'} quer ser seu amigo`,
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = '/friends';
              },
            },
          });

          try {
            audioRef.current?.play();
          } catch (e) {}
        }
      )
      .subscribe();

    // Subscribe to notifications table
    const notifChannel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as any;
          
          if (notification.type === 'friend_main_post_updated') {
            toast.message(`${notification.data?.friend_display_name || 'Um amigo'} atualizou o perfil`, {
              description: notification.data?.preview?.substring(0, 80) || 'Veja o que há de novo',
              action: {
                label: 'Ver',
                onClick: () => {
                  window.location.href = `/profile/${notification.data?.friend_id}`;
                },
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(friendChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user]);
}
