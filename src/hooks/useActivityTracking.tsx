import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface ActivityContext {
  page?: string;
  feature?: string;
  duration?: number;
  last_page?: string;
  metadata?: Record<string, any>;
}

export function useActivityTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const sessionStartRef = useRef<number>(Date.now());
  const lastPageRef = useRef<string>('');
  const pageStartRef = useRef<number>(Date.now());

  const trackActivity = useCallback(async (action: string, context: ActivityContext = {}) => {
    if (!user) return;

    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          session_duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
        },
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [user]);

  // Track page views
  useEffect(() => {
    if (!user) return;

    const currentPage = location.pathname;
    const now = Date.now();

    // Track page exit (time spent on previous page)
    if (lastPageRef.current && lastPageRef.current !== currentPage) {
      const duration = Math.floor((now - pageStartRef.current) / 1000);
      trackActivity('page_exit', {
        page: lastPageRef.current,
        duration,
      });
    }

    // Track page view
    trackActivity('page_view', {
      page: currentPage,
    });

    lastPageRef.current = currentPage;
    pageStartRef.current = now;
  }, [location.pathname, user, trackActivity]);

  // Track session start
  useEffect(() => {
    if (!user) return;

    trackActivity('session_start', {
      page: location.pathname,
    });

    // Track session end on unmount or before unload
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      
      // Use sendBeacon for reliable tracking on page unload
      const data = JSON.stringify({
        user_id: user.id,
        action: 'session_end',
        context: {
          duration: sessionDuration,
          last_page: location.pathname,
          timestamp: new Date().toISOString(),
        },
      });

      navigator.sendBeacon(
        `https://frbmvljizolvxcxdkefa.supabase.co/rest/v1/user_activity_logs`,
        data
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackActivity('session_end', {
        duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
        last_page: location.pathname,
      });
    };
  }, [user]);

  // Helper to track specific features
  const trackFeatureUse = useCallback((feature: string, metadata?: Record<string, any>) => {
    trackActivity('feature_use', {
      feature,
      page: location.pathname,
      metadata,
    });
  }, [trackActivity, location.pathname]);

  // Track button clicks
  const trackClick = useCallback((element: string, metadata?: Record<string, any>) => {
    trackActivity('click', {
      feature: element,
      page: location.pathname,
      metadata,
    });
  }, [trackActivity, location.pathname]);

  return {
    trackActivity,
    trackFeatureUse,
    trackClick,
  };
}
