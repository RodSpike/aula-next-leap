import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CupheadFoxMood } from '@/components/mascot/CupheadFoxMascot';

export interface WelcomeBackSuggestion {
  type: 'continue_lesson' | 'do_exercises' | 'ask_tutor' | 'click_of_week' | 'click_of_week_waiting' | 'community' | 'feature_discovery' | 'speech_tutor' | 'ai_chat' | 'achievements';
  title: string;
  message: string;
  mascotMood: CupheadFoxMood;
  primaryAction: { label: string; path: string; icon?: string };
  secondaryAction?: { label: string; path: string; icon?: string };
  tertiaryAction?: { label: string; path: string; icon?: string };
  metadata?: Record<string, any>;
  dismissLabel: string;
}

interface LastLesson {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseName: string;
}

interface ClickOfWeekStatus {
  hasLives: boolean;
  livesRemaining: number;
  nextAttemptAt: string | null;
  timeUntilNextAttempt: string | null;
}

interface FeatureUsage {
  feature: string;
  lastUsed: string | null;
  daysSinceLastUse: number;
}

type Language = 'pt' | 'en';

const FEATURE_PAGES: Record<string, string[]> = {
  'community': ['/community'],
  'ai_chat': ['/ai-chat'],
  'speech_tutor': ['/dashboard'],
  'achievements': ['/achievements'],
  'friends': ['/friends'],
  'messages': ['/messages'],
  'click_of_week': ['/click-of-the-week'],
  'courses': ['/courses', '/course/'],
};

// Translations for messages
const translations = {
  pt: {
    dismissLabel: 'Não, obrigado',
    continueLessonTitle: 'Bem-vindo de volta! 📚',
    continueLessonMessage: (lessonTitle: string, courseName: string) => 
      `Você estava estudando "${lessonTitle}" no curso "${courseName}". Quer continuar?`,
    continueLesson: '📚 Continuar Lição',
    doActivities: '📝 Fazer Atividades',
    askClickAI: '🤖 Tirar Dúvidas com ClickAI',
    clickOfWeekTitle: 'Pronto para o desafio? 🎮',
    clickOfWeekMessage: (lives: number) => 
      `Você tem ${lives} vida(s) para jogar Click of the Week e mostrar seus conhecimentos!`,
    playNow: '🎮 Jogar Agora',
    viewLeaderboard: '🏆 Ver Leaderboard',
    waitingTitle: 'Aguardando nova tentativa ⏳',
    waitingMessage: (time: string) => 
      `Ainda falta ${time} para jogar novamente. Que tal continuar estudando?`,
    goToCourses: '📚 Ir para Cursos',
    goToCommunity: '💬 Ir para Comunidade',
    communityTitle: 'Saudades da comunidade! 👋',
    communityMessage: 'Faz um tempo que você não visita a comunidade! Lá você pode fazer amigos e ver conteúdos exclusivos.',
    aiChatTitle: 'Precisa de ajuda? 🤖',
    aiChatMessage: 'Já experimentou conversar com o ClickAI? Ele pode te ajudar com gramática, vocabulário e tirar suas dúvidas!',
    openClickAI: '🤖 Abrir ClickAI',
    speechTutorTitle: 'Pratique sua pronúncia! 🎤',
    speechTutorMessage: 'Que tal praticar conversação em inglês com nosso AI Speech Tutor? É uma ótima forma de melhorar sua fluência!',
    openSpeechTutor: '🎤 Abrir Speech Tutor',
    achievementsTitle: 'Conquistas te esperam! 🏆',
    achievementsMessage: 'Você tem conquistas para desbloquear! Continue estudando e ganhe XP extra.',
    viewAchievements: '🏆 Ver Conquistas',
    welcomeBackTitle: 'Que bom ter você de volta! 🎉',
    welcomeBackMessage: 'Você tem vidas disponíveis no Click of the Week! Que tal testar seus conhecimentos?',
    playClickOfWeek: '🎮 Jogar Click of the Week',
    continueJourneyMessage: (courseName: string) => 
      `Continue sua jornada de aprendizado! Você estava estudando "${courseName}".`,
    continueCourse: '📚 Continuar Curso',
  },
  en: {
    dismissLabel: 'No, thanks',
    continueLessonTitle: 'Welcome back! 📚',
    continueLessonMessage: (lessonTitle: string, courseName: string) => 
      `You were studying "${lessonTitle}" in "${courseName}". Would you like to continue?`,
    continueLesson: '📚 Continue Lesson',
    doActivities: '📝 Do Activities',
    askClickAI: '🤖 Ask ClickAI',
    clickOfWeekTitle: 'Ready for the challenge? 🎮',
    clickOfWeekMessage: (lives: number) => 
      `You have ${lives} life(s) to play Click of the Week and show your knowledge!`,
    playNow: '🎮 Play Now',
    viewLeaderboard: '🏆 View Leaderboard',
    waitingTitle: 'Waiting for next attempt ⏳',
    waitingMessage: (time: string) => 
      `You still need to wait ${time} to play again. How about continuing your studies?`,
    goToCourses: '📚 Go to Courses',
    goToCommunity: '💬 Go to Community',
    communityTitle: 'We miss you in the community! 👋',
    communityMessage: "It's been a while since you visited the community! You can make friends and see exclusive content there.",
    aiChatTitle: 'Need some help? 🤖',
    aiChatMessage: 'Have you tried chatting with ClickAI? It can help you with grammar, vocabulary and answer your questions!',
    openClickAI: '🤖 Open ClickAI',
    speechTutorTitle: 'Practice your pronunciation! 🎤',
    speechTutorMessage: 'How about practicing English conversation with our AI Speech Tutor? It\'s a great way to improve your fluency!',
    openSpeechTutor: '🎤 Open Speech Tutor',
    achievementsTitle: 'Achievements await you! 🏆',
    achievementsMessage: 'You have achievements to unlock! Keep studying and earn extra XP.',
    viewAchievements: '🏆 View Achievements',
    welcomeBackTitle: 'Great to have you back! 🎉',
    welcomeBackMessage: 'You have lives available in Click of the Week! How about testing your knowledge?',
    playClickOfWeek: '🎮 Play Click of the Week',
    continueJourneyMessage: (courseName: string) => 
      `Continue your learning journey! You were studying "${courseName}".`,
    continueCourse: '📚 Continue Course',
  },
};

