import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, Play, Award, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  activeCourses: number;
  hoursThisWeek: number;
  hoursLastWeek: number;
  groupsCount: number;
  certificatesCount: number;
  courses: Array<{
    id: string;
    name: string;
    description: string;
    totalLessons: number;
    completedLessons: number;
    status: string;
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
      
      // Get active courses
      const { data: courses } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active');

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

      // Get groups count
      const { count: groupsCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact' })
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
        activeCourses: courses?.length || 0,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        hoursLastWeek: Math.round(hoursLastWeek * 10) / 10,
        groupsCount: groupsCount || 0,
        certificatesCount: certificatesCount || 0,
        courses: courses?.map(course => ({
          id: course.id,
          name: course.course_name,
          description: course.course_description || '',
          totalLessons: course.total_lessons,
          completedLessons: course.completed_lessons,
          status: course.status
        })) || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{userProfile?.display_name ? `, ${userProfile.display_name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey
          </p>
          <Badge variant="secondary" className="mt-2">
            ✨ 3 days free trial remaining
          </Badge>
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
                    Discover your English level and join the perfect learning group for your skill level.
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="flex items-center space-x-4 p-4 bg-accent rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-secondary rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4"></div>
                    <div className="h-3 bg-secondary rounded w-1/2"></div>
                  </div>
                </div>
              ) : stats.courses.length > 0 ? (
                stats.courses.slice(0, 2).map((course) => {
                  const progress = course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0;
                  return (
                    <div key={course.id} className="flex items-center space-x-4 p-4 bg-accent rounded-lg">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{course.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Lesson {course.completedLessons} of {course.totalLessons}
                        </p>
                        <div className="w-full bg-secondary rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <Button size="sm">
                        {progress > 0 ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active courses yet</p>
                  <Button className="mt-4" onClick={() => navigate('/courses')}>
                    Browse Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-semibold">JS</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">John Smith</span> posted a new question in{" "}
                    <span className="text-primary">English Fundamentals</span>
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold">MF</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">Maria Fernandez</span> shared a file in{" "}
                    <span className="text-primary">Conversation Practice</span>
                  </p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold">RC</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">Robert Costa</span> completed the course{" "}
                    <span className="text-primary">Advanced Grammar</span>
                  </p>
                  <p className="text-xs text-muted-foreground">yesterday</p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/community')}>
                View More Activities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}