import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, RefreshCw, Calendar, HelpCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Challenge {
  id: string;
  week_start: string;
  week_end: string;
  difficulty: string;
  is_active: boolean;
  questions: any[];
  created_at: string;
}

export function ClickOfWeekAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: currentChallenge, isLoading } = useQuery({
    queryKey: ['admin-click-challenge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('click_of_week_challenges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Challenge | null;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-click-stats'],
    queryFn: async () => {
      if (!currentChallenge) return null;
      
      const { count: totalAttempts } = await supabase
        .from('click_of_week_attempts')
        .select('*', { count: 'exact' })
        .eq('challenge_id', currentChallenge.id);

      const { count: completedAttempts } = await supabase
        .from('click_of_week_attempts')
        .select('*', { count: 'exact' })
        .eq('challenge_id', currentChallenge.id)
        .eq('completed', true);

      const { data: leaderboard } = await supabase
        .from('click_of_week_leaderboard')
        .select('*')
        .eq('challenge_id', currentChallenge.id);

      return {
        totalAttempts: totalAttempts || 0,
        completedAttempts: completedAttempts || 0,
        uniquePlayers: leaderboard?.length || 0
      };
    },
    enabled: !!currentChallenge
  });

  const handleGenerateChallenge = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-weekly-challenge', {
        body: {}
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate challenge');
      }

      toast({
        title: "Desafio Gerado!",
        description: "O novo desafio semanal foi criado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['admin-click-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['admin-click-stats'] });
    } catch (error: any) {
      console.error('Error generating challenge:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar o desafio. Verifique os logs.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Click of the Week
        </CardTitle>
        <CardDescription>
          Gerencie o desafio semanal de inglês. O cron job gera automaticamente toda segunda-feira às 00:01 UTC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : currentChallenge ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Desafio Atual</h4>
                <Badge variant={currentChallenge.is_active ? "default" : "secondary"}>
                  {currentChallenge.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatDate(currentChallenge.week_start)} - {formatDate(currentChallenge.week_end)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{Array.isArray(currentChallenge.questions) ? currentChallenge.questions.length : 0} perguntas</span>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.uniquePlayers}</div>
                    <div className="text-xs text-muted-foreground">Jogadores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalAttempts}</div>
                    <div className="text-xs text-muted-foreground">Tentativas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.completedAttempts}</div>
                    <div className="text-xs text-muted-foreground">Completas</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum desafio encontrado. Gere o primeiro desafio abaixo.
          </div>
        )}

        <Button 
          onClick={handleGenerateChallenge} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando desafio (pode levar 30s)...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Novo Desafio Semanal
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Isso substituirá o desafio atual da semana. Use apenas se necessário.
        </p>
      </CardContent>
    </Card>
  );
}
