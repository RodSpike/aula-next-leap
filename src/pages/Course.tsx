
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LessonContent } from "@/components/LessonContent";
import { ExerciseActivity } from "@/components/ExerciseActivity";
import { BookOpen, Trophy, Clock, ArrowLeft } from "lucide-react";

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

export default function Course() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
      loadProgress();
    }
  }, [courseId, user]);

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

      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Load exercises for all lessons
      if (lessonsData && lessonsData.length > 0) {
        const lessonIds = lessonsData.map(lesson => lesson.id);
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('order_index');

        if (exercisesError) throw exercisesError;
        setExercises(exercisesData || []);
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

      const completedLessons = data?.filter(p => p.completed).length || 0;
      const totalLessons = lessons.length;
      const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      setProgress(progressPercent);
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
        });

      if (error) throw error;

      toast({
        title: "Lesson Complete!",
        description: `You scored ${score}%. Great job!`,
      });

      loadProgress();
      
      // Move to next lesson
      if (currentLessonIndex < lessons.length - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading course...</p>
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
      </div>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const currentLessonExercises = exercises.filter(ex => ex.lesson_id === currentLesson?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
                      <Progress value={progress} />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Lesson {currentLessonIndex + 1} of {lessons.length}</p>
                      <p className="font-medium text-foreground mt-1">
                        {currentLesson?.title}
                      </p>
                    </div>
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
            <LessonContent
              lesson={currentLesson}
              onComplete={() => {
                if (currentLessonExercises.length === 0) {
                  handleLessonComplete(currentLesson.id, 100);
                }
              }}
            />
            
            {currentLessonExercises.length > 0 && (
              <ExerciseActivity
                exercises={currentLessonExercises}
                onComplete={(score) => handleLessonComplete(currentLesson.id, score)}
              />
            )}
            
            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
                disabled={currentLessonIndex === 0}
              >
                Previous Lesson
              </Button>
              
              <Button
                onClick={() => setCurrentLessonIndex(Math.min(lessons.length - 1, currentLessonIndex + 1))}
                disabled={currentLessonIndex === lessons.length - 1}
              >
                Next Lesson
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
