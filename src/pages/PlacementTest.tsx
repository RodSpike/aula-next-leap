import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, BookOpen, Award, Users } from "lucide-react";
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
  autoJoinedGroup?: boolean;
  groupLevel?: string;
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
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cambridge-placement-test', {
        body: { action: 'start' }
      });

      console.log('Placement test response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to start placement test');
      }

      if (!data || !data.question) {
        throw new Error('Invalid response from placement test service');
      }

      setCurrentQuestion(data);
      setTestStarted(true);
    } catch (error: any) {
      console.error('Error starting test:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start the placement test. Please try again.",
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

      console.log('Submit answer response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to submit answer');
      }

      if (!data) {
        throw new Error('Invalid response from placement test service');
      }

      if (data.finalAssessment) {
        setFinalResult(data);
        setCurrentQuestion(null);
        
        // Update user profile with the result
        try {
          await supabase
            .from('profiles')
            .update({ cambridge_level: data.level })
            .eq('user_id', user.id);
        } catch (profileError) {
          console.error('Error updating profile:', profileError);
        }
      } else {
        setCurrentQuestion(data);
      }
      
      setSelectedAnswer("");
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit answer. Please try again.",
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
              <p className="text-muted-foreground mb-4">{finalResult.explanation}</p>
              
              {finalResult.autoJoinedGroup && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 font-medium">
                    🎉 You've been automatically added to the {finalResult.level} level community group!
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recommended Next Steps:</h3>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => navigate('/community')}
                  className="bg-primary hover:bg-primary/90 w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Explore Community Groups
                </Button>
                <Button 
                  onClick={() => navigate('/courses')}
                  variant="outline"
                  className="w-full"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse {finalResult.level} Level Courses
                </Button>
              </div>
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