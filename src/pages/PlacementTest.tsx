import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, BookOpen, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Question {
  question: string;
  options: string[];
  level: string;
  questionNumber: number;
}

interface FinalAssessment {
  finalAssessment: true;
  level: string;
  explanation: string;
}

const PlacementTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [finalResult, setFinalResult] = useState<FinalAssessment | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const startTest = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to take the placement test",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cambridge-placement-test', {
        body: { action: 'start' }
      });

      if (error) throw error;

      setCurrentQuestion(data);
      setTestStarted(true);
    } catch (error) {
      console.error('Error starting test:', error);
      toast({
        title: "Error",
        description: "Failed to start the placement test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cambridge-placement-test', {
        body: { 
          action: 'next',
          userId: user.id,
          userAnswer: selectedAnswer,
          questionIndex: currentQuestion.questionNumber
        }
      });

      if (error) throw error;

      if (data.finalAssessment) {
        setFinalResult(data);
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(data);
      }
      
      setSelectedAnswer("");
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Cambridge English Placement Test</CardTitle>
            <CardDescription className="text-lg">
              Discover your English proficiency level with our AI-powered assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">What to expect:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 10 questions testing grammar, vocabulary, and comprehension</li>
                <li>• Adaptive difficulty based on your performance</li>
                <li>• Instant results with your Cambridge level (A1-C2)</li>
                <li>• Takes approximately 10-15 minutes</li>
              </ul>
            </div>
            <Button 
              onClick={startTest} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Test...
                </>
              ) : (
                "Start Placement Test"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Test Complete!</CardTitle>
            <CardDescription>Your Cambridge English level has been determined</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="p-6 bg-primary/5 rounded-lg">
              <h3 className="text-2xl font-bold text-primary mb-2">
                Your Level: {finalResult.level}
              </h3>
              <p className="text-muted-foreground">{finalResult.explanation}</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/community")} className="flex-1">
                Join Community Groups
              </Button>
              <Button onClick={() => navigate("/ai-chat")} variant="outline" className="flex-1">
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Question {currentQuestion?.questionNumber}</CardTitle>
            <span className="text-sm text-muted-foreground">
              Level: {currentQuestion?.level}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{currentQuestion?.question}</h3>
            <div className="space-y-2">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedAnswer === option
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <Button 
            onClick={submitAnswer} 
            disabled={!selectedAnswer || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;