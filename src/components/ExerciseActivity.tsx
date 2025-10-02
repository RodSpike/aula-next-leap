import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

interface Exercise {
  type?: 'multiple_choice' | 'fill_blank';
  exercise_type?: 'multiple_choice' | 'fill_blank';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  title?: string;
  instructions?: string;
  points?: number;
  id?: string;
  lesson_id?: string;
  order_index?: number;
}

interface ExerciseActivityProps {
  exercises: Exercise[];
  onComplete?: (score: number, totalPoints: number) => void;
}

export const ExerciseActivity: React.FC<ExerciseActivityProps> = ({ exercises, onComplete }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(exercises.length).fill(''));
  const [showResults, setShowResults] = useState(false);
  const { addXP, updateAchievement } = useGamification();

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentExercise] = answer;
    setUserAnswers(newAnswers);
  };

  const nextExercise = async () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      setShowResults(true);
      const score = calculateScore();
      const totalPoints = exercises.length;
      
      // Gamification: Award XP based on score
      const xpPerCorrect = 5;
      const xpEarned = score * xpPerCorrect;
      await addXP(xpEarned, 'exercises_completed', `Completed ${score}/${totalPoints} exercises`);
      
      // Check for perfect score achievement
      if (score === totalPoints) {
        await updateAchievement('perfect_score');
        await updateAchievement('perfectionist');
      }
      
      onComplete?.(score, totalPoints);
    }
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, answer, index) => {
      const correct = exercises[index].correct_answer ?? '';
      const hasOptions = Array.isArray(exercises[index].options) && exercises[index].options.length > 0;
      const isCorrect = hasOptions
        ? answer === correct
        : (answer || '').trim().toLowerCase() === correct.trim().toLowerCase();
      return isCorrect ? score + 1 : score;
    }, 0);
  };

  if (!exercises || exercises.length === 0) return null;

  const exercise = exercises[currentExercise];
  const score = calculateScore();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Practice Exercises
          <Badge variant="outline">{currentExercise + 1} / {exercises.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!showResults ? (
          <>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-lg">{exercise.question}</p>
            </div>

            {exercise.options && exercise.options.length > 0 ? (
              <RadioGroup 
                value={userAnswers[currentExercise]} 
                onValueChange={handleAnswer}
                className="space-y-2"
              >
                {exercise.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Input
                value={userAnswers[currentExercise]}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Digite sua resposta"
              />
            )}

            <Button 
              onClick={nextExercise}
              disabled={!userAnswers[currentExercise]}
              className="w-full"
            >
              {currentExercise === exercises.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                score >= exercises.length * 0.7 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {score >= exercises.length * 0.7 ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </div>
              <h3 className="text-xl font-bold">Score: {score}/{exercises.length}</h3>
            </div>
            <div className="space-y-3">
              {exercises.map((ex, idx) => {
                const userAns = userAnswers[idx] || '';
                const correct = ex.correct_answer || '';
                const hasOptions = Array.isArray(ex.options) && ex.options.length > 0;
                const isCorrect = hasOptions
                  ? userAns === correct
                  : userAns.trim().toLowerCase() === correct.trim().toLowerCase();
                return (
                  <div key={idx} className="p-3 rounded-md border">
                    <p className="font-medium">{idx + 1}. {ex.question}</p>
                    <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      Sua resposta: {userAns || '—'} {isCorrect ? '(correta)' : '(incorreta)'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm">
                        Resposta correta: <span className="font-semibold">{correct}</span>
                      </p>
                    )}
                    {ex.explanation && (
                      <p className="text-sm text-muted-foreground">Explicação: {ex.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};