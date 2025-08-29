
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LessonContent } from "@/components/LessonContent";
import { ExerciseActivity } from "@/components/ExerciseActivity";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Award,
  Play,
  Users,
  Target
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  total_lessons: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  estimated_duration: number;
}

interface LessonContentItem {
  id: string;
  lesson_id: string;
  section_type: 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking' | 'writing';
  title: string;
  explanation: string;
  examples: any[];
  order_index: number;
}

interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'true_false' | 'reading_comprehension';
  title: string;
  instructions: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

export default function Course() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContentItem[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Set first lesson as current if available
      if (lessonsData && lessonsData.length > 0) {
        setCurrentLesson(lessonsData[0]);
        await fetchLessonData(lessonsData[0].id);
      }

      // Fetch user progress if logged in
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonsData?.map(l => l.id) || []);

        if (!progressError) {
          setUserProgress(progressData || []);
        }
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do curso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonData = async (lessonId: string) => {
    try {
      // Fetch lesson content
      const { data: contentData, error: contentError } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (contentError) {
        console.error('Error fetching lesson content:', contentError);
        setLessonContent([]);
      } else {
        setLessonContent(contentData || []);
      }

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
        setExercises([]);
      } else {
        setExercises(exercisesData || []);
      }

    } catch (error) {
      console.error('Error fetching lesson data:', error);
    }
  };

  const selectLesson = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    await fetchLessonData(lesson.id);
  };

  const markLessonComplete = async () => {
    if (!user || !currentLesson) return;

    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          completed: true,
          score: 100,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Parabéns!",
        description: "Lição completada com sucesso!",
      });

      // Refresh progress
      fetchCourseData();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar lição como completa.",
        variant: "destructive",
      });
    }
  };

  const handleExerciseComplete = async (score: number, totalPoints: number) => {
    if (!user || !currentLesson) return;

    const percentage = Math.round((score / totalPoints) * 100);

    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          completed: percentage >= 70,
          score: percentage,
          completed_at: percentage >= 70 ? new Date().toISOString() : null
        });

      if (error) throw error;

      if (percentage >= 70) {
        toast({
          title: "Parabéns!",
          description: `Lição completada com ${percentage}% de aproveitamento!`,
        });
      } else {
        toast({
          title: "Continue praticando",
          description: `Você obteve ${percentage}%. Tente novamente para melhorar!`,
          variant: "secondary",
        });
      }

      // Refresh progress
      fetchCourseData();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const getLessonProgress = (lessonId: string) => {
    return userProgress.find(p => p.lesson_id === lessonId);
  };

  const completedLessons = userProgress.filter(p => p.completed).length;
  const overallProgress = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando curso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card>
            <CardContent className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">Curso não encontrado</h3>
              <Button onClick={() => navigate('/courses')}>
                Voltar aos cursos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/courses')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Button>
          
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                <p className="text-muted-foreground mb-4">{course.description}</p>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {course.level}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.round(overallProgress)}%</div>
                <div className="text-sm text-muted-foreground">Progresso</div>
              </div>
            </div>
            
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{completedLessons} de {lessons.length} lições completas</span>
              <span>{lessons.length} lições totais</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Lesson List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Lições ({lessons.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {lessons.map((lesson) => {
                    const progress = getLessonProgress(lesson.id);
                    const isCompleted = progress?.completed;
                    const isActive = currentLesson?.id === lesson.id;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${
                          isActive ? 'bg-primary/10 border-r-4 border-r-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{lesson.title}</span>
                              {isCompleted && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {lesson.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {lesson.estimated_duration} min
                              </span>
                              {progress && (
                                <Badge variant="secondary" className="text-xs">
                                  {progress.score}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Play className="h-6 w-6 text-primary" />
                        <div>
                          <h2 className="text-xl">{currentLesson.title}</h2>
                          <p className="text-sm text-muted-foreground font-normal">
                            {currentLesson.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {currentLesson.estimated_duration} min
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="exercises" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Exercícios ({exercises.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-6">
                    <LessonContent content={lessonContent} />
                    
                    {lessonContent.length === 0 && (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Conteúdo em desenvolvimento</h3>
                          <p className="text-muted-foreground mb-4">
                            O conteúdo detalhado para esta lição está sendo preparado.
                          </p>
                          <div className="bg-muted/50 p-4 rounded-lg text-left space-y-3">
                            <h4 className="font-medium">Enquanto isso, aqui estão algumas dicas de estudo:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                              <li>Pratique vocabulário relacionado ao tema da lição</li>
                              <li>Revise estruturas gramaticais básicas</li>
                              <li>Leia textos simples em inglês</li>
                              <li>Pratique pronúncia com aplicativos de áudio</li>
                            </ul>
                          </div>
                          {user && (
                            <Button onClick={markLessonComplete} className="mt-4">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Completa
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="exercises" className="space-y-6">
                    {exercises.length > 0 ? (
                      <ExerciseActivity 
                        exercises={exercises} 
                        onComplete={handleExerciseComplete}
                      />
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Exercícios em desenvolvimento</h3>
                          <p className="text-muted-foreground mb-4">
                            Os exercícios para esta lição estão sendo preparados.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Revise o conteúdo da lição enquanto preparamos atividades interativas para você praticar.
                          </p>
                          {user && (
                            <Button onClick={markLessonComplete} className="mt-4" variant="outline">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Completa
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Selecione uma lição</h3>
                  <p className="text-muted-foreground">
                    Escolha uma lição na lista ao lado para começar a estudar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
