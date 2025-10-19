import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(182);

  useEffect(() => {
    const calculateOnlineCount = async () => {
      // Get actual logged-in users in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from('user_online_status')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .gte('last_seen_at', fiveMinutesAgo);

      const actualCount = count || 0;
      
      // Baseline is 182, only show higher if actual users exceed it
      const finalCount = Math.max(182, actualCount);
      
      // Add some realistic variation based on time of day
      const hour = new Date().getHours();
      const peakHourBonus = hour >= 18 && hour <= 22 ? 20 : 0;
      
      setOnlineCount(finalCount + peakHourBonus);
    };

    calculateOnlineCount();
    const interval = setInterval(calculateOnlineCount, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return onlineCount;
}