import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CelebrationMascot } from '@/components/mascot/CelebrationMascot';
import { gameSounds } from '@/utils/gameSounds';

type CelebrationType = 'level_up' | 'achievement' | 'streak' | 'perfect_score' | 'course_complete';

interface CelebrationData {
  type: CelebrationType;
  title?: string;
  subtitle?: string;
}

interface CelebrationContextType {
  celebrate: (type: CelebrationType, title?: string, subtitle?: string) => void;
  celebrateLevelUp: (newLevel: number) => void;
  celebrateAchievement: (name: string, icon?: string) => void;
  celebrateStreak: (days: number) => void;
  celebratePerfectScore: (score: number, total: number) => void;
  celebrateCourseComplete: (courseName: string) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export const useCelebrationContext = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebrationContext must be used within a CelebrationProvider');
  }
  return context;
};

interface CelebrationProviderProps {
  children: ReactNode;
}

export const CelebrationProvider: React.FC<CelebrationProviderProps> = ({ children }) => {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const celebrate = useCallback((type: CelebrationType, title?: string, subtitle?: string) => {
    setCelebration({ type, title, subtitle });
    
    // Play appropriate sound
    switch (type) {
      case 'level_up':
        gameSounds.playLevelUp();
        break;
      case 'achievement':
        gameSounds.playAchievement();
        break;
      case 'streak':
        gameSounds.playStreak();
        break;
      case 'perfect_score':
      case 'course_complete':
        gameSounds.playCelebration();
        break;
    }
  }, []);

  const celebrateLevelUp = useCallback((newLevel: number) => {
    celebrate('level_up', `NÍVEL ${newLevel}!`, 'Você subiu de nível! Continue assim!');
  }, [celebrate]);

  const celebrateAchievement = useCallback((name: string, icon?: string) => {
    celebrate('achievement', 'CONQUISTA DESBLOQUEADA!', `${icon || '🏆'} ${name}`);
  }, [celebrate]);

  const celebrateStreak = useCallback((days: number) => {
    celebrate('streak', `${days} DIAS DE STREAK!`, 'Você está em uma sequência incrível!');
  }, [celebrate]);

  const celebratePerfectScore = useCallback((score: number, total: number) => {
    celebrate('perfect_score', 'PONTUAÇÃO PERFEITA!', `Você acertou todas as ${total} questões!`);
  }, [celebrate]);

  const celebrateCourseComplete = useCallback((courseName: string) => {
    celebrate('course_complete', 'CURSO COMPLETO!', `Parabéns por completar ${courseName}!`);
  }, [celebrate]);

  const closeCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return (
    <CelebrationContext.Provider
      value={{
        celebrate,
        celebrateLevelUp,
        celebrateAchievement,
        celebrateStreak,
        celebratePerfectScore,
        celebrateCourseComplete
      }}
    >
      {children}
      
      {/* Global Celebration Modal */}
      {celebration && (
        <CelebrationMascot
          type={celebration.type}
          title={celebration.title}
          subtitle={celebration.subtitle}
          onClose={closeCelebration}
        />
      )}
    </CelebrationContext.Provider>
  );
};
