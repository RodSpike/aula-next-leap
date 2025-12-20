
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LessonContent } from "@/components/LessonContent";
import { ExerciseActivity } from "@/components/ExerciseActivity";
import { LessonAudioPlayer } from "@/components/LessonAudioPlayer";
import { AdvancedLessonAudioPlayer } from "@/components/AdvancedLessonAudioPlayer";
import { CourseTutorChat } from "@/components/CourseTutorChat";
import { BookOpen, Trophy, Clock, ArrowLeft, FileCheck, Award } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  order_index: number;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  audio_url?: string | null;
  audio_segments?: any;
  audio_duration?: number | null;
  audio_generated_at?: string | null;
}

interface Exercise {
  id: string;
  lesson_id: string;
  question: string;
  options: any;
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface LessonContentItem {
  id: string;
  lesson_id: string;
  section_type: string;
  title: string;
  explanation?: string;
  examples?: any;
  content?: any;
  order_index: number;
}

export default function Course() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { addXP, updateAchievement } = useGamification();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [lessonContent, setLessonContent] = useState<LessonContentItem[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: number}>({});
  const [hasCertificate, setHasCertificate] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
      loadProgress();
      checkAdminStatus();
    }
  }, [courseId, user]);

  // Navigate to specific lesson from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#lesson-') && lessons.length > 0) {
      const lessonIndex = parseInt(hash.replace('#lesson-', ''));
      if (!isNaN(lessonIndex) && lessonIndex >= 0 && lessonIndex < lessons.length) {
        setCurrentLessonIndex(lessonIndex);
        setShowIntroduction(true);
      }
    }
  }, [lessons]);

  // Track study time - accurate delta-based tracking
  useEffect(() => {
    if (!user || !courseId) return;

    const lastTickRef = { current: Date.now() };
    const pendingMsRef = { current: 0 };
    const savedRef = { current: false };

    const persistStudyTime = async (deltaHours: number) => {
      if (deltaHours < 0.0001 || savedRef.current) return;
      savedRef.current = true;

      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existing } = await supabase
          .from('study_sessions')
          .select('hours_studied')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('session_date', today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('study_sessions')
            .update({ 
              hours_studied: Number(existing.hours_studied) + deltaHours 
            })
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('session_date', today);
        } else {
          await supabase
            .from('study_sessions')
            .insert({
              user_id: user.id,
              course_id: courseId,
              session_date: today,
              hours_studied: deltaHours
            });
        }
      } catch (error) {
        console.error('Error tracking study session:', error);
      } finally {
        savedRef.current = false;
      }
    };

    const tick = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;
      pendingMsRef.current += deltaMs;

      if (pendingMsRef.current >= 30000) {
        const deltaHours = pendingMsRef.current / 3600000;
        pendingMsRef.current = 0;
        persistStudyTime(deltaHours);
      }
    };

    const flush = () => {
      if (pendingMsRef.current > 0) {
        const deltaHours = pendingMsRef.current / 3600000;
        pendingMsRef.current = 0;
        persistStudyTime(deltaHours);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        tick();
        flush();
      } else {
        lastTickRef.current = Date.now();
      }
    };

    const interval = setInterval(tick, 60000);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      tick();
      flush();
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, courseId]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('user_has_admin_role', { user_uuid: user.id });
      
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const checkCertificateStatus = async (courseTitle: string) => {
    if (!user || !courseTitle) return;
    
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_name', courseTitle)
        .maybeSingle();
      
      if (!error && data) {
        setHasCertificate(true);
      }
    } catch (error) {
      console.error('Error checking certificate status:', error);
    }
  };

  const loadCourseData = async () => {
    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);
      
      // Check certificate status with course title
      checkCertificateStatus(courseData.title);

      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Load exercises and lesson content for all lessons
      if (lessonsData && lessonsData.length > 0) {
        const lessonIds = lessonsData.map(lesson => lesson.id);
        
        // Load exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('order_index');

        if (exercisesError) throw exercisesError;
        setExercises(exercisesData || []);

        // Load lesson content
        const { data: contentData, error: contentError } = await supabase
          .from('lesson_content')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('order_index');

        if (contentError) throw contentError;
        setLessonContent(contentData || []);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!user || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Build lesson progress map
      const progressMap: {[key: string]: number} = {};
      data?.forEach(p => {
        progressMap[p.lesson_id] = p.score || 0;
      });
      setLessonProgress(progressMap);

      const completedLessons = data?.filter(p => p.completed).length || 0;
      const totalLessons = lessons.length;
      const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      setProgress(progressPercent);

      // Only set initial lesson on first load (when currentLessonIndex is 0 and no hash in URL)
      // This prevents automatic navigation after completing exercises
      if (lessons.length > 0 && currentLessonIndex === 0 && !window.location.hash) {
        const firstIncompleteIndex = lessons.findIndex(lesson => {
          const progress = data?.find(p => p.lesson_id === lesson.id);
          return !progress?.completed;
        });
        
        // If all lessons are completed, stay on last lesson; otherwise go to first incomplete
        if (firstIncompleteIndex !== -1) {
          setCurrentLessonIndex(firstIncompleteIndex);
        } else if (completedLessons === totalLessons && totalLessons > 0) {
          setCurrentLessonIndex(lessons.length - 1);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleLessonComplete = async (lessonId: string, score: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          score: score,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      toast({
        title: "Lição Completa!",
        description: `Você acertou ${score}%. Ótimo trabalho!`,
      });

      // Gamification: Award XP and achievements
      const xpAmount = score >= 90 ? 50 : score >= 70 ? 30 : 15;
      await addXP(xpAmount, 'lesson_completed', `Completed lesson with ${score}% score`);
      await updateAchievement('first_lesson');
      await updateAchievement('dedicated_learner');
      await updateAchievement('scholar');
      await updateAchievement('master_learner');

      // Reload progress to update stats
      await loadProgress();

      // Check if this is the last lesson and course is complete with passing grade
      await checkCourseCompletion(score);
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar progresso",
        variant: "destructive",
      });
    }
  };

  const checkCourseCompletion = async (currentLessonScore: number) => {
    if (!user || !courseId || !course) return;

    try {
      // Get all lesson progress for this course
      const lessonIds = lessons.map(l => l.id);
      const { data: progressData, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (progressError) throw progressError;

      // Check if all lessons are completed
      const completedLessons = progressData?.filter(p => p.completed) || [];
      if (completedLessons.length < lessons.length) return;

      // Calculate average score
      const totalScore = completedLessons.reduce((sum, p) => sum + (p.score || 0), 0);
      const averageScore = Math.round(totalScore / completedLessons.length);

      // Check if user passed (70% or higher)
      if (averageScore >= 70) {
        // Check if certificate already exists
        const { data: existingCert } = await supabase
          .from('certificates')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_name', course.title)
          .eq('certificate_type', 'completion')
          .maybeSingle();

        if (!existingCert) {
          // Create certificate
          const { error: certError } = await supabase
            .from('certificates')
            .insert({
              user_id: user.id,
              course_name: course.title,
              certificate_type: 'completion',
              issued_date: new Date().toISOString()
            });

          if (certError) throw certError;

          // Award XP for course completion
          await addXP(100, 'course_completed', `Completed course: ${course.title}`);

          toast({
            title: "🎉 Parabéns! Curso Concluído!",
            description: `Você completou o curso "${course.title}" com ${averageScore}% de aproveitamento. Seu certificado está disponível!`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  };

  const canAccessNextLesson = () => {
    if (isAdmin) return true;
    
    const currentScore = lessonProgress[currentLesson?.id] || 0;
    return currentScore >= 70;
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Required</h3>
              <p className="text-muted-foreground mb-4">
                Please log in to access course content.
              </p>
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading course...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The course you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const currentLessonExercises = exercises.filter(ex => ex.lesson_id === currentLesson?.id);
  const currentLessonContent = lessonContent.filter(content => content.lesson_id === currentLesson?.id);
  const introductionContent = currentLessonContent.filter(content => content.section_type === 'introduction');
  const practiceContent = currentLessonContent.filter(content => content.section_type === 'practice');
  // Helper function to normalize lesson HTML content
  const normalizeLessonHtml = (content: string): string => {
    if (!content) return '';
    
    let cleaned = content.trim();
    
    // Remove markdown code fences if present
    if (cleaned.startsWith('```html') || cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    // Extract content from body tags if present
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      cleaned = bodyMatch[1].trim();
    }
    
    // If still no HTML tags, convert newlines to paragraphs for readability
    if (cleaned && !cleaned.includes('<')) {
      cleaned = cleaned.split('\n\n').map(p => p.trim()).filter(p => p).map(p => `<p>${p}</p>`).join('');
    }
    
    return cleaned.trim();
  };

  const lessonHtml = normalizeLessonHtml(currentLesson?.content || "");

  return (
    <AppLayout>
      {/* Course Header */}
      <section className="bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link to="/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge className="mb-3">{course.level}</Badge>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {course.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{lessons.length} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>{exercises.length} Exercises</span>
                </div>
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Course Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      {/* Custom progress bar like dashboard */}
                      <div className="relative h-5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${progress}%`,
                            background: progress === 100 
                              ? 'linear-gradient(to right, hsl(142, 76%, 36%), hsl(142, 76%, 46%))'
                              : 'linear-gradient(to right, hsl(142, 76%, 36%), hsl(142, 71%, 45%))'
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-foreground drop-shadow-sm">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div>
                        <p>Lesson {currentLessonIndex + 1} of {lessons.length}</p>
                        <p className="font-medium text-foreground mt-1">
                          {currentLesson?.title}
                        </p>
                      </div>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {Object.values(lessonProgress).filter(score => score >= 70).length}/{lessons.length}
                      </span>
                    </div>
                    
                    {/* Certificate button */}
                    {hasCertificate && (
                      <Button asChild className="w-full mt-4 gap-2" variant="secondary">
                        <Link to="/certificates">
                          <Award className="h-4 w-4 text-green-500" />
                          Ver Certificado
                        </Link>
                      </Button>
                    )}
                    
                    {/* Course complete but no certificate yet */}
                    {progress === 100 && !hasCertificate && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
                          Complete todas as atividades com 70% ou mais para receber seu certificado!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Lesson Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentLesson && (
          <div className="space-y-8">
            {/* Lesson Navigation - Top */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-4 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1));
                  setShowIntroduction(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentLessonIndex === 0}
                className="w-full sm:w-auto"
              >
                ← Anterior
              </Button>
              
              <span className="text-sm text-muted-foreground order-first sm:order-none">
                Lição {currentLessonIndex + 1} de {lessons.length}
              </span>
              
              <Button
                size="sm"
                onClick={() => {
                  setCurrentLessonIndex(Math.min(lessons.length - 1, currentLessonIndex + 1));
                  setShowIntroduction(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentLessonIndex === lessons.length - 1 || !canAccessNextLesson()}
                className="w-full sm:w-auto"
              >
                Próxima →
              </Button>
            </div>

            {/* Toggle between Introduction and Activities */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border p-1 bg-muted">
                <Button
                  variant={showIntroduction ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowIntroduction(true)}
                  className="rounded-md px-3"
                >
                  📚 Explicação
                </Button>
                <Button
                  variant={!showIntroduction ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowIntroduction(false)}
                  className="rounded-md px-3"
                >
                  🎯 Atividades
                </Button>
              </div>
            </div>

            {showIntroduction ? (
              // Introduction/Explanation Content
              <div className="space-y-6">
                {/* Audio Player for Lesson */}
                <div className="pb-4">
                  {currentLesson.audio_url === 'browser-tts' && currentLesson.audio_segments && currentLesson.audio_duration ? (
                    <AdvancedLessonAudioPlayer
                      lessonId={currentLesson.id}
                      lessonTitle={currentLesson.title}
                      lessonContent={currentLesson.content}
                      segments={currentLesson.audio_segments}
                      duration={currentLesson.audio_duration}
                    />
                  ) : (
                    <div className="flex justify-center">
                      <LessonAudioPlayer 
                        lessonContent={lessonHtml}
                        lessonTitle={currentLesson?.title || ''}
                      />
                    </div>
                  )}
                </div>
                
                {lessonHtml ? (
                  // Enhanced lesson content with proper educational styling
                  <div className="lesson-container overflow-x-hidden">
                    <article
                      className="prose prose-lg dark:prose-invert max-w-none overflow-hidden break-words"
                      dangerouslySetInnerHTML={{ __html: lessonHtml }}
                    />
                  </div>
                ) : (
                  // Fallback to old content structure if no enhanced HTML
                  <>
                    {introductionContent.length > 0 ? (
                      <LessonContent 
                        content={introductionContent}
                        lessonId={currentLesson.id}
                        lessonTitle={currentLesson.title}
                        lessonContent={currentLesson.content}
                        audioUrl={currentLesson.audio_url}
                        audioSegments={currentLesson.audio_segments}
                        audioDuration={currentLesson.audio_duration}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Conteúdo de explicação será adicionado em breve para esta lição.
                        </p>
                      </div>
                    )}
                    
                    {practiceContent.length > 0 && (
                      <LessonContent 
                        content={practiceContent}
                        lessonId={currentLesson.id}
                        lessonTitle={currentLesson.title}
                        lessonContent={currentLesson.content}
                        audioUrl={currentLesson.audio_url}
                        audioSegments={currentLesson.audio_segments}
                        audioDuration={currentLesson.audio_duration}
                      />
                    )}
                  </>
                )}

                <div className="flex justify-center pt-6">
                  <Button
                    onClick={() => setShowIntroduction(false)}
                    className="px-8"
                  >
                    Começar Atividades →
                  </Button>
                </div>
              </div>
            ) : (
              // Activities/Exercises Content
              <div className="space-y-6">
                {currentLessonExercises.length > 0 ? (
                  <ExerciseActivity
                    key={currentLesson.id}
                    exercises={currentLessonExercises.map(ex => ({
                      ...ex,
                      exercise_type: 'multiple_choice' as const,
                      title: `Exercise ${ex.order_index + 1}`,
                      instructions: 'Choose the correct answer.',
                      points: 10,
                      options: Array.isArray(ex.options) ? ex.options : 
                        typeof ex.options === 'object' && ex.options ? 
                        Object.values(ex.options) : ['Option A', 'Option B', 'Option C']
                    }))}
                    onComplete={(score, totalPoints) => {
                      const percentage = Math.round((score / totalPoints) * 100);
                      handleLessonComplete(currentLesson.id, percentage);
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Exercícios serão adicionados em breve para esta lição.
                    </p>
                  </div>
                )}

                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowIntroduction(true)}
                  >
                    ← Voltar à Explicação
                  </Button>
                </div>
              </div>
            )}
            

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-8 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newIndex = Math.max(0, currentLessonIndex - 1);
                  setCurrentLessonIndex(newIndex);
                  setShowIntroduction(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentLessonIndex === 0}
                className="w-full sm:w-auto"
              >
                ← Anterior
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  const newIndex = Math.min(lessons.length - 1, currentLessonIndex + 1);
                  setCurrentLessonIndex(newIndex);
                  setShowIntroduction(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentLessonIndex === lessons.length - 1 || (!isAdmin && !canAccessNextLesson())}
                className="w-full sm:w-auto"
              >
                Próxima →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Course AI Tutor Chat */}
      {course && (
        <CourseTutorChat
          courseId={course.id}
          courseName={course.title}
          courseDescription={course.description}
          currentLessonTitle={currentLesson?.title}
        />
      )}
    </AppLayout>
  );
}
