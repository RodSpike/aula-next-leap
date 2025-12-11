import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTeacherStatus(userId: string | undefined) {
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!userId) {
        setIsTeacher(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_teacher', {
          user_uuid: userId
        });

        if (error) {
          console.error('Error checking teacher status:', error);
          setIsTeacher(false);
        } else {
          setIsTeacher(!!data);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherStatus();
  }, [userId]);

  return { isTeacher, loading };
}

// Hook to check multiple users' teacher status at once
export function useMultipleTeacherStatus(userIds: string[]) {
  const [teacherMap, setTeacherMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeacherStatuses = async () => {
      if (!userIds.length) {
        setTeacherMap({});
        setLoading(false);
        return;
      }

      try {
        const results: Record<string, boolean> = {};
        
        // Check each user's teacher status
        await Promise.all(
          userIds.map(async (userId) => {
            const { data } = await supabase.rpc('is_teacher', {
              user_uuid: userId
            });
            results[userId] = !!data;
          })
        );

        setTeacherMap(results);
      } catch (error) {
        console.error('Error checking teacher statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherStatuses();
  }, [userIds.join(',')]);

  return { teacherMap, loading };
}
