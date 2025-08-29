
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy, Target, BookOpen } from "lucide-react";

interface Exercise {
  id: string;
  lesson_id: string;
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);

  const handleAnswerChange = (exerciseId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [exerciseId]: answer
    }));
  };

  const checkAnswer = (exercise: Exercise): boolean => {
    const userAnswer = userAnswers[exercise.id]?.toLowerCase().trim();
    const correctAnswer = exercise.correct_answer.toLowerCase().trim();
    return userAnswer === correctAnswer;
  };

  const calculateScore = (): number => {
    return exercises.reduce((score, exercise) => {
      if (checkAnswer(exercise)) {
        return score + exercise.points;
      }
      return score;
    }, 0);
  };

  const nextExercise = () => {
    if (isLastExercise) {
      setShowResults(true);
      setCompleted(true);
      const finalScore = calculateScore();
      onComplete(finalScore, totalPoints);
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const restartExercises = () => {
    setCurrentExerciseIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setCompleted(false);
  };

  const renderExerciseContent = (exercise: Exercise) => {
    const userAnswer = userAnswers[exercise.id] || '';
    
    switch (exercise.exercise_type) {
      case 'multiple_choice':
      case 'reading_comprehension':
        return (
          <div className="space-y-4">
            <RadioGroup 
              value={userAnswer} 
              onValueChange={(value) => handleAnswerChange(exercise.id, value)}
            >
              {exercise.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 'fill_blank':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Digite sua resposta..."
              value={userAnswer}
              onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
              className="text-lg"
            />
          </div>
        );
      
      case 'true_false':
        return (
          <div className="space-y-4">
            <RadioGroup 
              value={userAnswer} 
              onValueChange={(value) => handleAnswerChange(exercise.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label 
                  htmlFor="true" 
                  className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  Verdadeiro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label 
                  htmlFor="false" 
                  className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  Falso
                </Label>
              </div>
            </RadioGroup>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Digite sua resposta..."
              value={userAnswer}
              onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
              className="text-lg"
            />
          </div>
        );
    }
  };

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum exercício disponível</h3>
          <p className="text-muted-foreground">
            Os exercícios para esta lição ainda estão sendo preparados.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= 70;

    return (
      <Card>
        <CardHeader className="text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            passed ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            {passed ? (
              <Trophy className="h-8 w-8 text-green-600" />
            ) : (
              <Target className="h-8 w-8 text-orange-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Parabéns!' : 'Continue praticando!'}
          </CardTitle>
          <p className="text-muted-foreground">
            Você obteve {score} de {totalPoints} pontos ({percentage}%)
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Progress value={percentage} className="h-3" />
          
          <div className="space-y-3">
            <h4 className="font-medium">Resultados detalhados:</h4>
            {exercises.map((exercise, index) => {
              const isCorrect = checkAnswer(exercise);
              return (
                <div 
                  key={exercise.id}
                  className={`p-3 rounded-lg border ${
                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">
                          Questão {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {exercise.question}
                      </p>
                      <div className="text-xs space-y-1">
                        <div>Sua resposta: <span className="font-medium">{userAnswers[exercise.id] || 'Não respondida'}</span></div>
                        <div>Resposta correta: <span className="font-medium text-green-600">{exercise.correct_answer}</span></div>
                      </div>
                      {exercise.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {exercise.explanation}
                        </p>
                      )}
                    </div>
                    <Badge variant={isCorrect ? 'default' : 'destructive'} className="text-xs">
                      {isCorrect ? `+${exercise.points}` : '0'} pts
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button onClick={restartExercises} variant="outline" className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            {passed && (
              <Button className="flex-1">
                <Trophy className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">
                Exercício {currentExerciseIndex + 1} de {exercises.length}
              </span>
            </div>
            <Badge variant="outline">
              {currentExercise.points} pontos
            </Badge>
          </div>
          <Progress 
            value={(currentExerciseIndex / exercises.length) * 100} 
            className="h-2" 
          />
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="capitalize">
              {currentExercise.exercise_type.replace('_', ' ')}
            </Badge>
          </div>
          <CardTitle className="text-xl">{currentExercise.title}</CardTitle>
          <p className="text-muted-foreground">{currentExercise.instructions}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-3">{currentExercise.question}</h4>
          </div>
          
          {renderExerciseContent(currentExercise)}
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
              disabled={currentExerciseIndex === 0}
            >
              Anterior
            </Button>
            
            <Button
              onClick={nextExercise}
              disabled={!userAnswers[currentExercise.id]}
            >
              {isLastExercise ? 'Finalizar' : 'Próximo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
