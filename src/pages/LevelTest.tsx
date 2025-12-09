import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";

interface LevelTest {
  id: string;
  from_level: string;
  to_level: string;
  questions: TestQuestion[];
}

interface LevelTestFromDB {
  id: string;
  from_level: string;
  to_level: string;
  questions: any;
}

interface TestQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export default function LevelTest() {
  const { fromLevel, toLevel } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<LevelTest | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fromLevel && toLevel && user) {
      fetchLevelTest();
    }
  }, [fromLevel, toLevel, user]);

  const fetchLevelTest = async () => {
    try {
      const { data: testData, error } = await supabase
        .from('level_tests')
        .select('*')
        .eq('from_level', fromLevel)
        .eq('to_level', toLevel)
        .single();

      if (error) throw error;
      
      // Transform the data to match our interfaces
      const dbTest = testData as LevelTestFromDB;
      const parsedQuestions: TestQuestion[] = Array.isArray(dbTest.questions) 
        ? dbTest.questions 
        : JSON.parse(dbTest.questions as string);
      
      const transformedTest: LevelTest = {
        ...dbTest,
        questions: parsedQuestions
      };
      
      setTest(transformedTest);
      setQuestions(parsedQuestions);
      setSelectedAnswers(new Array(parsedQuestions.length).fill(''));
    } catch (error) {
      console.error('Error fetching level test:', error);
      toast({
        title: "Error",
        description: "Failed to load level test.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!test || !user) return;

    const correctAnswers = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index]?.correct_answer ? 1 : 0);
    }, 0);

    const percentage = (correctAnswers / questions.length) * 100;
    const testPassed = percentage >= 70;

    setScore(percentage);
    setPassed(testPassed);
    setTestCompleted(true);

    try {
      // Save test attempt
      const { error: attemptError } = await supabase
        .from('user_test_attempts')
        .insert({
          user_id: user.id,
          test_id: test.id,
          score: percentage,
          passed: testPassed,
          answers: selectedAnswers,
        });

      if (attemptError) throw attemptError;

      if (testPassed) {
        // Update user's Cambridge level
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ cambridge_level: toLevel })
          .eq('user_id', user.id);

        if (profileError) throw profileError;

        // Create certificate
        const { error: certError } = await supabase
          .from('certificates')
          .insert({
            user_id: user.id,
            course_name: `Cambridge English Level ${toLevel}`,
            certificate_type: 'level_advancement',
            issued_date: new Date().toISOString().split('T')[0],
          });

        if (certError) throw certError;

        toast({
          title: "Congratulations!",
          description: `You've advanced to ${toLevel} level and earned a certificate!`,
        });
      } else {
        toast({
          title: "Keep practicing!",
          description: `You scored ${percentage.toFixed(1)}%. You need at least 70% to advance.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "Error",
        description: "Failed to submit test.",
        variant: "destructive",
      });
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading level test...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Level test not available</h1>
            <p className="text-muted-foreground mb-4">
              The level test from {fromLevel} to {toLevel} is not currently available.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!testCompleted ? (
          <div className="space-y-6">
            {/* Test Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6" />
                  <span>Level Advancement Test: {fromLevel} → {toLevel}</span>
                </CardTitle>
                <div className="space-y-2">
                  <Progress 
                    value={((currentQuestionIndex + 1) / questions.length) * 100} 
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>
              </CardHeader>
            </Card>

            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {questions[currentQuestionIndex]?.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswers[currentQuestionIndex]}
                  onValueChange={handleAnswerSelect}
                  className="space-y-4"
                >
                  {questions[currentQuestionIndex]?.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Submit Test' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Test Results */}
            <Card>
              <CardHeader className="text-center">
                <div className={`text-8xl mb-4 ${passed ? 'text-green-600' : 'text-orange-600'}`}>
                  {passed ? '🏆' : '📚'}
                </div>
                <CardTitle className="text-2xl">
                  {passed ? 'Level Advanced!' : 'Keep Learning!'}
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  You scored {score.toFixed(1)}%
                </p>
                {passed && (
                  <div className="flex items-center justify-center space-x-2 text-green-600 mt-4">
                    <Trophy className="h-6 w-6" />
                    <span className="text-lg font-medium">
                      Congratulations! You've advanced to {toLevel} level!
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    {passed ? (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Your Cambridge English level has been updated to <strong>{toLevel}</strong>.
                          A certificate has been added to your profile.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={handleReturnToDashboard}>
                            View Dashboard
                          </Button>
                          <Button variant="outline" onClick={() => navigate('/community')}>
                            Join Community
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          You need at least 70% to advance to the next level. 
                          Keep practicing and try again when you're ready!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={handleReturnToDashboard}>
                            Back to Dashboard
                          </Button>
                          <Button variant="outline" onClick={() => navigate('/courses')}>
                            Browse Courses
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}