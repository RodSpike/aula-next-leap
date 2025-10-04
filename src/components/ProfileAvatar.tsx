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
  const [frameUrl, setFrameUrl] = useState<string | null>(null);

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
            .select('image_url')
            .eq('id', frameId)
            .maybeSingle();
          if (isMounted) setFrameUrl(frame?.image_url || null);
        } else {
          if (isMounted) setFrameUrl(null);
        }
      } catch (e) {
        console.warn('Failed to load profile frame', e);
      }
    };
    fetchFrame();
    return () => { isMounted = false; };
  }, [userId]);

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={cn('h-full w-full')}>
        <AvatarImage src={avatarUrl || undefined} alt="User avatar" />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {frameUrl && (
        <div 
          className="pointer-events-none absolute inset-0 z-10 select-none rounded-full"
          style={{
            backgroundImage: `url(${frameUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
    </div>
  );
};