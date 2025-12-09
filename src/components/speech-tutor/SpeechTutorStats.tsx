import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, MessageSquare, TrendingUp, Calendar, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SessionStats {
  totalSessions: number;
  totalDurationMinutes: number;
  totalMessages: number;
  totalWords: number;
  thisWeekSessions: number;
  thisWeekMinutes: number;
  averageSessionMinutes: number;
  streak: number;
}

export const SpeechTutorStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    totalDurationMinutes: 0,
    totalMessages: 0,
    totalWords: 0,
    thisWeekSessions: 0,
    thisWeekMinutes: 0,
    averageSessionMinutes: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch all sessions
      const { data: sessions, error } = await supabase
        .from('speech_tutor_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        setStats({
          totalSessions: 0,
          totalDurationMinutes: 0,
          totalMessages: 0,
          totalWords: 0,
          thisWeekSessions: 0,
          thisWeekMinutes: 0,
          averageSessionMinutes: 0,
          streak: 0,
        });
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalSessions = sessions.length;
      const totalDurationSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const totalMessages = sessions.reduce((sum, s) => sum + (s.messages_count || 0), 0);
      const totalWords = sessions.reduce((sum, s) => sum + (s.words_spoken || 0), 0);

      // Calculate this week's stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekSessions = sessions.filter(
        s => new Date(s.created_at) >= oneWeekAgo
      );
      const thisWeekSeconds = thisWeekSessions.reduce(
        (sum, s) => sum + (s.duration_seconds || 0), 0
      );

      // Calculate streak (consecutive days with practice)
      const sessionDates = [...new Set(
        sessions.map(s => new Date(s.created_at).toDateString())
      )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (sessionDates[0] === today || sessionDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sessionDates.length; i++) {
          const prevDate = new Date(sessionDates[i - 1]);
          const currDate = new Date(sessionDates[i]);
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
          
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }

      setStats({
        totalSessions,
        totalDurationMinutes: Math.round(totalDurationSeconds / 60),
        totalMessages,
        totalWords,
        thisWeekSessions: thisWeekSessions.length,
        thisWeekMinutes: Math.round(thisWeekSeconds / 60),
        averageSessionMinutes: totalSessions > 0 
          ? Math.round(totalDurationSeconds / 60 / totalSessions) 
          : 0,
        streak,
      });
    } catch (error) {
      console.error('Error fetching speech tutor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Weekly goal: 30 minutes
  const weeklyGoalMinutes = 30;
  const weeklyProgress = Math.min((stats.thisWeekMinutes / weeklyGoalMinutes) * 100, 100);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Progress */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Meta Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.thisWeekMinutes} min praticados</span>
              <span className="text-muted-foreground">{weeklyGoalMinutes} min meta</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats.thisWeekSessions} sessões esta semana
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Practice Time */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDurationMinutes}</p>
                <p className="text-xs text-muted-foreground">minutos totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Sessions */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Mic className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">sessões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-xs text-muted-foreground">mensagens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.streak}</p>
                <p className="text-xs text-muted-foreground">dias seguidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          {stats.totalWords > 0 ? (
            <>Você já falou aproximadamente <span className="font-semibold text-foreground">{stats.totalWords.toLocaleString()}</span> palavras em inglês!</>
          ) : (
            <>Comece a praticar para ver suas estatísticas aqui!</>
          )}
        </p>
      </div>
    </div>
  );
};
