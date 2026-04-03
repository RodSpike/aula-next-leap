import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * NavigationPersistence - only saves scroll position and restores it
 * on the SAME page. Does NOT redirect users between pages.
 */
export const NavigationPersistence = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const scrollPositions = useRef<Record<string, number>>({});

  // Save scroll position when navigating away
  useEffect(() => {
    const key = location.pathname + location.search;

    // Restore scroll position for this route if we have one
    const saved = scrollPositions.current[key];
    if (saved !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
    }

    // Save scroll on beforeunload or route change
    return () => {
      scrollPositions.current[key] = window.scrollY;
    };
  }, [location.pathname, location.search]);

  return null;
};

// Helper function to mark a fresh login
export const markFreshLogin = () => {
  // no-op, login flow handled by useAuth
};

// Helper function to navigate directly to a group
export const navigateToGroup = (groupId: string, navigate: (path: string) => void) => {
  navigate(`/community?group=${groupId}`);
};

// Helper function to navigate to specific lesson
export const navigateToLesson = (courseId: string, lessonId: string, navigate: (path: string) => void) => {
  navigate(`/course/${courseId}#lesson-${lessonId}`);
};
