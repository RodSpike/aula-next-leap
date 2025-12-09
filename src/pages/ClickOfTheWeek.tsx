import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Heart, Trophy, Clock, ArrowLeft, CheckCircle, XCircle, Zap } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import ClickLeaderboard from "@/components/click-of-week/ClickLeaderboard";
import { AppLayout } from "@/components/layout/AppLayout";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
  difficulty: string;
}

interface AttemptState {
  id: string;
  score: number;
  lives_remaining: number;
  current_question: number;
  answers: number[];
  completed: boolean;
}

const ClickOfTheWeek = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addXP, updateAchievement } = useGamification();
  
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [displayedQuestionIndex, setDisplayedQuestionIndex] = useState<number>(0);

  useEffect(() => {
    if (user) {
      checkCanAttempt();
    }
  }, [user]);

  const checkCanAttempt = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('can_attempt_click_of_week', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { 
        can_attempt: boolean; 
        challenge_id?: string; 
        attempt_id?: string;
        next_attempt_at?: string;
        reason?: string;
        is_continuation?: boolean;
      };

      if (result.can_attempt) {
        setCanPlay(true);
        setChallengeId(result.challenge_id || null);
        
        if (result.is_continuation && result.attempt_id) {
          await loadExistingAttempt(result.attempt_id, result.challenge_id!);
        }
      } else {
        setCanPlay(false);
        if (result.next_attempt_at) {
          setCooldownEnd(new Date(result.next_attempt_at));
        }
      }
    } catch (error) {
      console.error("Error checking attempt status:", error);
      toast.error("Erro ao verificar status");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttempt = async (attemptId: string, challengeId: string) => {
    const { data: attemptData } = await supabase
      .from('click_of_week_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptData) {
      setAttempt({
        id: attemptData.id,
        score: attemptData.score,
        lives_remaining: attemptData.lives_remaining,
        current_question: attemptData.current_question,
        answers: attemptData.answers as number[],
        completed: attemptData.completed
      });
      setDisplayedQuestionIndex(attemptData.current_question);
    }

    await loadQuestions(challengeId);
  };

  const loadQuestions = async (challengeId: string) => {
    const { data } = await supabase
      .from('click_of_week_challenges')
      .select('questions')
      .eq('id', challengeId)
      .single();

    if (data?.questions && Array.isArray(data.questions)) {
      setQuestions(data.questions as unknown as Question[]);
    }
  };

  const startGame = async () => {
    if (!user || !challengeId) return;

    try {
      await loadQuestions(challengeId);

      const { data: newAttempt, error } = await supabase
        .from('click_of_week_attempts')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          lives_remaining: 3,
          current_question: 0,
          score: 0,
          answers: []
        })
        .select()
        .single();

      if (error) throw error;

      setAttempt({
        id: newAttempt.id,
        score: 0,
        lives_remaining: 3,
        current_question: 0,
        answers: [],
        completed: false
      });
      setDisplayedQuestionIndex(0);

      await updateAchievement('click_first_attempt');
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Erro ao iniciar o jogo");
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (!attempt || showResult || !questions[displayedQuestionIndex]) return;

    setSelectedAnswer(answerIndex);
    const currentQuestion = questions[displayedQuestionIndex];
    const correct = answerIndex === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    const newScore = correct ? attempt.score + 1 : attempt.score;
    const newLives = correct ? attempt.lives_remaining : attempt.lives_remaining - 1;
    const newAnswers = [...attempt.answers, answerIndex];
    const isLastQuestion = attempt.current_question >= 49;
    const noLivesLeft = newLives <= 0;
    const isCompleted = isLastQuestion || noLivesLeft;

    const updateData: Record<string, unknown> = {
      score: newScore,
      lives_remaining: newLives,
      answers: newAnswers,
      current_question: attempt.current_question + 1,
      completed: isCompleted
    };

    if (isCompleted) {
      updateData.completed_at = new Date().toISOString();
      if (noLivesLeft && !isLastQuestion) {
        updateData.next_attempt_at = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      }
    }

    await supabase
      .from('click_of_week_attempts')
      .update(updateData)
      .eq('id', attempt.id);

    setAttempt({
      ...attempt,
      score: newScore,
      lives_remaining: newLives,
      current_question: attempt.current_question + 1,
      answers: newAnswers,
      completed: isCompleted
    });

    if (isCompleted) {
      await updateLeaderboard(newScore);
      await handleGameComplete(newScore, newLives);
    }
  };

  const updateLeaderboard = async (score: number) => {
    if (!user || !challengeId) return;

    const { data: existing } = await supabase
      .from('click_of_week_leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (existing) {
      if (score > existing.best_score) {
        await supabase
          .from('click_of_week_leaderboard')
          .update({ 
            best_score: score, 
            attempts_count: existing.attempts_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('click_of_week_leaderboard')
          .update({ 
            attempts_count: existing.attempts_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      }
    } else {
      await supabase
        .from('click_of_week_leaderboard')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          best_score: score,
          attempts_count: 1
        });
    }
  };

  const handleGameComplete = async (score: number, livesRemaining: number) => {
    setGameOver(true);

    const xpEarned = score * 5;
    await addXP(xpEarned, 'click_of_week', `Scored ${score}/50 in Click of the Week`);

    if (score === 50) {
      await updateAchievement('click_perfect_score');
      toast.success("🎉 Pontuação Perfeita! Incrível!");
    } else if (score >= 40) {
      await updateAchievement('click_high_scorer');
      toast.success(`Excelente! ${score}/50 pontos!`);
    } else if (livesRemaining <= 0) {
      toast.info(`Fim de jogo! ${score}/50 pontos. Tente novamente em 6 horas.`);
    } else {
      toast.success(`Parabéns! ${score}/50 pontos!`);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setDisplayedQuestionIndex(prev => prev + 1);
  };

  const formatCooldown = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <AppLayout showSidebar={false}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  if (showLeaderboard) {
    return (
      <AppLayout showSidebar={false}>
        <div className="min-h-screen bg-background p-4">
          <Button variant="ghost" onClick={() => setShowLeaderboard(false)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <ClickLeaderboard challengeId={challengeId} />
        </div>
      </AppLayout>
    );
  }

  if (gameOver && attempt) {
    return (
      <AppLayout showSidebar={false}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="text-6xl">
              {attempt.score === 50 ? "🏆" : attempt.score >= 40 ? "🎉" : attempt.lives_remaining > 0 ? "✨" : "💪"}
            </div>
            <h1 className="text-3xl font-bold">
              {attempt.score === 50 ? "Perfeito!" : attempt.score >= 40 ? "Excelente!" : "Bom trabalho!"}
            </h1>
            <div className="text-5xl font-bold text-primary">{attempt.score}/50</div>
            <p className="text-muted-foreground">
              Você ganhou <span className="text-primary font-semibold">{attempt.score * 5} XP</span>
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setShowLeaderboard(true)}>
                <Trophy className="mr-2 h-4 w-4" /> Ver Ranking
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!canPlay && cooldownEnd) {
    return (
      <AppLayout showSidebar={false}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Aguarde para jogar novamente</h1>
            <p className="text-muted-foreground">
              Você poderá tentar novamente em:
            </p>
            <div className="text-4xl font-bold text-primary">
              {formatCooldown(cooldownEnd)}
            </div>
            <Button variant="outline" onClick={() => setShowLeaderboard(true)}>
              <Trophy className="mr-2 h-4 w-4" /> Ver Ranking
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!attempt) {
    return (
      <AppLayout showSidebar={false}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8 text-center space-y-6">
            <Zap className="h-20 w-20 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Click of the Week</h1>
            <p className="text-muted-foreground">
              Teste seus conhecimentos em inglês! Responda 50 perguntas, mas cuidado - você só tem 3 vidas!
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((i) => (
                <Heart key={i} className="h-8 w-8 text-destructive fill-destructive" />
              ))}
            </div>
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={startGame}>
                Começar Desafio
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowLeaderboard(true)}>
                <Trophy className="mr-2 h-4 w-4" /> Ver Ranking
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentQuestion = questions[displayedQuestionIndex];

  if (!currentQuestion) {
    return (
      <AppLayout showSidebar={false}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Carregando pergunta...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <Heart 
                  key={i} 
                  className={`h-6 w-6 ${i <= attempt.lives_remaining ? 'text-destructive fill-destructive' : 'text-muted-foreground/30'}`} 
                />
              ))}
            </div>
            <div className="text-lg font-bold text-primary">{attempt.score} pts</div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta {displayedQuestionIndex + 1} de 50</span>
            <span>{Math.round(((displayedQuestionIndex + 1) / 50) * 100)}%</span>
          </div>
          <Progress value={((displayedQuestionIndex + 1) / 50) * 100} />
        </div>

        {/* Question Card */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-600' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
              'bg-red-500/20 text-red-600'
            }`}>
              {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
               currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {currentQuestion.category.replace('_', ' ')}
            </span>
          </div>

          <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correct_answer;
              
              let buttonClass = "w-full text-left p-4 h-auto justify-start";
              if (showResult) {
                if (isCorrectOption) {
                  buttonClass += " bg-green-500/20 border-green-500 text-green-700";
                } else if (isSelected && !isCorrectOption) {
                  buttonClass += " bg-red-500/20 border-red-500 text-red-700";
                }
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={buttonClass}
                  disabled={showResult}
                  onClick={() => handleAnswer(index)}
                >
                  <span className="mr-3 font-bold">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrectOption && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </Button>
              );
            })}
          </div>

          {showResult && (
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✓ Correto!' : '✗ Incorreto'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {showResult && !gameOver && (
            <Button className="w-full" onClick={nextQuestion}>
              Próxima Pergunta
            </Button>
          )}
        </Card>
      </div>
    </div>
    </AppLayout>
  );
};

export default ClickOfTheWeek;