export function useWelcomeBack() {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<WelcomeBackSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState<Language>('pt');

  // Fetch user's Cambridge level to determine language
  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('cambridge_level')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile?.cambridge_level) {
        const level = profile.cambridge_level.toUpperCase();
        // B1, B2, C1, C2 = English, A1, A2 = Portuguese
        if (['B1', 'B2', 'C1', 'C2'].includes(level)) {
          setUserLanguage('en');
        } else {
          setUserLanguage('pt');
        }
      }
    };
    
    fetchUserLevel();
  }, [user]);

  const getLastLesson = useCallback(async (): Promise<LastLesson | null> => {
    if (!user) return null;

    try {
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('context, created_at')
        .eq('user_id', user.id)
        .eq('action', 'page_view')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!activityLogs) return null;

      const lessonActivity = activityLogs.find(log => {
        const context = log.context as any;
        return context?.page?.includes('/course/');
      });

      if (!lessonActivity) return null;

      const context = lessonActivity.context as any;
      const courseIdMatch = context?.page?.match(/\/course\/([^\/]+)/);
      
      if (!courseIdMatch) return null;

      const courseId = courseIdMatch[1];

      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .maybeSingle();

      if (!course) return null;

      const { data: lessonProgress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, lessons!inner(id, title, course_id)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (lessonProgress && lessonProgress.length > 0) {
        const lesson = lessonProgress[0].lessons as any;
        if (lesson.course_id === courseId) {
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseId: course.id,
            courseName: course.title,
          };
        }
      }

      const { data: firstLesson } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('course_id', courseId)
        .order('order_index')
        .limit(1)
        .maybeSingle();

      if (firstLesson) {
        return {
          lessonId: firstLesson.id,
          lessonTitle: firstLesson.title,
          courseId: course.id,
          courseName: course.title,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting last lesson:', error);
      return null;
    }
  }, [user]);

  const getClickOfWeekStatus = useCallback(async (): Promise<ClickOfWeekStatus> => {
    if (!user) return { hasLives: false, livesRemaining: 0, nextAttemptAt: null, timeUntilNextAttempt: null };

    try {
      const { data: attempt } = await supabase
        .from('click_of_week_attempts')
        .select('lives_remaining, next_attempt_at, completed')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!attempt) {
        return { hasLives: true, livesRemaining: 3, nextAttemptAt: null, timeUntilNextAttempt: null };
      }

      if (attempt.completed) {
        return { hasLives: true, livesRemaining: 3, nextAttemptAt: null, timeUntilNextAttempt: null };
      }

      const hasLives = attempt.lives_remaining > 0;
      let timeUntilNextAttempt: string | null = null;

      if (!hasLives && attempt.next_attempt_at) {
        const nextTime = new Date(attempt.next_attempt_at);
        const now = new Date();
        const diffMs = nextTime.getTime() - now.getTime();
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          timeUntilNextAttempt = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
        } else {
          return { hasLives: true, livesRemaining: 3, nextAttemptAt: null, timeUntilNextAttempt: null };
        }
      }

      return {
        hasLives,
        livesRemaining: attempt.lives_remaining,
        nextAttemptAt: attempt.next_attempt_at,
        timeUntilNextAttempt,
      };
    } catch (error) {
      console.error('Error getting Click of Week status:', error);
      return { hasLives: true, livesRemaining: 3, nextAttemptAt: null, timeUntilNextAttempt: null };
    }
  }, [user]);

  const getFeatureUsage = useCallback(async (): Promise<FeatureUsage[]> => {
    if (!user) return [];

    try {
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('context, created_at')
        .eq('user_id', user.id)
        .eq('action', 'page_view')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!activityLogs) return [];

      const featureLastUsed: Record<string, string> = {};

      for (const log of activityLogs) {
        const context = log.context as any;
        const page = context?.page || '';

        for (const [feature, paths] of Object.entries(FEATURE_PAGES)) {
          if (!featureLastUsed[feature] && paths.some(p => page.includes(p))) {
            featureLastUsed[feature] = log.created_at;
          }
        }
      }

      const now = new Date();
      const features: FeatureUsage[] = Object.entries(FEATURE_PAGES).map(([feature]) => {
        const lastUsed = featureLastUsed[feature] || null;
        let daysSinceLastUse = 999;
        
        if (lastUsed) {
          const lastUsedDate = new Date(lastUsed);
          daysSinceLastUse = Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        return { feature, lastUsed, daysSinceLastUse };
      });

      return features.sort((a, b) => b.daysSinceLastUse - a.daysSinceLastUse);
    } catch (error) {
      console.error('Error getting feature usage:', error);
      return [];
    }
  }, [user]);

  const getLastAction = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: log } = await supabase
        .from('user_activity_logs')
        .select('context')
        .eq('user_id', user.id)
        .eq('action', 'page_view')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!log) return null;
      const context = log.context as any;
      return context?.page || null;
    } catch (error) {
      return null;
    }
  }, [user]);

  const generateSuggestion = useCallback(async (): Promise<WelcomeBackSuggestion | null> => {
    if (!user) return null;

    const t = translations[userLanguage];

    const [lastAction, lastLesson, clickStatus, featureUsage] = await Promise.all([
      getLastAction(),
      getLastLesson(),
      getClickOfWeekStatus(),
      getFeatureUsage(),
    ]);

    // Priority 1: Was in a lesson
    if (lastAction?.includes('/course/') && lastLesson) {
      return {
        type: 'continue_lesson',
        title: t.continueLessonTitle,
        message: t.continueLessonMessage(lastLesson.lessonTitle, lastLesson.courseName),
        mascotMood: 'waving',
        primaryAction: {
          label: t.continueLesson,
          path: `/course/${lastLesson.courseId}`,
          icon: 'book',
        },
        secondaryAction: {
          label: t.doActivities,
          path: `/course/${lastLesson.courseId}?tab=exercises`,
          icon: 'pencil',
        },
        tertiaryAction: {
          label: t.askClickAI,
          path: '/ai-chat',
          icon: 'bot',
        },
        metadata: { lesson: lastLesson },
        dismissLabel: t.dismissLabel,
      };
    }

    // Priority 2: Was playing Click of the Week
    if (lastAction === '/click-of-the-week') {
      if (clickStatus.hasLives) {
        return {
          type: 'click_of_week',
          title: t.clickOfWeekTitle,
          message: t.clickOfWeekMessage(clickStatus.livesRemaining),
          mascotMood: 'excited',
          primaryAction: {
            label: t.playNow,
            path: '/click-of-the-week',
            icon: 'gamepad',
          },
          secondaryAction: {
            label: t.viewLeaderboard,
            path: '/click-of-the-week?tab=leaderboard',
            icon: 'trophy',
          },
          dismissLabel: t.dismissLabel,
        };
      } else {
        return {
          type: 'click_of_week_waiting',
          title: t.waitingTitle,
          message: t.waitingMessage(clickStatus.timeUntilNextAttempt || 'um tempo'),
          mascotMood: 'thinking',
          primaryAction: {
            label: t.goToCourses,
            path: '/courses',
            icon: 'book',
          },
          secondaryAction: {
            label: t.goToCommunity,
            path: '/community',
            icon: 'users',
          },
          dismissLabel: t.dismissLabel,
        };
      }
    }

    // Priority 3: Unused features (more than 7 days)
    const unusedFeatures = featureUsage.filter(f => f.daysSinceLastUse >= 7);
    
    if (unusedFeatures.length > 0) {
      const feature = unusedFeatures[0];
      
      switch (feature.feature) {
        case 'community':
          return {
            type: 'community',
            title: t.communityTitle,
            message: t.communityMessage,
            mascotMood: 'waving',
            primaryAction: {
              label: t.goToCommunity,
              path: '/community',
              icon: 'users',
            },
            dismissLabel: t.dismissLabel,
          };
        
        case 'ai_chat':
          return {
            type: 'ai_chat',
            title: t.aiChatTitle,
            message: t.aiChatMessage,
            mascotMood: 'thinking',
            primaryAction: {
              label: t.openClickAI,
              path: '/ai-chat',
              icon: 'bot',
            },
            dismissLabel: t.dismissLabel,
          };
        
        case 'speech_tutor':
          return {
            type: 'speech_tutor',
            title: t.speechTutorTitle,
            message: t.speechTutorMessage,
            mascotMood: 'excited',
            primaryAction: {
              label: t.openSpeechTutor,
              path: '/dashboard?open_speech_tutor=true',
              icon: 'mic',
            },
            dismissLabel: t.dismissLabel,
          };
        
        case 'achievements':
          return {
            type: 'achievements',
            title: t.achievementsTitle,
            message: t.achievementsMessage,
            mascotMood: 'excited',
            primaryAction: {
              label: t.viewAchievements,
              path: '/achievements',
              icon: 'trophy',
            },
            dismissLabel: t.dismissLabel,
          };
      }
    }

    // Priority 4: Default - Click of the Week or Continue studying
    if (clickStatus.hasLives) {
      return {
        type: 'click_of_week',
        title: t.welcomeBackTitle,
        message: t.welcomeBackMessage,
        mascotMood: 'waving',
        primaryAction: {
          label: t.playClickOfWeek,
          path: '/click-of-the-week',
          icon: 'gamepad',
        },
        secondaryAction: {
          label: t.goToCourses,
          path: '/courses',
          icon: 'book',
        },
        dismissLabel: t.dismissLabel,
      };
    }

    // Fallback
    if (lastLesson) {
      return {
        type: 'continue_lesson',
        title: t.continueLessonTitle,
        message: t.continueJourneyMessage(lastLesson.courseName),
        mascotMood: 'happy',
        primaryAction: {
          label: t.continueCourse,
          path: `/course/${lastLesson.courseId}`,
          icon: 'book',
        },
        dismissLabel: t.dismissLabel,
      };
    }

    return null;
  }, [user, userLanguage, getLastAction, getLastLesson, getClickOfWeekStatus, getFeatureUsage]);

  useEffect(() => {
    if (!user) {
      setSuggestion(null);
      setLoading(false);
      return;
    }

    const loadSuggestion = async () => {
      setLoading(true);
      const result = await generateSuggestion();
      setSuggestion(result);
      setLoading(false);
    };

    loadSuggestion();
  }, [user, generateSuggestion]);

  return { suggestion, loading, refreshSuggestion: generateSuggestion };
}
