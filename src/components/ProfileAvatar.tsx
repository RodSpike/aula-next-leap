import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  fallback?: string;
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ userId, avatarUrl, fallback = 'U', className }) => {
  const [frameKey, setFrameKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFrame = async () => {
      try {
        const { data: gamification } = await supabase
          .from('user_gamification')
          .select('selected_frame_id')
          .eq('user_id', userId)
          .maybeSingle();

        const frameId = gamification?.selected_frame_id as string | null;
        if (frameId) {
          const { data: frame } = await supabase
            .from('profile_frames')
            .select('key')
            .eq('id', frameId)
            .maybeSingle();
          if (isMounted) setFrameKey(frame?.key || null);
        } else {
          if (isMounted) setFrameKey(null);
        }
      } catch (e) {
        console.warn('Failed to load profile frame', e);
      }
    };
    fetchFrame();
    return () => { isMounted = false; };
  }, [userId]);

  const getFrameBorderClass = (key: string | null) => {
    if (!key || key === 'default') return '';
    
    switch (key) {
      case 'diamond':
        return 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-background';
      case 'platinum':
        return 'ring-4 ring-gray-400 ring-offset-2 ring-offset-background';
      case 'gold':
        return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-background';
      case 'silver':
        return 'ring-4 ring-gray-300 ring-offset-2 ring-offset-background';
      case 'bronze':
        return 'ring-4 ring-amber-600 ring-offset-2 ring-offset-background';
      case 'rainbow':
        return 'ring-4 ring-purple-500 ring-offset-2 ring-offset-background animate-pulse';
      default:
        return 'ring-4 ring-primary ring-offset-2 ring-offset-background';
    }
  };

  return (
    <Avatar className={cn('h-full w-full border-0', getFrameBorderClass(frameKey), className)}>
      <AvatarImage src={avatarUrl || undefined} alt="User avatar" />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};
