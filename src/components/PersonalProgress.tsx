import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BookOpen, Award, Clock } from "lucide-react";

interface UserProgress {
  level: string;
  courses: Array<{
    id: string;
    name: string;
    totalLessons: number;
    completedLessons: number;
    avgScore: number;
    status: string;
  }>;
  totalCertificates: number;
  hoursStudied: number;
}

interface PersonalProgressProps {
  level?: string;
  className?: string;
}

export function PersonalProgress({ level, className = "" }: PersonalProgressProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user, level]);

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user profile to determine their level
      const { data: profile } = await supabase
        .from('profiles')
        .select('cambridge_level')
        .eq('user_id', user.id)
        .single();

      const userLevel = level || profile?.cambridge_level;
      if (!userLevel) return;

      // Get courses for the level
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('level', userLevel)
        .order('order_index');

      if (!courses) return;

      // Get user progress for all lessons in these courses
      const { data: userProgress } = await supabase
        .from('user_lesson_progress')
        .select(`
          *,
          lessons!inner(course_id)
        `)
        .eq('user_id', user.id);

      // Get all lessons for the courses
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('*')
        .in('course_id', courses.map(c => c.id));

      // Calculate progress for each course
      const coursesWithProgress = courses.map(course => {
        const lessonsForCourse = allLessons?.filter(l => l.course_id === course.id) || [];
        const progressForCourse = userProgress?.filter(p => 
          lessonsForCourse.some(l => l.id === p.lesson_id)
        ) || [];
        const completedLessons = progressForCourse.filter(p => p.completed).length;
        const totalScore = progressForCourse.reduce((sum, p) => sum + (p.score || 0), 0);
        const avgScore = progressForCourse.length > 0 ? totalScore / progressForCourse.length : 0;

        return {
          id: course.id,
          name: course.title,
          totalLessons: lessonsForCourse.length,
          completedLessons,
          avgScore: Math.round(avgScore),
          status: completedLessons === lessonsForCourse.length ? 'completed' : 'active'
        };
      });

      // Get certificates count
      const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Get total study hours
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('hours_studied')
        .eq('user_id', user.id);

      const totalHours = studySessions?.reduce((sum, session) => sum + Number(session.hours_studied), 0) || 0;

      setProgress({
        level: userLevel,
        courses: coursesWithProgress,
        totalCertificates: certificatesCount || 0,
        hoursStudied: Math.round(totalHours * 10) / 10
      });

    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading your progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress || !user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to see your personal progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCourses = progress.courses.filter(c => c.status === 'completed').length;
  const totalLessons = progress.courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const completedLessons = progress.courses.reduce((sum, c) => sum + c.completedLessons, 0);
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Your {progress.level} Level Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{completedCourses}</div>
            <div className="text-xs text-muted-foreground">Courses Done</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{progress.totalCertificates}</div>
            <div className="text-xs text-muted-foreground">Certificates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{progress.hoursStudied}h</div>
            <div className="text-xs text-muted-foreground">Study Time</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Course Progress */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Course Progress:</h4>
          {progress.courses.map((course) => (
            <div key={course.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{course.name}</span>
                {course.status === 'completed' && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">✓</Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs">{course.completedLessons}/{course.totalLessons}</div>
                {course.avgScore > 0 && (
                  <div className="text-xs text-muted-foreground">{course.avgScore}%</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/dashboard')} className="flex-1">
            <Clock className="h-3 w-3 mr-1" />
            Continue Learning
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}