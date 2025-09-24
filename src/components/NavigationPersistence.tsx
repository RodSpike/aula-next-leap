import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const NAVIGATION_STORAGE_KEY = 'aula-click-nav-state';
const LOGIN_TIMESTAMP_KEY = 'aula-click-login-timestamp';

interface NavigationState {
  path: string;
  timestamp: number;
  groupId?: string;
  lessonId?: string;
  courseId?: string;
  scrollPosition?: number;
}

export const NavigationPersistence = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Save current navigation state with more granular tracking
  useEffect(() => {
    if (!loading && user && location.pathname !== '/dashboard') {
      const state: NavigationState = {
        path: location.pathname + location.search,
        timestamp: Date.now(),
        scrollPosition: window.scrollY,
      };
      
      // Extract parameters from URL
      const urlParams = new URLSearchParams(location.search);
      const groupId = urlParams.get('group');
      const lessonId = urlParams.get('lesson');
      const courseId = urlParams.get('course');
      
      if (groupId) state.groupId = groupId;
      if (lessonId) state.lessonId = lessonId;
      if (courseId) state.courseId = courseId;

      // For course pages, extract lesson from hash
      if (location.pathname.startsWith('/course/') && location.hash) {
        const hashMatch = location.hash.match(/#lesson-(\d+)/);
        if (hashMatch) {
          state.lessonId = hashMatch[1];
        }
      }

      localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(state));
    }
  }, [location, user, loading]);

  // Restore navigation state on auth change with improved persistence
  useEffect(() => {
    if (!loading && user) {
      const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
      const savedState = localStorage.getItem(NAVIGATION_STORAGE_KEY);
      
      // Check if this is a fresh login (within last 5 seconds)
      const isFreshLogin = loginTimestamp && 
        (Date.now() - parseInt(loginTimestamp)) < 5000;

      if (isFreshLogin) {
        // Fresh login - go to dashboard and clear login timestamp
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
        if (location.pathname !== '/dashboard') {
          navigate('/dashboard');
        }
        return;
      }

      // Not a fresh login - restore previous state if available and not on dashboard
      if (savedState && location.pathname === '/dashboard') {
        try {
          const state: NavigationState = JSON.parse(savedState);
          
          // Only restore if the saved state is relatively recent (within 24 hours)
          const isRecentState = (Date.now() - state.timestamp) < 24 * 60 * 60 * 1000;
          
          if (isRecentState && state.path !== '/dashboard') {
            // Use replace instead of navigate to avoid triggering reload
            window.history.replaceState(null, '', state.path);
            
            // Restore scroll position and specific elements
            setTimeout(() => {
              if (state.scrollPosition) {
                window.scrollTo(0, state.scrollPosition);
              }
              
              // Handle lesson/course specific restoration
              if (state.lessonId && state.path.startsWith('/course/')) {
                const lessonElement = document.getElementById(`lesson-${state.lessonId}`);
                if (lessonElement) {
                  lessonElement.scrollIntoView({ behavior: 'smooth' });
                }
              }
              
              // Handle group restoration in community
              if (state.groupId && state.path.startsWith('/community')) {
                const groupElement = document.querySelector(`[data-group-id="${state.groupId}"]`);
                if (groupElement) {
                  (groupElement as HTMLElement).click();
                }
              }
            }, 100);
          }
        } catch (error) {
          console.error('Error parsing saved navigation state:', error);
          localStorage.removeItem(NAVIGATION_STORAGE_KEY);
        }
      }
    }
  }, [user, loading, location.pathname]);

  return null;
};

// Helper function to mark a fresh login
export const markFreshLogin = () => {
  localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
};

// Helper function to navigate directly to a group
export const navigateToGroup = (groupId: string, navigate: (path: string) => void) => {
  const path = `/community?group=${groupId}`;
  navigate(path);
  
  // Update saved state
  const state: NavigationState = {
    path,
    timestamp: Date.now(),
    groupId,
  };
  localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(state));
};

// Helper function to navigate to specific lesson
export const navigateToLesson = (courseId: string, lessonId: string, navigate: (path: string) => void) => {
  const path = `/course/${courseId}#lesson-${lessonId}`;
  navigate(path);
  
  // Update saved state
  const state: NavigationState = {
    path,
    timestamp: Date.now(),
    courseId,
    lessonId,
  };
  localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(state));
};