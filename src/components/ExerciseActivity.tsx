import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { ExerciseMascotFeedback } from "@/components/mascot/ExerciseMascotFeedback";
import { CelebrationMascot, useCelebration } from "@/components/mascot/CelebrationMascot";

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
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const { addXP, updateAchievement } = useGamification();
  const { celebration, celebrate, closeCelebration } = useCelebration();

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentExercise] = answer;
    setUserAnswers(newAnswers);
  };

  const checkCurrentAnswer = () => {
    const currentAnswer = userAnswers[currentExercise];
    const exercise = exercises[currentExercise];
    const correct = exercise.correct_answer ?? '';
    const hasOptions = Array.isArray(exercise.options) && exercise.options.length > 0;
    const isCorrect = hasOptions
      ? currentAnswer === correct
      : (currentAnswer || '').trim().toLowerCase() === correct.trim().toLowerCase();
    
    setLastAnswerCorrect(isCorrect);
    setShowAnswerFeedback(true);
    
    return isCorrect;
  };

  const nextExercise = async () => {
    // Check answer and show feedback
    const isCorrect = checkCurrentAnswer();
    
    // Wait for feedback animation before proceeding
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowAnswerFeedback(false);
    setLastAnswerCorrect(null);
    
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
      
      // Check for perfect score achievement and show celebration
      if (score === totalPoints) {
        await updateAchievement('perfect_score');
        await updateAchievement('perfectionist');
        celebrate('perfect_score', 'PONTUAÇÃO PERFEITA!', `Você acertou todas as ${totalPoints} questões!`);
      } else if (score >= totalPoints * 0.7) {
        celebrate('achievement', 'MUITO BEM!', `Você acertou ${score}/${totalPoints} questões!`);
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
    <>
      {/* Celebration Modal */}
      {celebration && (
        <CelebrationMascot 
          type={celebration.type}
          title={celebration.title}
          subtitle={celebration.subtitle}
          onClose={closeCelebration}
        />
      )}

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
              {/* Mascot Feedback */}
              <div className="flex justify-center mb-4">
                <ExerciseMascotFeedback 
                  isCorrect={showAnswerFeedback ? lastAnswerCorrect : null}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-lg">{exercise.question}</p>
              </div>

              {exercise.options && exercise.options.length > 0 ? (
                <RadioGroup 
                  value={userAnswers[currentExercise]} 
                  onValueChange={handleAnswer}
                  className="space-y-2"
                  disabled={showAnswerFeedback}
                >
                  {exercise.options.map((option, index) => {
                    const isSelected = userAnswers[currentExercise] === option;
                    const isCorrectOption = showAnswerFeedback && option === exercise.correct_answer;
                    const isWrongSelection = showAnswerFeedback && isSelected && !lastAnswerCorrect;
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 ${
                          isCorrectOption ? 'bg-green-500/20 border-2 border-green-500' :
                          isWrongSelection ? 'bg-red-500/20 border-2 border-red-500' :
                          ''
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                        {isCorrectOption && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {isWrongSelection && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    );
                  })}
                </RadioGroup>
              ) : (
                <Input
                  value={userAnswers[currentExercise]}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Digite sua resposta"
                  disabled={showAnswerFeedback}
                  className={showAnswerFeedback ? (
                    lastAnswerCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                  ) : ''}
                />
              )}

              <Button 
                onClick={nextExercise}
                disabled={!userAnswers[currentExercise] || showAnswerFeedback}
                className="w-full"
              >
                {showAnswerFeedback ? (
                  lastAnswerCorrect ? '✓ Correto!' : '✗ Incorreto...'
                ) : (
                  currentExercise === exercises.length - 1 ? 'Finalizar' : 'Próximo'
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              {/* Final Results with Mascot */}
              <div className="flex justify-center">
                <ExerciseMascotFeedback 
                  isComplete={true}
                  score={score}
                  total={exercises.length}
                />
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold">Pontuação: {score}/{exercises.length}</h3>
                <p className="text-muted-foreground">Revise suas respostas abaixo</p>
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
                    <div key={idx} className={`p-3 rounded-md border-2 transition-all ${
                      isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
                    }`}>
                      <p className="font-medium">{idx + 1}. {ex.question}</p>
                      <p className={`text-sm flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        Sua resposta: {userAns || '—'} {isCorrect ? '(correta)' : '(incorreta)'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm">
                          Resposta correta: <span className="font-semibold text-green-600">{correct}</span>
                        </p>
                      )}
                      {ex.explanation && (
                        <p className="text-sm text-muted-foreground mt-1">💡 {ex.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};