import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Trophy } from "lucide-react";

interface Exercise {
  type: 'multiple_choice' | 'fill_blank';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface ExerciseActivityProps {
  exercises: Exercise[];
}

export const ExerciseActivity: React.FC<ExerciseActivityProps> = ({ exercises }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(exercises.length).fill(''));
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentExercise] = answer;
    setUserAnswers(newAnswers);
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, answer, index) => {
      return answer === exercises[index].correct_answer ? score + 1 : score;
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

            <Button 
              onClick={nextExercise}
              disabled={!userAnswers[currentExercise]}
              className="w-full"
            >
              {currentExercise === exercises.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              score >= exercises.length * 0.7 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {score >= exercises.length * 0.7 ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <h3 className="text-xl font-bold">
              Score: {score}/{exercises.length}
            </h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
};