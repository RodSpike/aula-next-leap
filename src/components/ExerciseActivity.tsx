
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, HelpCircle, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  exercise_type: 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'true_false' | 'reading_comprehension';
  title: string;
  instructions: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

interface ExerciseActivityProps {
  exercises: Exercise[];
  onComplete: (score: number, totalPoints: number) => void;
}

export function ExerciseActivity({ exercises, onComplete }: ExerciseActivityProps) {
  const { toast } = useToast();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResult, setShowResult] = useState<{ [key: number]: boolean }>({});
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  if (!exercises || exercises.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No exercises available for this lesson.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedExercises = [...exercises].sort((a, b) => a.order_index - b.order_index);
  const exercise = sortedExercises[currentExercise];
  const totalPoints = sortedExercises.reduce((sum, ex) => sum + ex.points, 0);

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentExercise]: answer }));
  };

  const checkAnswer = () => {
    const userAnswer = answers[currentExercise];
    const isCorrect = userAnswer === exercise.correct_answer;
    
    setShowResult(prev => ({ ...prev, [currentExercise]: true }));
    
    if (isCorrect && !showResult[currentExercise]) {
      setScore(prev => prev + exercise.points);
      toast({
        title: "Correto!",
        description: `+${exercise.points} pontos`,
      });
    } else if (!isCorrect) {
      toast({
        title: "Incorreto",
        description: "Tente novamente ou veja a explicação.",
        variant: "destructive",
      });
    }
  };

  const nextExercise = () => {
    if (currentExercise < sortedExercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
    } else {
      setCompleted(true);
      onComplete(score, totalPoints);
    }
  };

  const getExerciseTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fill_blank': return 'bg-green-100 text-green-800 border-green-200';
      case 'reading_comprehension': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'true_false': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (completed) {
    const percentage = Math.round((score / totalPoints) * 100);
    
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-8 text-center">
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Parabéns!</h3>
          <p className="text-lg mb-4">
            Você completou todos os exercícios!
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <p className="text-2xl font-bold text-primary">
              {score} / {totalPoints} pontos ({percentage}%)
            </p>
          </div>
          <Badge variant={percentage >= 70 ? "default" : "secondary"} className="text-lg px-4 py-2">
            {percentage >= 70 ? "Aprovado" : "Precisa melhorar"}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge className={getExerciseTypeColor(exercise.exercise_type)}>
          {exercise.exercise_type.replace('_', ' ')}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {currentExercise + 1} de {sortedExercises.length}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {exercise.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-medium">{exercise.question}</p>
          </div>

          {exercise.exercise_type === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentExercise] || ''}
              onValueChange={handleAnswer}
            >
              {exercise.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  {showResult[currentExercise] && (
                    <div>
                      {option === exercise.correct_answer && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {option === answers[currentExercise] && option !== exercise.correct_answer && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {exercise.exercise_type === 'fill_blank' && (
            <div className="space-y-3">
              <Input
                placeholder="Digite sua resposta..."
                value={answers[currentExercise] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                disabled={showResult[currentExercise]}
              />
              {showResult[currentExercise] && (
                <div className="flex items-center gap-2">
                  {answers[currentExercise] === exercise.correct_answer ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm">
                    Resposta correta: <strong>{exercise.correct_answer}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {showResult[currentExercise] && exercise.explanation && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Explicação:</p>
              <p className="text-sm text-blue-800">{exercise.explanation}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!showResult[currentExercise] ? (
              <Button 
                onClick={checkAnswer} 
                disabled={!answers[currentExercise]}
                className="flex-1"
              >
                Verificar Resposta
              </Button>
            ) : (
              <Button onClick={nextExercise} className="flex-1">
                {currentExercise < sortedExercises.length - 1 ? 'Próximo Exercício' : 'Finalizar'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
