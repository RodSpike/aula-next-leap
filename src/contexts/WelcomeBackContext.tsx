import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWelcomeBack, WelcomeBackSuggestion } from '@/hooks/useWelcomeBack';
import { WelcomeBackDialog } from '@/components/welcome-back/WelcomeBackDialog';
import { useLocation } from 'react-router-dom';

interface WelcomeBackContextType {
  showWelcomeBack: () => void;
  dismissWelcomeBack: () => void;
  suggestion: WelcomeBackSuggestion | null;
}

const WelcomeBackContext = createContext<WelcomeBackContextType | undefined>(undefined);

const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_SHOWN_KEY = 'welcome_back_shown_this_session';
const LAST_ACTIVE_KEY = 'welcome_back_last_active';

export function WelcomeBackProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  // Clear session flag when user logs out
  useEffect(() => {
    if (!user && !authLoading) {
      console.log('[WelcomeBack] User logged out, clearing session flag');
      sessionStorage.removeItem(SESSION_SHOWN_KEY);
    }
  }, [user, authLoading]);
  const { suggestion, loading: suggestionLoading } = useWelcomeBack();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  // Protected routes where we can show the dialog - never show on home page or public routes
  const protectedRoutes = ['/dashboard', '/courses', '/community', '/achievements', '/friends', '/messages', '/certificates'];
  const isProtectedRoute = location.pathname !== '/' && protectedRoutes.some(route => location.pathname.startsWith(route));

  // Check if we should show the popup
  const shouldShowPopup = useCallback((): boolean => {
    if (!user || !suggestion || hasShownThisSession) return false;
    if (!isProtectedRoute) return false;

    // Check session storage - only show once per session
    const shownThisSession = sessionStorage.getItem(SESSION_SHOWN_KEY);
    if (shownThisSession === 'true') return false;

    return true;
  }, [user, suggestion, hasShownThisSession, isProtectedRoute]);

  // Show welcome back popup
  const showWelcomeBack = useCallback(() => {
    if (!shouldShowPopup()) return;
    
    setIsOpen(true);
    setHasShownThisSession(true);
    sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');
  }, [shouldShowPopup]);

  // Dismiss welcome back popup
  const dismissWelcomeBack = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle visibility change (user returns to tab)
  useEffect(() => {
    if (!user || authLoading || suggestionLoading) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
        const lastActiveTime = lastActive ? parseInt(lastActive, 10) : Date.now();
        const inactiveTime = Date.now() - lastActiveTime;

        if (inactiveTime >= INACTIVITY_THRESHOLD_MS) {
          // User was inactive for 2+ hours
          setTimeout(() => {
            showWelcomeBack();
          }, 500); // Small delay for smoother UX
        }
      } else {
        // Tab becoming hidden - save last active time
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
    };

    visibilityHandlerRef.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, authLoading, suggestionLoading, showWelcomeBack]);

  // Track activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    };

    // Update on user interactions
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => document.addEventListener(event, updateActivity, { passive: true }));

    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity));
    };
  }, []);

  // Show on initial login/session start when user reaches a protected route
  useEffect(() => {
    console.log('[WelcomeBack] Effect triggered:', {
      user: !!user,
      authLoading,
      suggestionLoading,
      isProtectedRoute,
      hasShownThisSession,
      suggestion: !!suggestion,
      pathname: location.pathname
    });

    // Wait for auth to be ready
    if (authLoading) {
      console.log('[WelcomeBack] Still loading auth...');
      return;
    }
    
    // Need a logged-in user
    if (!user) {
      console.log('[WelcomeBack] No user, skipping');
      return;
    }
    
    // Must be on a protected route
    if (!isProtectedRoute) {
      console.log('[WelcomeBack] Not on protected route, skipping');
      return;
    }
    
    // Check if already shown this session (in state or storage)
    const shownInStorage = sessionStorage.getItem(SESSION_SHOWN_KEY) === 'true';
    if (hasShownThisSession || shownInStorage) {
      console.log('[WelcomeBack] Already shown this session');
      if (!hasShownThisSession && shownInStorage) {
        setHasShownThisSession(true);
      }
      return;
    }

    // Wait for suggestion to load, but don't block forever
    if (suggestionLoading) {
      console.log('[WelcomeBack] Still loading suggestion...');
      return;
    }

    // Show welcome back popup after a small delay (even without suggestion)
    console.log('[WelcomeBack] Scheduling popup display...');
    const timer = setTimeout(() => {
      console.log('[WelcomeBack] Showing popup now!');
      setIsOpen(true);
      setHasShownThisSession(true);
      sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, authLoading, suggestionLoading, isProtectedRoute, hasShownThisSession, suggestion, location.pathname]);

  return (
    <WelcomeBackContext.Provider value={{ showWelcomeBack, dismissWelcomeBack, suggestion }}>
      {children}
      <WelcomeBackDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        suggestion={suggestion} 
      />
    </WelcomeBackContext.Provider>
  );
}

export function useWelcomeBackContext() {
  const context = useContext(WelcomeBackContext);
  if (context === undefined) {
    throw new Error('useWelcomeBackContext must be used within a WelcomeBackProvider');
  }
  return context;
}
