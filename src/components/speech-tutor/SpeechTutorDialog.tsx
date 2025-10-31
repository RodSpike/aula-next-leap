import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ConversationStatus, TranscriptEntry } from '@/types/speech-tutor';
import { float32ToPcm16, arrayBufferToBase64 } from '@/utils/speechTutorAudio';
import { StatusIndicator } from './StatusIndicator';
import { ControlButton } from './ControlButton';
import { TranscriptItem } from './TranscriptItem';
import { AlertCircle, Github } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SpeechTutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpeechTutorDialog: React.FC<SpeechTutorDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.Idle);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const stopSession = useCallback(() => {
    // Stop WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio processing
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setStatus(ConversationStatus.Idle);
  }, []);

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }

      const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.buffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, []);

  const startSession = useCallback(async () => {
    try {
      setStatus(ConversationStatus.Connecting);
      setErrorMessage('');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      mediaStreamRef.current = stream;

      // Set up audio context
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect WebSocket
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const ws = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send setup message
        ws.send(JSON.stringify({
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
            generation_config: {
              response_modalities: ['AUDIO']
            },
            system_instruction: {
              parts: [{
                text: "You are a language tutor specializing in bilingual speech. The user will provide sentences that mix Brazilian Portuguese and English. Your primary function is to repeat these sentences back to the user with a natural and fluent pronunciation, seamlessly switching between the two languages as they appear in the sentence. Be encouraging and supportive."
              }]
            }
          }
        }));

        setStatus(ConversationStatus.Listening);
        toast({
          title: 'Connected',
          description: 'Start speaking your mixed-language sentences',
        });
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        // Handle server content (audio response)
        if (data.serverContent?.modelTurn?.parts) {
          for (const part of data.serverContent.modelTurn.parts) {
            if (part.inlineData?.data) {
              await playAudioResponse(part.inlineData.data);
            }
            if (part.text) {
              setTranscript(prev => [...prev, {
                role: 'tutor',
                text: part.text,
                timestamp: Date.now()
              }]);
            }
          }
        }

        // Handle turn complete
        if (data.serverContent?.turnComplete) {
          console.log('Turn complete');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrorMessage('Connection error occurred');
        setStatus(ConversationStatus.Error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        stopSession();
      };

      // Process audio
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = float32ToPcm16(inputData);
          const base64Audio = arrayBufferToBase64(pcmData);

          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm',
                data: base64Audio
              }]
            }
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (error: any) {
      console.error('Error starting session:', error);
      setErrorMessage(error.message || 'Failed to start session');
      setStatus(ConversationStatus.Error);
      stopSession();
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to start session',
        variant: 'destructive',
      });
    }
  }, [toast, stopSession, playAudioResponse]);

  const handleControlClick = () => {
    if (status === ConversationStatus.Listening) {
      stopSession();
    } else if (status === ConversationStatus.Idle || status === ConversationStatus.Error) {
      startSession();
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Bilingual Speech Tutor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="flex flex-col gap-4">
            <div className="p-6 bg-card rounded-lg border space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Practice Your Pronunciation</h3>
                <p className="text-sm text-muted-foreground">
                  Speak sentences mixing Brazilian Portuguese and English. The AI tutor will repeat them back with natural pronunciation.
                </p>
              </div>

              <StatusIndicator status={status} />

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <ControlButton status={status} onClick={handleControlClick} />

              <div className="pt-4 border-t text-xs text-muted-foreground">
                <p className="mb-1">Example:</p>
                <p className="italic">"Eu preciso de help com meu projeto"</p>
              </div>
            </div>

            <div className="p-4 bg-accent/30 rounded-lg flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Powered by Gemini</span>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Panel - Transcript */}
          <div className="flex flex-col bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Conversation</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div ref={scrollRef} className="space-y-4">
                {transcript.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-2">No conversation yet</p>
                    <p className="text-sm">Start a session and speak to begin</p>
                  </div>
                ) : (
                  transcript.map((entry, index) => (
                    <TranscriptItem key={index} entry={entry} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
