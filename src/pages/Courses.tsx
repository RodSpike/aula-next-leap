import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, GraduationCap, Trophy, Lock, CheckCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  order_index: number;
  isUnlocked: boolean;
  lessonsCount: number;
  completedLessons: number;
  isCurrentLevel: boolean;
  admin_only?: boolean;
  course_type?: string;
}

const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const getLevelIcon = (level: string) => {
  const icons: { [key: string]: any } = {
    'A1': BookOpen,
    'A2': BookOpen, 
    'B1': GraduationCap,
    'B2': GraduationCap,
    'C1': Trophy,
    'C2': Trophy,
  };
  return icons[level] || BookOpen;
};

export default function Courses() {
  usePageMeta({
    title: 'Cursos de Inglês Online - Aula Click | Níveis A1 a C2',
    description: 'Explore nossos cursos de inglês do nível A1 ao C2. Aprenda com lições estruturadas, exercícios práticos e acompanhe seu progresso.',
    keywords: 'cursos de inglês, inglês A1, inglês A2, inglês B1, inglês B2, inglês C1, inglês C2, aprender inglês online',
    canonicalPath: '/courses',
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Check if user is admin
      let isUserAdmin = false;
      if (user) {
        const { data: adminCheck } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        isUserAdmin = adminCheck === true;
      }

      // Fetch all courses from database
      let query = supabase
        .from('courses')
        .select('*')
        .order('level')
        .order('order_index');

      // Filter out admin-only courses for non-admins
      if (!isUserAdmin) {
        query = query.or('admin_only.is.null,admin_only.eq.false');
      }

      const { data: allCoursesData, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      // Separate courses by type
      const enemCourses = allCoursesData?.filter(c => c.course_type === 'enem') || [];
      const customCourses = allCoursesData?.filter(c => c.course_type === 'custom' || (c.course_type !== 'enem' && !levelOrder.includes(c.level))) || [];
      const levelCoursesData = allCoursesData?.filter(c => c.course_type !== 'enem' && c.course_type !== 'custom' && levelOrder.includes(c.level)) || [];

      // Group level courses by level and pick the first course for each level
      const coursesByLevel: { [key: string]: any } = {};
      levelCoursesData?.forEach(course => {
        if (!coursesByLevel[course.level]) {
          coursesByLevel[course.level] = course;
        }
      });

      // Create level courses array
      const levelCourses = levelOrder.map(level => {
        const firstCourse = coursesByLevel[level];
        return {
          id: firstCourse?.id || level,
          title: `${level} - English Course`,
          description: `Complete ${level} level English course with comprehensive lessons and exercises`,
          level: level,
          order_index: levelOrder.indexOf(level),
          isUnlocked: false,
          lessonsCount: 0,
          completedLessons: 0,
          isCurrentLevel: false,
          admin_only: false,
          course_type: 'english',
        };
      });

      // Add ENEM courses for all users (now visible to everyone)
      const enemCoursesFormatted = enemCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        level: course.level,
        order_index: course.order_index,
        isUnlocked: true,
        lessonsCount: 0,
        completedLessons: 0,
        isCurrentLevel: false,
        admin_only: course.admin_only || false,
        course_type: course.course_type || 'enem',
      }));

      // Add custom courses (created via DynamicCourseGenerator)
      const customCoursesFormatted = customCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        level: course.level,
        order_index: course.order_index,
        isUnlocked: true,
        lessonsCount: 0,
        completedLessons: 0,
        isCurrentLevel: false,
        admin_only: course.admin_only || false,
        course_type: course.course_type || 'custom',
      }));

      // Get user's current level and progress if logged in
      let userLevel = 'A1';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('cambridge_level')
          .eq('user_id', user.id)
          .single();

        if (profile?.cambridge_level) {
          userLevel = profile.cambridge_level;
        }

        // Count total lessons per level
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id, course_id, courses!inner(level)');

        // Count completed lessons per level
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, completed, lessons!inner(course_id, courses!inner(level))')
          .eq('user_id', user.id)
          .eq('completed', true);

        // Aggregate by level
        const levelStats: { [key: string]: { total: number; completed: number } } = {};
        
        lessonsData?.forEach((lesson: any) => {
          const level = lesson.courses.level;
          if (!levelStats[level]) levelStats[level] = { total: 0, completed: 0 };
          levelStats[level].total++;
        });

        progressData?.forEach((progress: any) => {
          const level = progress.lessons.courses.level;
          if (levelStats[level]) {
            levelStats[level].completed++;
          }
        });

        // Update level courses with stats
        levelCourses.forEach((course) => {
          const stats = levelStats[course.level] || { total: 0, completed: 0 };
          course.lessonsCount = stats.total;
          course.completedLessons = stats.completed;
          
          const userLevelIndex = levelOrder.indexOf(userLevel);
          const courseLevelIndex = levelOrder.indexOf(course.level);
          
          // Admins have all courses unlocked
          course.isUnlocked = isUserAdmin || courseLevelIndex <= userLevelIndex;
          course.isCurrentLevel = course.level === userLevel;
        });
      } else {
        // For non-logged in users, only show A1 as unlocked
        levelCourses[0].isUnlocked = true;
      }

      // Combine level courses with ENEM and custom courses
      const allCourses = [...levelCourses, ...enemCoursesFormatted, ...customCoursesFormatted];

      setCourses(allCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Breadcrumb />
          <PageSkeleton variant="cards" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb />
        </div>

        {/* Header */}
        <section className="bg-gradient-subtle py-20" aria-label="Cabeçalho dos cursos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Cursos de Inglês Online
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Progrida através dos cursos estruturados de inglês do A1 ao C2. 
              Complete avaliações para desbloquear novos níveis.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Buscar cursos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar cursos"
              />
            </div>
          </header>
        </div>
      </section>

      {/* Level Filters */}
      <nav className="py-8 border-b border-border" aria-label="Filtros de nível">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3" role="group" aria-label="Filtrar por nível">
            <Button
              variant={selectedLevel === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel("All")}
              className="flex items-center space-x-2"
              aria-pressed={selectedLevel === "All"}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Todos os Níveis</span>
            </Button>
            {levelOrder.map((level) => {
              const Icon = getLevelIcon(level);
              return (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className="flex items-center space-x-2"
                  aria-pressed={selectedLevel === level}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{level}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Courses Grid */}
      <section className="py-12" aria-label="Lista de cursos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
            </h2>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {selectedLevel}
              </Badge>
            </div>
          </div>
          
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <article key={course.id}>
                  <CourseCard course={course} />
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground">
                Tente ajustar sua busca ou filtros para encontrar cursos.
              </p>
            </div>
          )}
        </div>
      </section>
      </div>
    </AppLayout>
  );
}