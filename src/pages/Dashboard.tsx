import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, Play, Award, TrendingUp, TrendingDown, RotateCcw, MessageCircle } from "lucide-react";
import { ProfileEditor } from "@/components/ProfileEditor";
import { OngoingChats } from "@/components/OngoingChats";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  activeCourses: number;
  hoursThisWeek: number;
  hoursLastWeek: number;
  groupsCount: number;
  certificatesCount: number;
  joinedGroups: Array<{
    id: string;
    name: string;
    level: string;
    is_default: boolean;
    group_type: string;
  }>;
  courses: Array<{
    id: string;
    name: string;
    description: string;
    totalLessons: number;
    completedLessons: number;
    status: string;
    avgScore?: number;
    level?: string;
  }>;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeCourses: 0,
    hoursThisWeek: 0,
    hoursLastWeek: 0,
    groupsCount: 0,
    certificatesCount: 0,
    joinedGroups: [],
    courses: []
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [hasPlacementTest, setHasPlacementTest] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      fetchDashboardStats();
    }
  }, [user, loading]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // Get user profile to check placement test status
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      setUserProfile(profile);
      setHasPlacementTest(!!profile?.cambridge_level);
      
      // Get courses for user's current level only
      let coursesForUserLevel = [];
      if (profile?.cambridge_level) {
        const { data: levelCourses } = await supabase
          .from('courses')
          .select('*')
          .eq('level', profile.cambridge_level)
          .order('order_index');
        
        if (levelCourses) {
          // Remove any potential duplicates (safety measure)
          const uniqueCourses = levelCourses.filter((course, index, self) => 
            index === self.findIndex(c => c.title === course.title && c.level === course.level)
          );

          // Get user progress for each course
          const { data: userProgress } = await supabase
            .from('user_lesson_progress')
            .select(`
              *,
              lessons!inner(course_id)
            `)
            .eq('user_id', user!.id);

          // Get lessons count for each course
          const { data: courseLessons } = await supabase
            .from('lessons')
            .select('course_id, id')
            .in('course_id', uniqueCourses.map(c => c.id));

          coursesForUserLevel = uniqueCourses.map(course => {
            const lessonsForCourse = courseLessons?.filter(l => l.course_id === course.id) || [];
            const progressForCourse = userProgress?.filter(p => 
              lessonsForCourse.some(l => l.id === p.lesson_id)
            ) || [];
            const completedLessons = progressForCourse.filter(p => p.completed).length;
            const totalScore = progressForCourse.reduce((sum, p) => sum + (p.score || 0), 0);
            const avgScore = progressForCourse.length > 0 ? totalScore / progressForCourse.length : 0;

            return {
              id: course.id,
              name: course.title,
              description: course.description || '',
              totalLessons: lessonsForCourse.length,
              completedLessons,
              status: completedLessons === lessonsForCourse.length ? 'completed' : 'active',
              avgScore: Math.round(avgScore),
              level: course.level
            };
          });
        }
      }

      // Get study hours for this week (last 7 days)
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 6);
      
      const { data: thisWeekSessions } = await supabase
        .from('study_sessions')
        .select('hours_studied')
        .eq('user_id', user!.id)
        .gte('session_date', thisWeekStart.toISOString().split('T')[0]);

      // Get study hours for last week (8-14 days ago)
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 13);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
      
      const { data: lastWeekSessions } = await supabase
        .from('study_sessions')
        .select('hours_studied')
        .eq('user_id', user!.id)
        .gte('session_date', lastWeekStart.toISOString().split('T')[0])
        .lt('session_date', lastWeekEnd.toISOString().split('T')[0]);

      // Get groups count and actual groups data
      const { data: groupMemberships, count: groupsCount } = await supabase
        .from('group_members')
        .select(`
          *,
          community_groups!inner(
            id,
            name,
            level,
            is_default,
            group_type
          )
        `, { count: 'exact' })
        .eq('user_id', user!.id)
        .eq('status', 'accepted');

      // Get certificates count
      const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id);

      const hoursThisWeek = thisWeekSessions?.reduce((sum, session) => sum + Number(session.hours_studied), 0) || 0;
      const hoursLastWeek = lastWeekSessions?.reduce((sum, session) => sum + Number(session.hours_studied), 0) || 0;

      setStats({
        activeCourses: coursesForUserLevel.filter(c => c.status === 'active').length,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        hoursLastWeek: Math.round(hoursLastWeek * 10) / 10,
        groupsCount: groupsCount || 0,
        certificatesCount: certificatesCount || 0,
        joinedGroups: groupMemberships?.map(membership => membership.community_groups) || [],
        courses: coursesForUserLevel
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const getNextLevel = (currentLevel: string): string | null => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{userProfile?.display_name ? `, ${userProfile.display_name}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Continue your learning journey
            </p>
          </div>
        </div>

        {/* Placement Test Call to Action */}
        {!hasPlacementTest && !statsLoading && (
          <Card className="mb-8 border-primary bg-gradient-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Take Your Cambridge Placement Test
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    Discover your English level and unlock the appropriate courses for your skill level.
                  </p>
                  <Button onClick={() => navigate('/placement-test')} className="bg-primary hover:bg-primary/90">
                    Start Placement Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats.activeCourses}
              </div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Studied</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats.hoursThisWeek}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>This week</span>
                {!statsLoading && stats.hoursLastWeek > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    {stats.hoursThisWeek > stats.hoursLastWeek ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.hoursThisWeek < stats.hoursLastWeek ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span className={stats.hoursThisWeek > stats.hoursLastWeek ? 'text-green-500' : stats.hoursThisWeek < stats.hoursLastWeek ? 'text-red-500' : ''}>
                      {stats.hoursThisWeek > stats.hoursLastWeek ? '+' : ''}
                      {(stats.hoursThisWeek - stats.hoursLastWeek).toFixed(1)}h
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats.groupsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Joined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cambridge Level</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (userProfile?.cambridge_level || 'Not assessed')}
              </div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.cambridge_level ? 'Current level' : 'Take placement test'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats.certificatesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Profile Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProfileEditor 
                    initialProfile={userProfile}
                    onProfileUpdate={(updatedProfile) => setUserProfile(updatedProfile)}
                  />
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    Visitar Página de Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
            <NotificationsPanel />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Continue Learning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.courses.length > 0 ? (
                  <div className="space-y-3">
                    {stats.courses.map((course) => (
                      <div key={course.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{course.name}</p>
                              {course.status === 'completed' && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">✓ Done</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {course.completedLessons}/{course.totalLessons} lessons completed
                              {course.avgScore > 0 && ` • Avg: ${course.avgScore}%`}
                            </p>
                            <div className="w-full bg-secondary rounded-full h-2 mb-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ 
                                  width: `${course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/course/${course.id}`)}
                            variant={course.status === 'completed' ? 'outline' : 'default'}
                          >
                            {course.status === 'completed' ? (
                              <>
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Redo
                              </>
                            ) : (
                              course.completedLessons === 0 ? 'Start' : 'Continue'
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/ai-chat?topic=${encodeURIComponent(course.name)}&level=${course.level}`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            AI Tutor
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {!hasPlacementTest 
                        ? "Take your placement test to see your personalized courses"
                        : "No courses available for your level"
                      }
                    </p>
                    <Button onClick={() => navigate(hasPlacementTest ? '/courses' : '/placement-test')}>
                      {hasPlacementTest ? 'Browse All Courses' : 'Take Placement Test'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ongoing Chats Section */}
            <OngoingChats />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Community Groups</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/community')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.joinedGroups.length > 0 ? (
                  <div className="space-y-3">
                    {stats.joinedGroups.slice(0, 3).map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.level} Level</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => {
                          localStorage.setItem('selectedGroupId', group.id);
                          navigate('/community');
                        }}>Visit</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">Join your first group</p>
                    <Button size="sm" onClick={() => navigate('/community')}>Explore Groups</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar for latest posts */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Community Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">English Learning Group</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Welcome! Start your structured learning journey with our comprehensive courses.
                    </p>
                    <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => navigate('/community')}>
                      Read more →
                    </Button>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/community')}>
                      View all posts
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificates Section */}
            {stats.certificatesCount > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Your Certificates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="font-medium">
                      {stats.certificatesCount} Certificate{stats.certificatesCount !== 1 ? 's' : ''} Earned
                    </p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate('/certificates')}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Level Advancement */}
            {userProfile?.cambridge_level && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Ready to Advance?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Current level: <strong>{userProfile.cambridge_level}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete your level courses and take the advancement test!
                    </p>
                    <Button size="sm" onClick={() => {
                      const nextLevel = getNextLevel(userProfile.cambridge_level);
                      if (nextLevel) {
                        navigate(`/level-test/${userProfile.cambridge_level}/${nextLevel}`);
                      }
                    }}>
                      Take Level Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}