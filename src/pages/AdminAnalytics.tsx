import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  Users, Clock, MousePointerClick, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Activity, Eye
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnalyticsData {
  totalUsers: number;
  activeUsersToday: number;
  avgSessionDuration: number;
  topPages: { page: string; views: number }[];
  topFeatures: { feature: string; uses: number }[];
  exitPages: { page: string; exits: number }[];
  dailyActiveUsers: { date: string; users: number }[];
  userGrowth: { date: string; total: number }[];
  sessionsByHour: { hour: string; sessions: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dateRange, setDateRange] = useState(7); // days

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user && !loading) {
      checkAdminAccess();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, dateRange]);

  const checkAdminAccess = async () => {
    try {
      const { data: hasAdmin } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin',
      });

      if (!hasAdmin) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      navigate("/dashboard");
    }
  };

  const fetchAnalytics = async () => {
    setLoadingData(true);
    try {
      const startDate = subDays(new Date(), dateRange);
      const endDate = new Date();

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch activity logs
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Calculate active users today
      const todayStart = startOfDay(new Date()).toISOString();
      const { data: todayLogs } = await supabase
        .from('user_activity_logs')
        .select('user_id')
        .gte('created_at', todayStart);

      const activeUsersToday = new Set(todayLogs?.map(l => l.user_id) || []).size;

      // Calculate avg session duration from session_end events
      const sessionEnds = activityLogs?.filter(
        l => l.action === 'session_end' && (l.context as any)?.duration
      ) || [];
      const avgSessionDuration = sessionEnds.length > 0
        ? Math.round(sessionEnds.reduce((sum, l) => sum + ((l.context as any)?.duration || 0), 0) / sessionEnds.length)
        : 0;

      // Top pages
      const pageViews = activityLogs?.filter(l => l.action === 'page_view') || [];
      const pageCount: Record<string, number> = {};
      pageViews.forEach(l => {
        const page = (l.context as any)?.page || 'unknown';
        pageCount[page] = (pageCount[page] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Top features
      const featureUses = activityLogs?.filter(l => l.action === 'feature_use') || [];
      const featureCount: Record<string, number> = {};
      featureUses.forEach(l => {
        const feature = (l.context as any)?.feature || 'unknown';
        featureCount[feature] = (featureCount[feature] || 0) + 1;
      });
      const topFeatures = Object.entries(featureCount)
        .map(([feature, uses]) => ({ feature, uses }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 10);

      // Exit pages
      const pageExits = activityLogs?.filter(l => l.action === 'page_exit' || l.action === 'session_end') || [];
      const exitCount: Record<string, number> = {};
      pageExits.forEach(l => {
        const page = (l.context as any)?.page || (l.context as any)?.last_page || 'unknown';
        exitCount[page] = (exitCount[page] || 0) + 1;
      });
      const exitPages = Object.entries(exitCount)
        .map(([page, exits]) => ({ page, exits }))
        .sort((a, b) => b.exits - a.exits)
        .slice(0, 10);

      // Daily active users
      const dailyUsers: Record<string, Set<string>> = {};
      activityLogs?.forEach(l => {
        const date = format(new Date(l.created_at), 'yyyy-MM-dd');
        if (!dailyUsers[date]) dailyUsers[date] = new Set();
        dailyUsers[date].add(l.user_id);
      });
      const dailyActiveUsers = Object.entries(dailyUsers)
        .map(([date, users]) => ({ date, users: users.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // User growth
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      const growthByDate: Record<string, number> = {};
      let runningTotal = 0;
      allProfiles?.forEach(p => {
        const date = format(new Date(p.created_at), 'yyyy-MM-dd');
        runningTotal++;
        growthByDate[date] = runningTotal;
      });
      const userGrowth = Object.entries(growthByDate)
        .slice(-dateRange)
        .map(([date, total]) => ({ date, total }));

      // Sessions by hour
      const hourCount: Record<string, number> = {};
      activityLogs?.filter(l => l.action === 'session_start').forEach(l => {
        const hour = format(new Date(l.created_at), 'HH:00');
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });
      const sessionsByHour = Array.from({ length: 24 }, (_, i) => {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        return { hour, sessions: hourCount[hour] || 0 };
      });

      setAnalytics({
        totalUsers: totalUsers || 0,
        activeUsersToday,
        avgSessionDuration,
        topPages,
        topFeatures,
        exitPages,
        dailyActiveUsers,
        userGrowth,
        sessionsByHour,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatPageName = (page: string) => {
    const names: Record<string, string> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/courses': 'Cursos',
      '/community': 'Comunidade',
      '/messages': 'Mensagens',
      '/profile': 'Perfil',
      '/friends': 'Amigos',
      '/achievements': 'Conquistas',
      '/ai-chat': 'Chat IA',
      '/click-of-the-week': 'Click da Semana',
      '/enem': 'ENEM',
    };
    return names[page] || page;
  };

  if (loading || !isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-0">
        <Breadcrumb />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Métricas de uso e comportamento dos usuários</p>
          </div>
          
          <Tabs value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
            <TabsList>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="14">14 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                      <p className="text-3xl font-bold">{analytics.totalUsers}</p>
                    </div>
                    <Users className="h-10 w-10 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Usuários Ativos Hoje</p>
                      <p className="text-3xl font-bold">{analytics.activeUsersToday}</p>
                    </div>
                    <Activity className="h-10 w-10 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo Médio de Sessão</p>
                      <p className="text-3xl font-bold">{formatDuration(analytics.avgSessionDuration)}</p>
                    </div>
                    <Clock className="h-10 w-10 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Páginas Visitadas</p>
                      <p className="text-3xl font-bold">
                        {analytics.topPages.reduce((sum, p) => sum + p.views, 0)}
                      </p>
                    </div>
                    <Eye className="h-10 w-10 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Usuários Ativos por Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => format(new Date(d), 'dd/MM')}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                        labelFormatter={(d) => format(new Date(d), 'dd/MM/yyyy')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                        name="Usuários"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Crescimento de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => format(new Date(d), 'dd/MM')}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                        labelFormatter={(d) => format(new Date(d), 'dd/MM/yyyy')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        name="Total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Páginas Mais Visitadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topPages.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        dataKey="page" 
                        type="category" 
                        width={80}
                        tickFormatter={formatPageName}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                        formatter={(value) => [value, 'Visitas']}
                        labelFormatter={formatPageName}
                      />
                      <Bar dataKey="views" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointerClick className="h-5 w-5" />
                    Features Mais Usadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.topFeatures.slice(0, 5)}
                        dataKey="uses"
                        nameKey="feature"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ feature }) => feature}
                      >
                        {analytics.topFeatures.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                    Páginas de Saída
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.exitPages.slice(0, 6).map((item, index) => (
                      <div key={item.page} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">
                          {formatPageName(item.page)}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground ml-2">
                          {item.exits} saídas
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sessions by Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Sessões por Hora do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.sessionsByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value) => [value, 'Sessões']}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
