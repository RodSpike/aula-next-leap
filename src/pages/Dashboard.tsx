import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Play, Target, Users, Trophy, 
  MessageCircle, Zap, ChevronRight, Gamepad2,
  Mic, Clock, Award, TrendingUp
} from "lucide-react";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { DashboardVideoWidget } from "@/components/DashboardVideoWidget";
import DashboardWinner from "@/components/click-of-week/DashboardWinner";
import CurrentWeekLeaderboard from "@/components/click-of-week/CurrentWeekLeaderboard";
import { DashboardMascot } from "@/components/dashboard/DashboardMascot";
import { SpeechTutorDialog } from "@/components/speech-tutor/SpeechTutorDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";

interface CourseProgress {
  id: string;
  name: string;
  totalLessons: number;
  completedLessons: number;
  level: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { gamificationData, achievements } = useGamification();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [speechTutorOpen, setSpeechTutorOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData();
    }
  }, [user, loading]);

  useEffect(() => {
    // Get recent unlocked achievements
    const unlocked = achievements
      .filter(a => a.unlocked_at)
      .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
      .slice(0, 3);
    setRecentAchievements(unlocked);
  }, [achievements]);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      setUserProfile(profile);
      
      if (profile?.cambridge_level) {
        const { data: levelCourses } = await supabase
          .from('courses')
          .select('*')
          .eq('level', profile.cambridge_level)
          .order('order_index');
        
        if (levelCourses) {
          const uniqueCourses = levelCourses.filter((course, index, self) => 
            index === self.findIndex(c => c.title === course.title && c.level === course.level)
          );

          const { data: userProgress } = await supabase
            .from('user_lesson_progress')
            .select('*, lessons!inner(course_id)')
            .eq('user_id', user!.id);

          const { data: courseLessons } = await supabase
            .from('lessons')
            .select('course_id, id')
            .in('course_id', uniqueCourses.map(c => c.id));

          const coursesData = uniqueCourses.map(course => {
            const lessonsForCourse = courseLessons?.filter(l => l.course_id === course.id) || [];
            const progressForCourse = userProgress?.filter(p => 
              lessonsForCourse.some(l => l.id === p.lesson_id)
            ) || [];
            const completedLessons = progressForCourse.filter(p => p.completed).length;

            return {
              id: course.id,
              name: course.title,
              totalLessons: lessonsForCourse.length,
              completedLessons,
              level: course.level
            };
          });
          
          setCourses(coursesData);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    href, 
    color,
    badge
  }: { 
    title: string; 
    description: string; 
    icon: React.ElementType; 
    href: string;
    color: string;
    badge?: string;
  }) => (
    <Link to={href}>
      <Card className="group hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 h-full animate-fade-in">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{title}</h3>
                {badge && (
                  <Badge variant="secondary" className="text-xs animate-pulse">{badge}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Olá, {userProfile?.display_name?.split(' ')[0] || 'Estudante'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue sua jornada de aprendizado
            </p>
          </div>
          {gamificationData && (
            <div className="flex items-center gap-4 bg-card p-3 rounded-xl border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">{gamificationData.total_xp} XP</p>
                  <p className="text-xs text-muted-foreground">Nível {gamificationData.current_level}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mascot with contextual message */}
        <DashboardMascot
          userName={userProfile?.display_name}
          level={gamificationData?.current_level}
          totalXp={gamificationData?.total_xp}
          hasCompletedPlacementTest={!!userProfile?.cambridge_level}
          coursesCount={courses.length}
          recentAchievementsCount={recentAchievements.length}
        />

        {/* Placement Test CTA */}
        {!userProfile?.cambridge_level && !statsLoading && (
          <Card className="border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Descubra seu nível de inglês
                  </h3>
                  <p className="text-muted-foreground">
                    Faça o teste de nivelamento Cambridge e desbloqueie cursos personalizados.
                  </p>
                </div>
                <Button onClick={() => navigate('/placement-test')} size="lg" className="shrink-0">
                  Fazer Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Click da Semana"
            description="Desafie seu inglês e suba no ranking semanal"
            icon={Target}
            href="/click-of-the-week"
            color="bg-gradient-to-br from-orange-500 to-red-500"
            badge="🔥 Ativo"
          />
          <QuickActionCard
            title="Comunidade"
            description="Conecte-se com outros estudantes"
            icon={Users}
            href="/community"
            color="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <div onClick={() => setSpeechTutorOpen(true)}>
            <Card className="group hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 h-full animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">AI Speech Tutor</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">Pratique conversação com ClickAI</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <SpeechTutorDialog open={speechTutorOpen} onOpenChange={setSpeechTutorOpen} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Seus Cursos
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/courses">Ver todos</Link>
              </Button>
            </div>
            
            {courses.length > 0 ? (
              <div className="grid gap-3">
                {courses.slice(0, 4).map((course) => {
                  const progress = course.totalLessons > 0 
                    ? (course.completedLessons / course.totalLessons) * 100 
                    : 0;
                  
                    return (
                    <Card key={course.id} className="hover:shadow-lg hover:scale-[1.01] transition-all duration-300 animate-fade-in" style={{ animationDelay: `${courses.indexOf(course) * 100}ms` }}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">{course.name}</h3>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {course.level}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={progress} className="flex-1 h-2 transition-all duration-500" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {course.completedLessons}/{course.totalLessons}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" asChild className="transition-transform duration-300 hover:scale-110">
                            <Link to={`/course/${course.id}`}>
                              <Play className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {userProfile?.cambridge_level 
                      ? 'Nenhum curso encontrado para seu nível.'
                      : 'Faça o teste de nivelamento para desbloquear cursos.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Conquistas Recentes
                  </h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/achievements">Ver todas</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {recentAchievements.map((ach) => (
                    <Card key={ach.id} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                      <CardContent className="p-4 text-center">
                        <span className="text-3xl mb-2 block">{ach.achievements.icon}</span>
                        <p className="font-medium text-sm">{ach.achievements.name}</p>
                        <p className="text-xs text-muted-foreground">+{ach.achievements.xp_reward} XP</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            <DashboardWinner />
            <DashboardVideoWidget />
            <CurrentWeekLeaderboard />
            <NotificationsPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
