import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, ChevronRight } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  best_score: number;
  display_name: string | null;
  username: string | null;
}

const CurrentWeekLeaderboard = () => {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentChallenge();
  }, []);

  const fetchCurrentChallenge = async () => {
    try {
      const { data: challengeIdData } = await supabase.rpc('get_current_week_challenge');
      
      if (challengeIdData) {
        setChallengeId(challengeIdData);
        await fetchTopPlayers(challengeIdData);
      }
    } catch (error) {
      console.error("Error fetching challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPlayers = async (challengeId: string) => {
    const { data, error } = await supabase
      .from('click_of_week_leaderboard')
      .select('user_id, best_score')
      .eq('challenge_id', challengeId)
      .order('best_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return;
    }

    if (data && data.length > 0) {
      const userIds = data.map(entry => entry.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedData: LeaderboardEntry[] = data.map(entry => ({
        user_id: entry.user_id,
        best_score: entry.best_score,
        display_name: profileMap.get(entry.user_id)?.display_name || null,
        username: profileMap.get(entry.user_id)?.username || null
      }));

      setTopPlayers(enrichedData);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Click of the Week</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/click-of-the-week')}
        >
          Jogar <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {!challengeId ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum desafio ativo esta semana.
        </p>
      ) : topPlayers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Seja o primeiro a jogar!
          </p>
          <Button onClick={() => navigate('/click-of-the-week')}>
            Começar Agora
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {topPlayers.map((player, index) => (
            <div 
              key={player.user_id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
            >
              <div className="w-6 text-center">
                {index === 0 ? (
                  <Trophy className="h-4 w-4 text-yellow-500 mx-auto" />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>
              <span className="flex-1 text-sm truncate">
                {player.display_name || player.username || 'Anônimo'}
              </span>
              <span className="text-sm font-bold text-primary">
                {player.best_score}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CurrentWeekLeaderboard;
