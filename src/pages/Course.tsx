import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, CheckCircle, Clock, Trophy, ArrowRight, ArrowLeft } from "lucide-react";

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
  options: string[];
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface ExerciseFromDB {
  id: string;
  lesson_id: string;
  question: string;
  options: any;
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface UserProgress {
  lesson_id: string;
  completed: boolean;
  score: number;
}

export default function Course() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
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
      setLessons(lessonsData);

      // Fetch user progress
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;
        setUserProgress(progressData || []);

        // Set current lesson (first incomplete lesson or first lesson)
        const incompleteLesson = lessonsData.find(lesson => 
          !progressData?.some(p => p.lesson_id === lesson.id && p.completed)
        );
        setCurrentLesson(incompleteLesson || lessonsData[0]);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async (lessonId: string) => {
    try {
      const { data: exercisesData, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (error) throw error;
      
      // Transform the data to match our Exercise interface
      const transformedExercises: Exercise[] = (exercisesData || []).map((exercise: ExerciseFromDB) => ({
        ...exercise,
        options: Array.isArray(exercise.options) ? exercise.options : JSON.parse(exercise.options as string)
      }));
      
      setExercises(transformedExercises);
      setSelectedAnswers(new Array(transformedExercises.length).fill(''));
      setCurrentExerciseIndex(0);
      setShowResults(false);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load exercises.",
        variant: "destructive",
      });
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setLessonCompleted(false);
    fetchExercises(lesson.id);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentExerciseIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      handleSubmitExercises();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleSubmitExercises = async () => {
    if (!currentLesson || !user) return;

    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === exercises[index]?.correct_answer ? 1 : 0);
    }, 0);

    const percentage = (score / exercises.length) * 100;
    const passed = percentage >= 70;

    try {
      // Update user progress
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          completed: passed,
          score: percentage,
          completed_at: passed ? new Date().toISOString() : null,
        });

      if (error) throw error;

      setShowResults(true);
      setLessonCompleted(passed);

      if (passed) {
        toast({
          title: "Congratulations!",
          description: `You passed with ${percentage.toFixed(1)}%! You can now move to the next lesson.`,
        });
      } else {
        toast({
          title: "Keep trying!",
          description: `You scored ${percentage.toFixed(1)}%. You need at least 70% to advance.`,
          variant: "destructive",
        });
      }

      // Refresh progress
      fetchCourseData();
    } catch (error) {
      console.error('Error submitting exercises:', error);
      toast({
        title: "Error",
        description: "Failed to submit exercises.",
        variant: "destructive",
      });
    }
  };

  const handleRetryExercises = () => {
    setSelectedAnswers(new Array(exercises.length).fill(''));
    setCurrentExerciseIndex(0);
    setShowResults(false);
    setLessonCompleted(false);
  };

  const isLessonCompleted = (lessonId: string) => {
    return userProgress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const isLessonUnlocked = (lesson: Lesson) => {
    const previousLessons = lessons.filter(l => l.order_index < lesson.order_index);
    return previousLessons.every(l => isLessonCompleted(l.id));
  };

  const getOverallProgress = () => {
    const completedLessons = lessons.filter(l => isLessonCompleted(l.id)).length;
    return lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course not found</h1>
            <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Lessons List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.title}</span>
                </CardTitle>
                <div className="space-y-2">
                  <Progress value={getOverallProgress()} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {lessons.filter(l => isLessonCompleted(l.id)).length} of {lessons.length} lessons completed
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.map((lesson) => (
                  <Button
                    key={lesson.id}
                    variant={currentLesson?.id === lesson.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleLessonSelect(lesson)}
                    disabled={!isLessonUnlocked(lesson)}
                  >
                    <div className="flex items-center space-x-2">
                      {isLessonCompleted(lesson.id) ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : isLessonUnlocked(lesson) ? (
                        <div className="h-4 w-4 rounded-full border-2 border-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-muted" />
                      )}
                      <span className="text-sm truncate">{lesson.title}</span>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentLesson && (
              <div className="space-y-6">
                {/* Lesson Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{currentLesson.title}</CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {course.level}
                        </Badge>
                      </div>
                      {isLessonCompleted(currentLesson.id) && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Trophy className="h-5 w-5" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none space-y-4">
                      {currentLesson.content.split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                          <p key={index} className="text-foreground leading-relaxed">
                            {paragraph}
                          </p>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Exercises Section */}
                {exercises.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Practice Exercises</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Complete the exercises with at least 70% to unlock the next lesson.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {!showResults ? (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Question {currentExerciseIndex + 1} of {exercises.length}
                            </span>
                            <Progress 
                              value={((currentExerciseIndex + 1) / exercises.length) * 100} 
                              className="w-32"
                            />
                          </div>

                          {exercises[currentExerciseIndex] && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium">
                                {exercises[currentExerciseIndex].question}
                              </h3>

                              <RadioGroup
                                value={selectedAnswers[currentExerciseIndex]}
                                onValueChange={handleAnswerSelect}
                              >
                                {exercises[currentExerciseIndex].options.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`option-${index}`} />
                                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>

                              <div className="flex justify-between">
                                <Button
                                  variant="outline"
                                  onClick={handlePreviousExercise}
                                  disabled={currentExerciseIndex === 0}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-2" />
                                  Previous
                                </Button>
                                <Button
                                  onClick={handleNextExercise}
                                  disabled={!selectedAnswers[currentExerciseIndex]}
                                >
                                  {currentExerciseIndex === exercises.length - 1 ? 'Submit' : 'Next'}
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className={`text-6xl mb-4 ${lessonCompleted ? 'text-green-600' : 'text-red-600'}`}>
                              {lessonCompleted ? '🎉' : '📚'}
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                              {lessonCompleted ? 'Congratulations!' : 'Keep Learning!'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              You scored {((selectedAnswers.reduce((acc, answer, index) => 
                                acc + (answer === exercises[index]?.correct_answer ? 1 : 0), 0
                              ) / exercises.length) * 100).toFixed(1)}%
                            </p>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium">Review:</h4>
                            {exercises.map((exercise, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <p className="font-medium mb-2">{exercise.question}</p>
                                <div className="space-y-1">
                                  <p className={`text-sm ${
                                    selectedAnswers[index] === exercise.correct_answer 
                                      ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    Your answer: {selectedAnswers[index]}
                                  </p>
                                  {selectedAnswers[index] !== exercise.correct_answer && (
                                    <p className="text-sm text-green-600">
                                      Correct answer: {exercise.correct_answer}
                                    </p>
                                  )}
                                  {exercise.explanation && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {exercise.explanation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-center">
                            {!lessonCompleted && (
                              <Button onClick={handleRetryExercises} variant="outline">
                                Try Again
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}