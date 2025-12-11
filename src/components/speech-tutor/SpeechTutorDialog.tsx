import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConversationStatus, TranscriptEntry } from '@/types/speech-tutor';
import { StatusIndicator } from './StatusIndicator';
import { TranscriptItem } from './TranscriptItem';
import { SpeechTutorStats } from './SpeechTutorStats';
import { AlertCircle, Mic, Square, Volume2, Loader2, RotateCcw, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracking } from '@/hooks/useActivityTracking';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechTutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpeechTutorDialog: React.FC<SpeechTutorDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackSpeechTutor } = useActivityTracking();
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.Idle);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTutorResponse, setLastTutorResponse] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [showStats, setShowStats] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('speechTutorRate');
    return saved ? parseFloat(saved) : 0.9;
  });
  const [maxListeningSeconds, setMaxListeningSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('speechTutorTimeout');
    return saved ? parseInt(saved) : 30;
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const messageCountRef = useRef<number>(0);
  const wordsSpokenRef = useRef<number>(0);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('speechTutorRate', speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem('speechTutorTimeout', maxListeningSeconds.toString());
  }, [maxListeningSeconds]);

  // Scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Start a new session when dialog opens
  const startSession = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('speech_tutor_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
          messages_count: 0,
          words_spoken: 0,
          duration_seconds: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      sessionIdRef.current = data.id;
      sessionStartRef.current = new Date();
      messageCountRef.current = 0;
      wordsSpokenRef.current = 0;
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }, [user]);

  // Update session when it ends
  // Update achievements based on cumulative stats
  const updateSpeechTutorAchievements = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get total stats from all sessions
      const { data: sessions, error } = await supabase
        .from('speech_tutor_sessions')
        .select('duration_seconds, messages_count, words_spoken')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const totalSessions = sessions?.length || 0;
      const totalMinutes = Math.floor((sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0) / 60);
      const totalMessages = sessions?.reduce((sum, s) => sum + (s.messages_count || 0), 0) || 0;
      const totalWords = sessions?.reduce((sum, s) => sum + (s.words_spoken || 0), 0) || 0;
      
      // Session-based achievements
      const sessionAchievements = [
        { key: 'speech_first_session', requirement: 1 },
        { key: 'speech_5_sessions', requirement: 5 },
        { key: 'speech_25_sessions', requirement: 25 },
        { key: 'speech_50_sessions', requirement: 50 },
      ];
      
      for (const ach of sessionAchievements) {
        if (totalSessions >= ach.requirement) {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: user.id,
            p_achievement_key: ach.key,
            p_increment: totalSessions
          });
        }
      }
      
      // Time-based achievements (in minutes)
      const timeAchievements = [
        { key: 'speech_10_minutes', requirement: 10 },
        { key: 'speech_30_minutes', requirement: 30 },
        { key: 'speech_60_minutes', requirement: 60 },
        { key: 'speech_180_minutes', requirement: 180 },
        { key: 'speech_300_minutes', requirement: 300 },
      ];
      
      for (const ach of timeAchievements) {
        if (totalMinutes >= ach.requirement) {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: user.id,
            p_achievement_key: ach.key,
            p_increment: totalMinutes
          });
        }
      }
      
      // Message-based achievement
      if (totalMessages >= 100) {
        await supabase.rpc('update_achievement_progress', {
          p_user_id: user.id,
          p_achievement_key: 'speech_100_messages',
          p_increment: totalMessages
        });
      }
      
      // Word-based achievements
      const wordAchievements = [
        { key: 'speech_500_words', requirement: 500 },
        { key: 'speech_1000_words', requirement: 1000 },
      ];
      
      for (const ach of wordAchievements) {
        if (totalWords >= ach.requirement) {
          await supabase.rpc('update_achievement_progress', {
            p_user_id: user.id,
            p_achievement_key: ach.key,
            p_increment: totalWords
          });
        }
      }
    } catch (error) {
      console.error('Error updating achievements:', error);
    }
  }, [user]);

  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !sessionStartRef.current || !user) return;
    
    try {
      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - sessionStartRef.current.getTime()) / 1000);
      
      await supabase
        .from('speech_tutor_sessions')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
          messages_count: messageCountRef.current,
          words_spoken: wordsSpokenRef.current
        })
        .eq('id', sessionIdRef.current);
      
      // Update achievements after session ends
      await updateSpeechTutorAchievements();
      
      sessionIdRef.current = null;
      sessionStartRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [user, updateSpeechTutorAchievements]);

  // Handle dialog open/close
  useEffect(() => {
    if (open && user) {
      startSession();
      trackSpeechTutor('open');
    } else if (!open && sessionIdRef.current) {
      endSession();
      trackSpeechTutor('close', { 
        messagesCount: messageCountRef.current, 
        wordsSpoken: wordsSpokenRef.current 
      });
    }
  }, [open, user, startSession, endSession, trackSpeechTutor]);

  // Check for SpeechRecognition support
  const getSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return null;
    }
    return new SpeechRecognition();
  }, []);

  // Text-to-Speech using browser API
  const speakText = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Always use English voice for fluency practice
      utterance.lang = 'en-US';
      
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Google') || v.name.includes('Microsoft') || v.localService)
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = speechRate;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [speechRate]);

  // Process user speech with Lovable AI
  const processWithAI = useCallback(async (userText: string) => {
    setIsProcessing(true);
    
    // Track words spoken
    const wordCount = userText.split(/\s+/).filter(w => w.length > 0).length;
    wordsSpokenRef.current += wordCount;
    messageCountRef.current += 1;
    
    try {
      // Add user message to transcript
      setTranscript(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
      
      // Update conversation history
      conversationHistoryRef.current.push({ role: 'user', content: userText });

      const { data, error } = await supabase.functions.invoke('speech-tutor-lovable', {
        body: { 
          text: userText,
          conversationHistory: conversationHistoryRef.current
        }
      });

      if (error) throw error;

      const aiResponse = data?.response || 'Sorry, I couldn\'t process that. Please try again.';
      
      // Store last tutor response for replay
      setLastTutorResponse(aiResponse);
      
      // Add AI response to transcript
      setTranscript(prev => [...prev, { role: 'tutor', text: aiResponse, timestamp: Date.now() }]);
      
      // Update conversation history
      conversationHistoryRef.current.push({ role: 'assistant', content: aiResponse });

      // Speak the response
      await speakText(aiResponse);

    } catch (error: any) {
      console.error('[Speech Tutor] AI processing error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao processar sua fala',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [speakText, toast]);

  // Start listening
  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = true; // Keep listening for longer
    recognition.interimResults = true; // Show interim results for feedback
    recognition.lang = 'en-US'; // English only for fluency practice
    
    recognition.onstart = () => {
      console.log('[Speech Tutor] Recognition started');
      setStatus(ConversationStatus.Listening);
      setErrorMessage('');
      
      // Set auto-stop timeout
      listeningTimeoutRef.current = setTimeout(() => {
        console.log('[Speech Tutor] Timeout reached, stopping...');
        recognition.stop();
        setErrorMessage(`Timeout reached (${maxListeningSeconds}s). Click "Speak" to try again.`);
      }, maxListeningSeconds * 1000);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[Speech Tutor] Got result, results length:', event.results.length);
      const lastResult = event.results[event.results.length - 1];
      
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript;
        console.log('[Speech Tutor] Final result:', text);
        setInterimText('');
        // Clear timeout since we got a result
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
          listeningTimeoutRef.current = null;
        }
        // Stop recognition before processing
        recognition.stop();
        processWithAI(text);
      } else {
        // Show interim results for user feedback
        const interim = lastResult[0].transcript;
        console.log('[Speech Tutor] Interim:', interim);
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech Tutor] Recognition error:', event.error);
      if (event.error === 'no-speech') {
        setErrorMessage('No speech detected. Please speak closer to the microphone.');
      } else if (event.error === 'audio-capture') {
        setErrorMessage('Microphone not found. Please check your permissions.');
      } else if (event.error === 'not-allowed') {
        setErrorMessage('Microphone permission denied. Please enable it in browser settings.');
      } else if (event.error === 'aborted') {
        // User or code stopped recognition, not an error
        console.log('[Speech Tutor] Recognition aborted');
      } else {
        setErrorMessage(`Recognition error: ${event.error}`);
      }
      if (event.error !== 'aborted') {
        setStatus(ConversationStatus.Error);
      }
    };

    recognition.onend = () => {
      console.log('[Speech Tutor] Recognition ended');
      // Only reset to idle if we're not processing or speaking
      setStatus(prev => {
        if (prev === ConversationStatus.Listening) {
          return ConversationStatus.Idle;
        }
        return prev;
      });
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      console.log('[Speech Tutor] Recognition.start() called');
    } catch (e) {
      console.error('[Speech Tutor] Failed to start recognition:', e);
      setErrorMessage('Failed to start speech recognition. Please try again.');
      setStatus(ConversationStatus.Error);
    }
  }, [getSpeechRecognition, processWithAI, maxListeningSeconds]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    setStatus(ConversationStatus.Idle);
    setIsProcessing(false);
    setIsSpeaking(false);
    setInterimText('');
  }, []);

  // Handle main button click
  const handleControlClick = () => {
    if (status === ConversationStatus.Listening || isProcessing || isSpeaking) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Replay last tutor response
  const handleReplay = () => {
    if (lastTutorResponse && !isSpeaking && !isProcessing) {
      speakText(lastTutorResponse);
    }
  };

  // Cleanup on unmount or dialog close
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Get button config
  const getButtonConfig = () => {
    if (isProcessing) {
      return { icon: <Loader2 className="h-5 w-5 animate-spin" />, label: 'Processing...', variant: 'secondary' as const, disabled: true };
    }
    if (isSpeaking) {
      return { icon: <Volume2 className="h-5 w-5" />, label: 'Speaking...', variant: 'secondary' as const, disabled: false };
    }
    if (status === ConversationStatus.Listening) {
      return { icon: <Square className="h-4 w-4" />, label: 'Stop', variant: 'destructive' as const, disabled: false };
    }
    return { icon: <Mic className="h-5 w-5" />, label: 'Speak', variant: 'default' as const, disabled: false };
  };

  const buttonConfig = getButtonConfig();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Speech Tutor - Fluência em Inglês
          </DialogTitle>
          <Button
            variant={showStats ? "default" : "outline"}
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? 'Practice' : 'Stats'}
          </Button>
        </DialogHeader>

        {showStats ? (
          <div className="flex-1 overflow-auto p-4">
            <SpeechTutorStats />
          </div>
        ) : (
          <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="flex flex-col gap-4">
            <div className="p-6 bg-card rounded-lg border space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Practice Your English</h3>
                <p className="text-sm text-muted-foreground">
                  Speak freely in English! ClickAI will chat with you, correct your pronunciation, and answer any questions about English.
                </p>
              </div>

              <StatusIndicator status={status} interimText={interimText} maxSeconds={maxListeningSeconds} />

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleControlClick}
                disabled={buttonConfig.disabled}
                variant={buttonConfig.variant}
                size="lg"
                className="w-full gap-2"
              >
                {buttonConfig.icon}
                {buttonConfig.label}
              </Button>

              {lastTutorResponse && (
                <Button
                  onClick={handleReplay}
                  disabled={isSpeaking || isProcessing || status === ConversationStatus.Listening}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Replay last response
                </Button>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Speech speed</span>
                  <span>{speechRate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[speechRate]}
                  onValueChange={(value) => setSpeechRate(value[0])}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Listening timeout</span>
                  <span>{maxListeningSeconds}s</span>
                </div>
                <Slider
                  value={[maxListeningSeconds]}
                  onValueChange={(value) => setMaxListeningSeconds(value[0])}
                  min={10}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>10s</span>
                  <span>30s</span>
                  <span>60s</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Try saying:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>"Hello, how are you today?"</li>
                  <li>"What's the weather like?"</li>
                  <li>"Can you explain the present perfect tense?"</li>
                  <li>"I went to the store yesterday"</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">💡 Tip</p>
              <p className="text-muted-foreground">
                Click "Speak" and say anything in English. ClickAI will chat with you, correct mistakes, and help you improve your fluency!
              </p>
            </div>
          </div>

          {/* Right Panel - Transcript */}
          <div className="flex flex-col border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/50 border-b">
              <h3 className="font-semibold">Conversation</h3>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto max-h-[50vh] scroll-smooth"
            >
              {transcript.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click "Speak" to start practicing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((entry, index) => (
                    <TranscriptItem key={index} entry={entry} />
                  ))}
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processando...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
