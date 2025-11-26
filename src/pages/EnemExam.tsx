import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

const subjectNames: Record<string, string> = {
  portugues: 'Português e Literatura',
  redacao: 'Redação',
  matematica: 'Matemática',
  fisica: 'Física',
  quimica: 'Química',
  biologia: 'Biologia',
  historia: 'História',
  geografia: 'Geografia',
  filosofia: 'Filosofia',
  sociologia: 'Sociologia',
};

export default function EnemExam() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, [subjectId]);

  const loadQuestions = async () => {
    if (!subjectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-enem-content', {
        body: { subject: subjectNames[subjectId], type: 'exam' }
      });

      if (error) throw error;
      
      let parsedQuestions = data.content;
      if (typeof parsedQuestions === 'string') {
        parsedQuestions = JSON.parse(parsedQuestions.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      }
      
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar questões. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: "Atenção",
        description: "Por favor, responda todas as questões antes de finalizar.",
        variant: "destructive",
      });
      return;
    }
    setSubmitted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) correct++;
    });
    return { correct, total: questions.length, percentage: (correct / questions.length) * 100 };
  };

  const getMistakes = () => {
    return questions
      .map((q, idx) => ({ ...q, index: idx }))
      .filter((q) => answers[q.index] !== q.correct);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Gerando questões do simulado...</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const score = calculateScore();
    const mistakes = getMistakes();
    
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-3xl">Resultado do Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className="text-6xl font-bold mb-2">
                  {score.percentage.toFixed(0)}%
                </div>
                <p className="text-xl text-muted-foreground">
                  {score.correct} de {score.total} questões corretas
                </p>
              </div>

              {mistakes.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-4">Revisão dos Erros</h3>
                  
                  {mistakes.map((mistake) => (
                    <Card key={mistake.index} className="border-destructive/50">
                      <CardContent className="pt-6">
                        <p className="font-semibold mb-3">Questão {mistake.index + 1}</p>
                        <p className="mb-4">{mistake.question}</p>
                        
                        <div className="space-y-2 mb-4">
                          {mistake.options.map((opt, i) => (
                            <div 
                              key={i}
                              className={`p-3 rounded ${
                                opt === mistake.correct 
                                  ? 'bg-green-500/20 border border-green-500' 
                                  : opt === answers[mistake.index]
                                  ? 'bg-destructive/20 border border-destructive'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {opt === mistake.correct && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                {opt === answers[mistake.index] && opt !== mistake.correct && <XCircle className="h-5 w-5 text-destructive" />}
                                <span>{opt}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-muted p-4 rounded">
                          <p className="font-semibold mb-2">Explicação:</p>
                          <p className="text-sm">{mistake.explanation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card className="bg-primary/10 border-primary">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-2">
                        Quer reforçar o aprendizado destes tópicos?
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Use nosso Tutor IA para estudar especificamente os pontos onde você errou
                      </p>
                      <Button 
                        size="lg"
                        onClick={() => navigate(`/enem-tutor?subject=${subjectId}&mistakes=${mistakes.length}`)}
                      >
                        Estudar Erros com Tutor IA
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <Button variant="outline" onClick={() => navigate('/enem-course')}>
                  Voltar para Matérias
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refazer Simulado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              Simulado: {subjectNames[subjectId || '']}
            </h1>
            <span className="text-muted-foreground">
              Questão {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Questão {currentQuestion + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6 whitespace-pre-wrap">{question.question}</p>
            
            <RadioGroup 
              value={answers[currentQuestion] || ""} 
              onValueChange={(value) => setAnswers({ ...answers, [currentQuestion]: value })}
            >
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-4 rounded border hover:bg-muted">
                    <RadioGroupItem value={option} id={`q${currentQuestion}-${idx}`} />
                    <Label 
                      htmlFor={`q${currentQuestion}-${idx}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
              >
                Anterior
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button onClick={handleSubmit}>
                  Finalizar Simulado
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                  Próxima
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
