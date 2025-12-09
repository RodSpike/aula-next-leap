import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SoundPreferences {
  enabled: boolean;
  volume: number;
  feedbackSounds: boolean;
  navigationSounds: boolean;
  celebrationSounds: boolean;
}

interface SoundPreferencesContextType {
  preferences: SoundPreferences;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setFeedbackSounds: (enabled: boolean) => void;
  setNavigationSounds: (enabled: boolean) => void;
  setCelebrationSounds: (enabled: boolean) => void;
  toggleEnabled: () => void;
}

const defaultPreferences: SoundPreferences = {
  enabled: true,
  volume: 0.7,
  feedbackSounds: true,
  navigationSounds: true,
  celebrationSounds: true
};

const STORAGE_KEY = 'aula-click-sound-preferences';

const SoundPreferencesContext = createContext<SoundPreferencesContextType | null>(null);

export const useSoundPreferences = () => {
  const context = useContext(SoundPreferencesContext);
  if (!context) {
    throw new Error('useSoundPreferences must be used within a SoundPreferencesProvider');
  }
  return context;
};

interface SoundPreferencesProviderProps {
  children: ReactNode;
}

export const SoundPreferencesProvider: React.FC<SoundPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<SoundPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultPreferences, ...JSON.parse(saved) };
        } catch {
          return defaultPreferences;
        }
      }
    }
    return defaultPreferences;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setEnabled = useCallback((enabled: boolean) => {
    setPreferences(prev => ({ ...prev, enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPreferences(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setFeedbackSounds = useCallback((feedbackSounds: boolean) => {
    setPreferences(prev => ({ ...prev, feedbackSounds }));
  }, []);

  const setNavigationSounds = useCallback((navigationSounds: boolean) => {
    setPreferences(prev => ({ ...prev, navigationSounds }));
  }, []);

  const setCelebrationSounds = useCallback((celebrationSounds: boolean) => {
    setPreferences(prev => ({ ...prev, celebrationSounds }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setPreferences(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return (
    <SoundPreferencesContext.Provider
      value={{
        preferences,
        setEnabled,
        setVolume,
        setFeedbackSounds,
        setNavigationSounds,
        setCelebrationSounds,
        toggleEnabled
      }}
    >
      {children}
    </SoundPreferencesContext.Provider>
  );
};
