import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Users, 
  Search, 
  Sparkles, 
  Loader2,
  User,
  GraduationCap,
  XCircle,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface UserWithLevel {
  user_id: string;
  display_name: string | null;
  email: string;
  cambridge_level: string | null;
  created_at: string;
}

interface TestAttempt {
  id: string;
  user_id: string;
  final_level: string;
  score: number | null;
  total_questions: number;
  correct_answers: number;
  answers: any[];
  completed_at: string;
}

export function PlacementTestStatistics() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithLevel[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithLevel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithLevel | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [levelStats, setLevelStats] = useState<Record<string, number>>({});
  const [userAttempts, setUserAttempts] = useState<Record<string, TestAttempt[]>>({});

  useEffect(() => {
    fetchUsersWithLevels();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsersWithLevels = async () => {
    try {
      // Fetch users with levels
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, cambridge_level, created_at')
        .not('cambridge_level', 'is', null)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch all test attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('placement_test_attempts')
        .select('*')
        .order('completed_at', { ascending: false });

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
      }

      // Group attempts by user
      const attemptsByUser: Record<string, TestAttempt[]> = {};
      (attemptsData || []).forEach((attempt: any) => {
        if (!attemptsByUser[attempt.user_id]) {
          attemptsByUser[attempt.user_id] = [];
        }
        attemptsByUser[attempt.user_id].push(attempt);
      });
      setUserAttempts(attemptsByUser);

      setUsers(usersData || []);
      setFilteredUsers(usersData || []);

      // Calculate level statistics
      const stats: Record<string, number> = {};
      (usersData || []).forEach(user => {
        const level = user.cambridge_level || 'Unknown';
        stats[level] = (stats[level] || 0) + 1;
      });
      setLevelStats(stats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeUser = async (user: UserWithLevel) => {
    setSelectedUser(user);
    setIsAnalyzing(true);
    setShowAnalysisDialog(true);
    setAiAnalysis(null);

    try {
      // Get real test attempt data
      const attempts = userAttempts[user.user_id] || [];
      const latestAttempt = attempts[0];

      let questionResults: any[] = [];
      
      if (latestAttempt && Array.isArray(latestAttempt.answers)) {
        // Use real answer data
        questionResults = latestAttempt.answers.map((answer: any) => ({
          question: answer.question || 'N/A',
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          level: answer.level || 'N/A'
        }));
        setSelectedAttempt(latestAttempt);
      } else {
        // No real data available - inform admin
        toast({
          title: 'Dados limitados',
          description: 'Este usuário fez o teste antes do sistema de histórico. A análise será baseada apenas no nível.',
        });
        // Generate minimal context
        questionResults = [{
          question: 'Dados históricos não disponíveis',
          userAnswer: 'N/A',
          correctAnswer: 'N/A',
          isCorrect: false,
          level: user.cambridge_level || 'N/A'
        }];
        setSelectedAttempt(null);
      }

      const { data, error } = await supabase.functions.invoke('analyze-user-performance', {
        body: {
          userId: user.user_id,
          displayName: user.display_name,
          cambridgeLevel: user.cambridge_level,
          questionResults,
          hasRealData: !!latestAttempt
        }
      });

      if (error) throw error;

      setAiAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Error analyzing user:', error);
      toast({
        title: 'Erro ao analisar usuário',
        description: error.message || 'Falha na análise com IA',
        variant: 'destructive'
      });
      setShowAnalysisDialog(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'A1': 'bg-emerald-500',
      'A2': 'bg-green-500',
      'B1': 'bg-blue-500',
      'B2': 'bg-indigo-500',
      'C1': 'bg-purple-500',
      'C2': 'bg-pink-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const hasRealData = (userId: string) => {
    const attempts = userAttempts[userId];
    return attempts && attempts.length > 0 && Array.isArray(attempts[0].answers) && attempts[0].answers.length > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estatísticas do Teste de Nível
        </CardTitle>
        <CardDescription>
          Análise de performance dos usuários com suporte de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Distribution */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Distribuição por Nível
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
              <div 
                key={level}
                className="text-center p-3 rounded-lg bg-muted/50"
              >
                <div className={`w-8 h-8 rounded-full ${getLevelColor(level)} mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs`}>
                  {level}
                </div>
                <p className="text-lg font-bold">{levelStats[level] || 0}</p>
                <p className="text-xs text-muted-foreground">usuários</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search Users */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários ({filteredUsers.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum usuário encontrado com teste de nível.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {filteredUsers.map(user => {
                const hasData = hasRealData(user.user_id);
                const attempts = userAttempts[user.user_id] || [];
                const latestAttempt = attempts[0];
                
                return (
                  <div 
                    key={user.user_id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate flex items-center gap-2">
                            {user.display_name || 'Sem nome'}
                            {hasData ? (
                              <span title="Dados de respostas disponíveis">
                                <FileText className="h-3 w-3 text-green-500" />
                              </span>
                            ) : (
                              <span title="Sem dados históricos">
                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                          {latestAttempt && (
                            <p className="text-xs text-muted-foreground">
                              {latestAttempt.correct_answers}/{latestAttempt.total_questions} corretas 
                              ({latestAttempt.score ? `${latestAttempt.score}%` : 'N/A'})
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={`${getLevelColor(user.cambridge_level || '')} text-white`}>
                            {user.cambridge_level}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(user.created_at), 'dd/MM/yy', { locale: ptBR })}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyzeUser(user)}
                          className="gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Analisar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* AI Analysis Dialog */}
        <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Análise de Performance
              </DialogTitle>
              <DialogDescription>
                {selectedUser && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedUser.display_name || selectedUser.email}
                      <Badge className={`${getLevelColor(selectedUser.cambridge_level || '')} text-white ml-2`}>
                        {selectedUser.cambridge_level}
                      </Badge>
                    </span>
                    {selectedAttempt && (
                      <span className="text-xs flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {selectedAttempt.correct_answers}/{selectedAttempt.total_questions} respostas corretas
                        ({selectedAttempt.score}%)
                        • Teste em {format(new Date(selectedAttempt.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analisando performance com IA...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Não foi possível gerar a análise.</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}