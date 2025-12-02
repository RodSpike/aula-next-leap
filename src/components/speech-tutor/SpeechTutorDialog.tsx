import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConversationStatus, TranscriptEntry } from '@/types/speech-tutor';
import { StatusIndicator } from './StatusIndicator';
import { TranscriptItem } from './TranscriptItem';
import { AlertCircle, Mic, Square, Volume2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

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
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.Idle);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  // Scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

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
      
      // Try to detect language and set appropriate voice
      const isPtBr = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(text) || 
                     /\b(você|não|sim|muito|obrigado|bom|dia|olá)\b/i.test(text);
      
      utterance.lang = isPtBr ? 'pt-BR' : 'en-US';
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith(isPtBr ? 'pt' : 'en') && 
        (v.name.includes('Google') || v.name.includes('Microsoft') || v.localService)
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.9;
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
  }, []);

  // Process user speech with Lovable AI
  const processWithAI = useCallback(async (userText: string) => {
    setIsProcessing(true);
    
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

      const aiResponse = data?.response || 'Desculpe, não consegui processar. Tente novamente.';
      
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

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR'; // Start with Portuguese, handles English too
    
    recognition.onstart = () => {
      setStatus(ConversationStatus.Listening);
      setErrorMessage('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result.isFinal) {
        const text = result[0].transcript;
        console.log('[Speech Tutor] Recognized:', text);
        processWithAI(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech Tutor] Recognition error:', event.error);
      if (event.error === 'no-speech') {
        setErrorMessage('Não detectei sua voz. Tente novamente.');
      } else if (event.error === 'audio-capture') {
        setErrorMessage('Microfone não encontrado. Verifique as permissões.');
      } else if (event.error === 'not-allowed') {
        setErrorMessage('Permissão de microfone negada. Habilite nas configurações do navegador.');
      }
      setStatus(ConversationStatus.Error);
    };

    recognition.onend = () => {
      if (!isProcessing && !isSpeaking) {
        setStatus(ConversationStatus.Idle);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [getSpeechRecognition, processWithAI, isProcessing, isSpeaking]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    setStatus(ConversationStatus.Idle);
    setIsProcessing(false);
    setIsSpeaking(false);
  }, []);

  // Handle main button click
  const handleControlClick = () => {
    if (status === ConversationStatus.Listening || isProcessing || isSpeaking) {
      stopListening();
    } else {
      startListening();
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
      return { icon: <Loader2 className="h-5 w-5 animate-spin" />, label: 'Processando...', variant: 'secondary' as const, disabled: true };
    }
    if (isSpeaking) {
      return { icon: <Volume2 className="h-5 w-5" />, label: 'Falando...', variant: 'secondary' as const, disabled: false };
    }
    if (status === ConversationStatus.Listening) {
      return { icon: <Square className="h-4 w-4" />, label: 'Parar', variant: 'destructive' as const, disabled: false };
    }
    return { icon: <Mic className="h-5 w-5" />, label: 'Falar', variant: 'default' as const, disabled: false };
  };

  const buttonConfig = getButtonConfig();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Tutor de Pronúncia Bilíngue
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="flex flex-col gap-4">
            <div className="p-6 bg-card rounded-lg border space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Pratique sua Pronúncia</h3>
                <p className="text-sm text-muted-foreground">
                  Fale frases em português, inglês ou misture os dois! O tutor vai repetir com a pronúncia correta e dar dicas.
                </p>
              </div>

              <StatusIndicator status={status} />

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

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Exemplos para tentar:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>"Hello, how are you?"</li>
                  <li>"Olá, tudo bem?"</li>
                  <li>"I want to learn português"</li>
                  <li>"Eu gosto de coffee"</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">💡 Dica</p>
              <p className="text-muted-foreground">
                Clique em "Falar" e diga uma frase. O tutor vai ouvir, processar e responder com feedback de pronúncia.
              </p>
            </div>
          </div>

          {/* Right Panel - Transcript */}
          <div className="flex flex-col border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/50 border-b">
              <h3 className="font-semibold">Conversa</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {transcript.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Clique em "Falar" para começar</p>
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
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
