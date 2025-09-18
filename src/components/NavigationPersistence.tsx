import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const NAVIGATION_STORAGE_KEY = 'aula-click-nav-state';
const LOGIN_TIMESTAMP_KEY = 'aula-click-login-timestamp';

interface NavigationState {
  path: string;
  timestamp: number;
  groupId?: string;
}

export const NavigationPersistence = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Save current navigation state
  useEffect(() => {
    if (!loading && user && location.pathname !== '/dashboard') {
      const state: NavigationState = {
        path: location.pathname + location.search,
        timestamp: Date.now(),
      };
      
      // Extract group ID from community page URL parameters if present
      const urlParams = new URLSearchParams(location.search);
      const groupId = urlParams.get('group');
      if (groupId) {
        state.groupId = groupId;
      }

      localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(state));
    }
  }, [location, user, loading]);

  // Restore navigation state on auth change
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

      // Not a fresh login - restore previous state if available
      if (savedState && location.pathname === '/dashboard') {
        try {
          const state: NavigationState = JSON.parse(savedState);
          
          // Only restore if the saved state is relatively recent (within 24 hours)
          const isRecentState = (Date.now() - state.timestamp) < 24 * 60 * 60 * 1000;
          
          if (isRecentState && state.path !== '/dashboard') {
            navigate(state.path);
          }
        } catch (error) {
          console.error('Error parsing saved navigation state:', error);
          localStorage.removeItem(NAVIGATION_STORAGE_KEY);
        }
      }
    }
  }, [user, loading, navigate, location.pathname]);

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