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

const FEATURE_PAGES: Record<string, string[]> = {
  'community': ['/community'],
  'ai_chat': ['/ai-chat'],
  'speech_tutor': ['/dashboard'], // Speech tutor opens as dialog
  'achievements': ['/achievements'],
  'friends': ['/friends'],
  'messages': ['/messages'],
  'click_of_week': ['/click-of-the-week'],
  'courses': ['/courses', '/course/'],
};

export function useWelcomeBack() {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<WelcomeBackSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  const getLastLesson = useCallback(async (): Promise<LastLesson | null> => {
    if (!user) return null;

    try {
      // Get most recent lesson page view
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('context, created_at')
        .eq('user_id', user.id)
        .eq('action', 'page_view')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!activityLogs) return null;

      // Find last course page
      const lessonActivity = activityLogs.find(log => {
        const context = log.context as any;
        return context?.page?.includes('/course/');
      });

      if (!lessonActivity) return null;

      const context = lessonActivity.context as any;
      const courseIdMatch = context?.page?.match(/\/course\/([^\/]+)/);
      
      if (!courseIdMatch) return null;

      const courseId = courseIdMatch[1];

      // Get course and lesson info
      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .maybeSingle();

      if (!course) return null;

      // Get latest lesson progress for this course
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

      // Fallback: get first lesson of the course
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
        // No attempts yet - user can play
        return { hasLives: true, livesRemaining: 3, nextAttemptAt: null, timeUntilNextAttempt: null };
      }

      // If completed, check if there's a new challenge
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
          // Time has passed, can play again
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
        title: 'Bem-vindo de volta! 📚',
        message: `Você estava estudando "${lastLesson.lessonTitle}" no curso "${lastLesson.courseName}". Quer continuar?`,
        mascotMood: 'waving',
        primaryAction: {
          label: '📚 Continuar Lição',
          path: `/course/${lastLesson.courseId}`,
          icon: 'book',
        },
        secondaryAction: {
          label: '📝 Fazer Atividades',
          path: `/course/${lastLesson.courseId}?tab=exercises`,
          icon: 'pencil',
        },
        tertiaryAction: {
          label: '🤖 Tirar Dúvidas com ClickAI',
          path: '/ai-chat',
          icon: 'bot',
        },
        metadata: { lesson: lastLesson },
      };
    }

    // Priority 2: Was playing Click of the Week
    if (lastAction === '/click-of-the-week') {
      if (clickStatus.hasLives) {
        return {
          type: 'click_of_week',
          title: 'Pronto para o desafio? 🎮',
          message: `Você tem ${clickStatus.livesRemaining} vida(s) para jogar Click of the Week e mostrar seus conhecimentos!`,
          mascotMood: 'excited',
          primaryAction: {
            label: '🎮 Jogar Agora',
            path: '/click-of-the-week',
            icon: 'gamepad',
          },
          secondaryAction: {
            label: '🏆 Ver Leaderboard',
            path: '/click-of-the-week?tab=leaderboard',
            icon: 'trophy',
          },
        };
      } else {
        return {
          type: 'click_of_week_waiting',
          title: 'Aguardando nova tentativa ⏳',
          message: `Ainda falta ${clickStatus.timeUntilNextAttempt || 'um tempo'} para jogar novamente. Que tal continuar estudando?`,
          mascotMood: 'thinking',
          primaryAction: {
            label: '📚 Ir para Cursos',
            path: '/courses',
            icon: 'book',
          },
          secondaryAction: {
            label: '💬 Ir para Comunidade',
            path: '/community',
            icon: 'users',
          },
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
            title: 'Saudades da comunidade! 👋',
            message: 'Faz um tempo que você não visita a comunidade! Lá você pode fazer amigos e ver conteúdos exclusivos.',
            mascotMood: 'waving',
            primaryAction: {
              label: '💬 Ir para Comunidade',
              path: '/community',
              icon: 'users',
            },
          };
        
        case 'ai_chat':
          return {
            type: 'ai_chat',
            title: 'Precisa de ajuda? 🤖',
            message: 'Já experimentou conversar com o ClickAI? Ele pode te ajudar com gramática, vocabulário e tirar suas dúvidas!',
            mascotMood: 'thinking',
            primaryAction: {
              label: '🤖 Abrir ClickAI',
              path: '/ai-chat',
              icon: 'bot',
            },
          };
        
        case 'speech_tutor':
          return {
            type: 'speech_tutor',
            title: 'Pratique sua pronúncia! 🎤',
            message: 'Que tal praticar conversação em inglês com nosso AI Speech Tutor? É uma ótima forma de melhorar sua fluência!',
            mascotMood: 'excited',
            primaryAction: {
              label: '🎤 Abrir Speech Tutor',
              path: '/dashboard?open_speech_tutor=true',
              icon: 'mic',
            },
          };
        
        case 'achievements':
          return {
            type: 'achievements',
            title: 'Conquistas te esperam! 🏆',
            message: 'Você tem conquistas para desbloquear! Continue estudando e ganhe XP extra.',
            mascotMood: 'excited',
            primaryAction: {
              label: '🏆 Ver Conquistas',
              path: '/achievements',
              icon: 'trophy',
            },
          };
      }
    }

    // Priority 4: Default - Click of the Week or Continue studying
    if (clickStatus.hasLives) {
      return {
        type: 'click_of_week',
        title: 'Que bom ter você de volta! 🎉',
        message: 'Você tem vidas disponíveis no Click of the Week! Que tal testar seus conhecimentos?',
        mascotMood: 'waving',
        primaryAction: {
          label: '🎮 Jogar Click of the Week',
          path: '/click-of-the-week',
          icon: 'gamepad',
        },
        secondaryAction: {
          label: '📚 Ir para Cursos',
          path: '/courses',
          icon: 'book',
        },
      };
    }

    // Fallback
    if (lastLesson) {
      return {
        type: 'continue_lesson',
        title: 'Bem-vindo de volta! 📚',
        message: `Continue sua jornada de aprendizado! Você estava estudando "${lastLesson.courseName}".`,
        mascotMood: 'happy',
        primaryAction: {
          label: '📚 Continuar Curso',
          path: `/course/${lastLesson.courseId}`,
          icon: 'book',
        },
      };
    }

    return null;
  }, [user, getLastAction, getLastLesson, getClickOfWeekStatus, getFeatureUsage]);

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
