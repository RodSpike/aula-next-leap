import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Winner {
  user_id: string;
  final_score: number;
  week_start: string;
  week_end: string;
  display_name: string | null;
  username: string | null;
}

const DashboardWinner = () => {
  const [lastWeekWinner, setLastWeekWinner] = useState<Winner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLastWeekWinner();
  }, []);

  const fetchLastWeekWinner = async () => {
    try {
      // Get last week's dates
      const today = new Date();
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7); // Last Sunday
      
      const { data: winners, error } = await supabase
        .from('click_of_week_winners')
        .select('*')
        .lte('week_end', today.toISOString().split('T')[0])
        .order('week_end', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (winners && winners.length > 0) {
        const winner = winners[0];
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', winner.user_id)
          .single();

        setLastWeekWinner({
          ...winner,
          display_name: profile?.display_name || null,
          username: profile?.username || null
        });
      }
    } catch (error) {
      console.error("Error fetching winner:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !lastWeekWinner) {
    return null;
  }

  const formatWeekDates = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/30">
      <div className="flex items-center gap-4">
        <div className="bg-yellow-500/20 p-3 rounded-full">
          <Trophy className="h-8 w-8 text-yellow-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Campeão da Semana ({formatWeekDates(lastWeekWinner.week_start, lastWeekWinner.week_end)})
          </p>
          <p className="text-lg font-bold">
            {lastWeekWinner.display_name || lastWeekWinner.username || 'Anônimo'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-500">{lastWeekWinner.final_score}</p>
          <p className="text-xs text-muted-foreground">pontos</p>
        </div>
      </div>
    </Card>
  );
};

export default DashboardWinner;
