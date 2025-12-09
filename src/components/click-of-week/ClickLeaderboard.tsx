import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  best_score: number;
  attempts_count: number;
  display_name: string | null;
  username: string | null;
}

interface ClickLeaderboardProps {
  challengeId: string | null;
}

const ClickLeaderboard = ({ challengeId }: ClickLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId) {
      fetchLeaderboard();
    }
  }, [challengeId]);

  const fetchLeaderboard = async () => {
    if (!challengeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('click_of_week_leaderboard')
        .select(`
          user_id,
          best_score,
          attempts_count
        `)
        .eq('challenge_id', challengeId)
        .order('best_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for each user
      const userIds = data.map(entry => entry.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData: LeaderboardEntry[] = data.map(entry => ({
        ...entry,
        display_name: profileMap.get(entry.user_id)?.display_name || null,
        username: profileMap.get(entry.user_id)?.username || null
      }));

      setLeaderboard(enrichedData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-400/5";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-600/5";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-center text-muted-foreground">
          Carregando ranking...
        </div>
      </Card>
    );
  }

  if (!challengeId) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Nenhum desafio ativo esta semana.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Ranking da Semana</h2>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum participante ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-3 rounded-lg ${getRankBg(index + 1)}`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index + 1)}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {entry.display_name || entry.username || 'Anônimo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.attempts_count} tentativa{entry.attempts_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{entry.best_score}</p>
                <p className="text-xs text-muted-foreground">pontos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ClickLeaderboard;
