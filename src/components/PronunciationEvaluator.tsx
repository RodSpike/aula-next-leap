import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Volume2, Loader2, Award, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface PronunciationEvaluatorProps {
  expectedText?: string;
  context?: 'practice' | 'lesson' | 'conversation';
  lessonId?: string;
  onComplete?: (score: number) => void;
}

interface Evaluation {
  pronunciationScore: number;
  grammarScore: number;
  fluencyScore: number;
  overallScore: number;
}

interface Feedback {
  strengths: string[];
  improvements: Array<{
    issue: string;
    example: string;
    tip: string;
  }>;
  grammarIssues: Array<{
    error: string;
    correction: string;
    explanation: string;
  }>;
}

export const PronunciationEvaluator: React.FC<PronunciationEvaluatorProps> = ({
  expectedText,
  context = 'practice',
  lessonId,
  onComplete
}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPlayingCorrection, setIsPlayingCorrection] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correctedText, setCorrectedText] = useState('');
  const [correctedAudio, setCorrectedAudio] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await evaluatePronunciation(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started...', {
        description: 'Speak clearly into your microphone'
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access to use this feature'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsEvaluating(true);
    }
  };

  const evaluatePronunciation = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to process audio');
        }

        const { data, error } = await supabase.functions.invoke('evaluate-pronunciation', {
          body: {
            audio: base64Audio,
            expectedText,
            context,
            lessonId,
            userId: user?.id
          }
        });

        if (error) {
          throw error;
        }

        setTranscription(data.transcription);
        setDetectedLanguage(data.detectedLanguage);
        setEvaluation(data.evaluation);
        setFeedback(data.feedback);
        setCorrectedText(data.correctedText);
        setCorrectedAudio(data.correctedAudio);

        // Auto-play corrected audio using browser TTS
        if (data.correctedText) {
          playCorrection(data.correctedText);
        }

        if (onComplete) {
          onComplete(data.evaluation.overallScore);
        }

        // Show success message
        const scoreMessage = data.evaluation.overallScore >= 80 
          ? 'Excellent pronunciation!' 
          : data.evaluation.overallScore >= 60 
            ? 'Good effort! Keep practicing.' 
            : 'Keep practicing, you\'ll improve!';
        
        toast.success(scoreMessage, {
          description: `Overall score: ${data.evaluation.overallScore}%`
        });
      };
    } catch (error) {
      console.error('Error evaluating pronunciation:', error);
      toast.error('Evaluation failed', {
        description: 'Please try again'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const playCorrection = (text?: string) => {
    const textToSpeak = text || correctedText;
    if (!textToSpeak) return;
    
    setIsPlayingCorrection(true);
    
    // Use browser TTS
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Try to use appropriate voice based on detected language
    const voices = speechSynthesis.getVoices();
    const voice = detectedLanguage === 'pt-BR'
      ? voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR')) || voices.find(v => v.lang.startsWith('pt'))
      : voices.find(v => v.lang.includes('en-US') || v.lang.includes('en_US')) || voices.find(v => v.lang.startsWith('en'));
    
    if (voice) utterance.voice = voice;
    utterance.lang = detectedLanguage || 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity
    
    utterance.onend = () => setIsPlayingCorrection(false);
    utterance.onerror = () => {
      setIsPlayingCorrection(false);
      toast.error('Failed to play correction audio');
    };
    
    audioRef.current = null; // Clear audio ref since we're using speech synthesis
    speechSynthesis.speak(utterance);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Pronunciation Practice
        </CardTitle>
        <CardDescription>
          {expectedText ? `Try saying: "${expectedText}"` : 'Record yourself speaking and get instant feedback'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="flex justify-center">
          {!isRecording && !isEvaluating && !evaluation && (
            <Button
              size="lg"
              onClick={startRecording}
              className="rounded-full h-20 w-20"
            >
              <Mic className="h-8 w-8" />
            </Button>
          )}
          
          {isRecording && (
            <Button
              size="lg"
              onClick={stopRecording}
              variant="destructive"
              className="rounded-full h-20 w-20 animate-pulse"
            >
              <Square className="h-8 w-8" />
            </Button>
          )}
          
          {isEvaluating && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Evaluating pronunciation...</p>
            </div>
          )}
        </div>

        {/* Transcription */}
        {transcription && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">You said:</h3>
              <Badge variant="outline">
                {detectedLanguage === 'pt-BR' ? '🇧🇷 Portuguese' : '🇺🇸 English'}
              </Badge>
            </div>
            <p className="text-sm bg-muted p-3 rounded-lg">{transcription}</p>
          </div>
        )}

        {/* Corrected Version */}
        {correctedText && correctedText !== transcription && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Corrected version:</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => playCorrection()}
                disabled={isPlayingCorrection}
              >
                <Volume2 className="h-4 w-4 mr-1" />
                {isPlayingCorrection ? 'Playing...' : 'Listen'}
              </Button>
            </div>
            <p className="text-sm bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
              {correctedText}
            </p>
          </div>
        )}

        {/* Scores */}
        {evaluation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Pronunciation</span>
                  <span className={`text-sm font-bold ${getScoreColor(evaluation.pronunciationScore)}`}>
                    {evaluation.pronunciationScore}%
                  </span>
                </div>
                <Progress value={evaluation.pronunciationScore} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Grammar</span>
                  <span className={`text-sm font-bold ${getScoreColor(evaluation.grammarScore)}`}>
                    {evaluation.grammarScore}%
                  </span>
                </div>
                <Progress value={evaluation.grammarScore} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Fluency</span>
                  <span className={`text-sm font-bold ${getScoreColor(evaluation.fluencyScore)}`}>
                    {evaluation.fluencyScore}%
                  </span>
                </div>
                <Progress value={evaluation.fluencyScore} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Overall</span>
                  <span className={`text-sm font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}%
                  </span>
                </div>
                <Progress value={evaluation.overallScore} />
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="flex justify-center">
              <Badge variant={getScoreBadgeVariant(evaluation.overallScore)} className="text-lg py-2 px-4">
                <Award className="h-5 w-5 mr-2" />
                Score: {evaluation.overallScore}%
              </Badge>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="space-y-4">
            {/* Strengths */}
            {feedback.strengths.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600 dark:text-green-400">✓ Strengths</h3>
                <ul className="list-disc list-inside space-y-1">
                  {feedback.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {feedback.improvements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Areas for Improvement
                </h3>
                {feedback.improvements.map((improvement, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-sm font-medium">{improvement.issue}</p>
                      {improvement.example && (
                        <p className="text-xs text-muted-foreground italic">{improvement.example}</p>
                      )}
                      <p className="text-xs text-primary">💡 Tip: {improvement.tip}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Grammar Issues */}
            {feedback.grammarIssues.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-600 dark:text-orange-400">📝 Grammar Corrections</h3>
                {feedback.grammarIssues.map((issue, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✗</span>
                        <div className="flex-1">
                          <p className="text-sm line-through text-muted-foreground">{issue.error}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{issue.correction}</p>
                          <p className="text-xs text-muted-foreground mt-1">{issue.explanation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Try Again Button */}
        {evaluation && (
          <Button
            onClick={() => {
              setEvaluation(null);
              setFeedback(null);
              setTranscription('');
              setCorrectedText('');
              setCorrectedAudio('');
            }}
            className="w-full"
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
