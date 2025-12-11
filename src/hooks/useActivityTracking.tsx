import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface ActivityContext {
  page?: string;
  feature?: string;
  feature_name?: string;
  duration?: number;
  last_page?: string;
  metadata?: Record<string, any>;
}

// Feature name mapping for better tracking
const FEATURE_NAMES: Record<string, string> = {
  '/ai-chat': 'ai_chat',
  '/community': 'community',
  '/friends': 'friends',
  '/messages': 'messages',
  '/certificates': 'certificates',
  '/achievements': 'achievements',
  '/click-of-the-week': 'click_of_week',
  '/courses': 'courses',
  '/hangout': 'hangout',
  '/enem-tutor': 'enem_tutor',
  '/enem-course': 'enem_course',
  '/settings': 'settings',
  '/dashboard': 'dashboard',
};

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

  // Get feature name from path
  const getFeatureName = useCallback((path: string): string | undefined => {
    // Check exact matches first
    if (FEATURE_NAMES[path]) return FEATURE_NAMES[path];
    
    // Check path prefixes
    for (const [prefix, name] of Object.entries(FEATURE_NAMES)) {
      if (path.startsWith(prefix)) return name;
    }
    
    // Check for course pages
    if (path.match(/^\/course\/[^/]+$/)) return 'course_view';
    if (path.match(/^\/enem-lesson\//)) return 'enem_lesson';
    if (path.match(/^\/enem-exam\//)) return 'enem_exam';
    if (path.match(/^\/profile\//)) return 'profile_view';
    
    return undefined;
  }, []);

  // Track page views with feature detection
  useEffect(() => {
    if (!user) return;

    const currentPage = location.pathname;
    const now = Date.now();
    const featureName = getFeatureName(currentPage);

    // Track page exit (time spent on previous page)
    if (lastPageRef.current && lastPageRef.current !== currentPage) {
      const duration = Math.floor((now - pageStartRef.current) / 1000);
      trackActivity('page_exit', {
        page: lastPageRef.current,
        duration,
        feature_name: getFeatureName(lastPageRef.current),
      });
    }

    // Track page view with feature name
    trackActivity('page_view', {
      page: currentPage,
      feature_name: featureName,
    });

    lastPageRef.current = currentPage;
    pageStartRef.current = now;
  }, [location.pathname, user, trackActivity, getFeatureName]);

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
      feature_name: feature,
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

  // Track Speech Tutor usage
  const trackSpeechTutor = useCallback((action: 'open' | 'close' | 'conversation', metadata?: Record<string, any>) => {
    trackActivity('feature_use', {
      feature: 'speech_tutor',
      feature_name: 'speech_tutor',
      page: location.pathname,
      metadata: { action, ...metadata },
    });
  }, [trackActivity, location.pathname]);

  // Track AI Chat usage
  const trackAIChat = useCallback((action: 'message_sent' | 'conversation_started', metadata?: Record<string, any>) => {
    trackActivity('feature_use', {
      feature: 'ai_chat',
      feature_name: 'ai_chat',
      page: location.pathname,
      metadata: { action, ...metadata },
    });
  }, [trackActivity, location.pathname]);

  // Track Certificate view
  const trackCertificates = useCallback((action: 'view' | 'download', metadata?: Record<string, any>) => {
    trackActivity('feature_use', {
      feature: 'certificates',
      feature_name: 'certificates',
      page: location.pathname,
      metadata: { action, ...metadata },
    });
  }, [trackActivity, location.pathname]);

  return {
    trackActivity,
    trackFeatureUse,
    trackClick,
    trackSpeechTutor,
    trackAIChat,
    trackCertificates,
  };
}
