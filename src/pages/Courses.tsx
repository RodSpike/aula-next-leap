import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, GraduationCap, Trophy, Lock, CheckCircle } from "lucide-react";

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

      // Aggregate courses by level - show ONE course per level (A1-C2)
      const levelCourses = levelOrder.map(level => {
        return {
          id: level, // Use level as ID for routing
          title: `${level} - English Course`,
          description: `Complete ${level} level English course with comprehensive lessons and exercises`,
          level: level,
          order_index: levelOrder.indexOf(level),
          isUnlocked: false,
          lessonsCount: 0,
          completedLessons: 0,
          isCurrentLevel: false,
        };
      });

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

      setCourses(levelCourses);
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-subtle py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              English Learning Levels
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Progress through structured English courses from A1 to C2. 
              Complete assessments to unlock new levels.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Level Filters */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedLevel === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel("All")}
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>All Levels</span>
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
                >
                  <Icon className="h-4 w-4" />
                  <span>{level}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
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
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No courses found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find courses.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}