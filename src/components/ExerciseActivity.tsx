import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  // Filter to keep only multiple choice exercises (exclude fill_blank/open text)
  const multipleChoiceExercises = exercises.filter(ex => {
    const type = ex.type || ex.exercise_type || 'multiple_choice';
    return type === 'multiple_choice' && Array.isArray(ex.options) && ex.options.length > 0;
  });

  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(multipleChoiceExercises.length).fill(''));
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
    
    if (currentExercise < multipleChoiceExercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      setShowResults(true);
      const score = calculateScore();
      const totalPoints = multipleChoiceExercises.length;
      
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
      const correct = multipleChoiceExercises[index]?.correct_answer ?? '';
      const isCorrect = answer === correct;
      return isCorrect ? score + 1 : score;
    }, 0);
  };

  if (!multipleChoiceExercises || multipleChoiceExercises.length === 0) return null;

  const exercise = multipleChoiceExercises[currentExercise];
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
            <Badge variant="outline">{currentExercise + 1} / {multipleChoiceExercises.length}</Badge>
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

              <Button 
                onClick={nextExercise}
                disabled={!userAnswers[currentExercise] || showAnswerFeedback}
                className="w-full"
              >
                {showAnswerFeedback ? (
                  lastAnswerCorrect ? '✓ Correto!' : '✗ Incorreto...'
                ) : (
                  currentExercise === multipleChoiceExercises.length - 1 ? 'Finalizar' : 'Próximo'
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
                  total={multipleChoiceExercises.length}
                />
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold">Pontuação: {score}/{multipleChoiceExercises.length}</h3>
                <p className="text-muted-foreground">Revise suas respostas abaixo</p>
              </div>
              
              <div className="space-y-3">
                {multipleChoiceExercises.map((ex, idx) => {
                  const userAns = userAnswers[idx] || '';
                  const correct = ex.correct_answer || '';
                  const isCorrect = userAns === correct;
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