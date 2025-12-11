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
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours between popups
const SESSION_SHOWN_KEY = 'welcome_back_shown_this_session';
const LAST_SHOWN_KEY = 'welcome_back_last_shown';
const LAST_ACTIVE_KEY = 'welcome_back_last_active';

export function WelcomeBackProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { suggestion, loading: suggestionLoading } = useWelcomeBack();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  // Protected routes where we can show the dialog
  const protectedRoutes = ['/dashboard', '/courses', '/community', '/achievements', '/friends', '/messages', '/certificates'];
  const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));

  // Check if we should show the popup
  const shouldShowPopup = useCallback((): boolean => {
    if (!user || !suggestion || hasShownThisSession) return false;
    if (!isProtectedRoute) return false;

    // Check session storage
    const shownThisSession = sessionStorage.getItem(SESSION_SHOWN_KEY);
    if (shownThisSession === 'true') return false;

    // Check cooldown
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    if (lastShown) {
      const lastShownTime = parseInt(lastShown, 10);
      if (Date.now() - lastShownTime < COOLDOWN_MS) return false;
    }

    return true;
  }, [user, suggestion, hasShownThisSession, isProtectedRoute]);

  // Show welcome back popup
  const showWelcomeBack = useCallback(() => {
    if (!shouldShowPopup()) return;
    
    setIsOpen(true);
    setHasShownThisSession(true);
    sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');
    localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
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

  // Show on initial login/session start
  useEffect(() => {
    if (!user || authLoading || suggestionLoading) return;
    if (hasShownThisSession) return;
    if (!isProtectedRoute) return;

    // Check if this is a new session
    const shownThisSession = sessionStorage.getItem(SESSION_SHOWN_KEY);
    if (shownThisSession === 'true') {
      setHasShownThisSession(true);
      return;
    }

    // Small delay after login to show welcome back
    const timer = setTimeout(() => {
      showWelcomeBack();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, authLoading, suggestionLoading, isProtectedRoute, hasShownThisSession, showWelcomeBack]);

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
