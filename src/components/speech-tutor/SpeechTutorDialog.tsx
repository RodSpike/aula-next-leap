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
  const playbackContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const setupAcknowledgedRef = useRef<boolean>(false);
  const intentionalDisconnectRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptBufferRef = useRef<{ input: string; output: string }>({ input: '', output: '' });
  const MAX_RECONNECT_ATTEMPTS = 3;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const stopSession = useCallback(() => {
    console.log('[Speech Tutor] Stopping session...');
    
    // Mark as intentional disconnect
    intentionalDisconnectRef.current = true;
    
    // Clear keepalive
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current);
      keepaliveIntervalRef.current = null;
    }
    
    // Stop WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'User stopped session');
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
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    setupAcknowledgedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setStatus(ConversationStatus.Idle);
  }, []);

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      // Create playback context with 24kHz sample rate (Gemini output rate)
      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Decode base64 to PCM data
      const pcmData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      
      // Create WAV file with proper headers for 24kHz PCM
      const wavData = createWavFile(pcmData, 24000);
      
      // Decode audio data - ensure we have a proper ArrayBuffer
      const arrayBuffer = new ArrayBuffer(wavData.byteLength);
      new Uint8Array(arrayBuffer).set(wavData);
      const audioBuffer = await playbackContextRef.current.decodeAudioData(arrayBuffer);
      
      // Play audio
      const source = playbackContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContextRef.current.destination);
      source.start(0);
      
      console.log('[Speech Tutor] Playing audio response');
    } catch (error) {
      console.error('[Speech Tutor] Error playing audio:', error);
    }
  }, []);

  const createWavFile = (pcmData: Uint8Array, sampleRate: number): Uint8Array => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Copy PCM data
    const wavArray = new Uint8Array(buffer);
    wavArray.set(pcmData, 44);
    
    return wavArray;
  };

  const startSession = useCallback(async () => {
    try {
      setStatus(ConversationStatus.Connecting);
      setErrorMessage('');
      intentionalDisconnectRef.current = false;

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

      // Connect to secure proxy edge function (no API key exposed to frontend)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Use WebSocket protocol and connect to our proxy function
      const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = supabaseUrl.replace(/^https?/, wsProtocol);
      const ws = new WebSocket(`${wsUrl}/functions/v1/speech-tutor-proxy`);
      wsRef.current = ws;

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!setupAcknowledgedRef.current && ws.readyState !== WebSocket.CLOSED) {
          console.error('[Speech Tutor] Connection timeout');
          ws.close();
          throw new Error('Connection timeout - server did not respond');
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        console.log('[Speech Tutor] WebSocket connected');
        
        // Send setup message for Gemini Live v1beta
        const setupMessage = {
          setup: {
            model: 'gemini-2.0-flash-exp',
            generation_config: { response_modalities: ['AUDIO'] },
            system_instruction: {
              parts: [{
                text: 'You are a language tutor specializing in bilingual speech. The user will provide sentences that mix Brazilian Portuguese and English. Your primary function is to repeat these sentences back to the user with a natural and fluent pronunciation, seamlessly switching between the two languages as they appear in the sentence. Be encouraging and supportive.'
              }]
            }
          }
        };
        console.log('[Speech Tutor] Sending setup:', setupMessage);
        ws.send(JSON.stringify(setupMessage));
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Realtime API sends text frames, but guard anyway
          return;
        }
        if (typeof event.data !== 'string') return;

        try {
          const data = JSON.parse(event.data as string);
          // console.log('[Speech Tutor] WS message:', data);

          // Session lifecycle
          if (data.type === 'session.created') {
            clearTimeout(connectionTimeout);
            // Update default session config (audio in/out, VAD, etc.)
            const update = {
              event_id: `evt_${Date.now()}`,
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: { model: 'whisper-1' },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000,
                },
                temperature: 0.8,
                max_response_output_tokens: 'inf',
                instructions:
                  'You are a bilingual (PT-BR + EN) speech tutor. Repeat user sentences with natural pronunciation, switching languages seamlessly. Be encouraging and concise.',
              },
            };
            ws.send(JSON.stringify(update));
            setupAcknowledgedRef.current = true;
            setStatus(ConversationStatus.Listening);
            toast({ title: 'Connected', description: 'Start speaking your mixed-language sentences' });
            return;
          }

          // Audio stream from model (PCM16 base64 @24kHz)
          if (data.type === 'response.audio.delta' && data.delta) {
            await playAudioResponse(data.delta);
            return;
          }

          // Transcripts from model
          if (data.type === 'response.audio_transcript.delta' && data.delta) {
            transcriptBufferRef.current.output += data.delta;
            return;
          }

          // User transcript (if provided by server in future)
          if (data.type === 'conversation.item.input_audio_transcription.completed' && data.transcript) {
            transcriptBufferRef.current.input += data.transcript;
            return;
          }

          // Response done -> flush transcript buffers
          if (data.type === 'response.done') {
            const input = transcriptBufferRef.current.input.trim();
            const output = transcriptBufferRef.current.output.trim();
            if (input || output) {
              setTranscript((prev) => {
                const appended: TranscriptEntry[] = [
                  ...(input ? [{ role: 'user' as const, text: input, timestamp: Date.now() }] : []),
                  ...(output ? [{ role: 'tutor' as const, text: output, timestamp: Date.now() }] : []),
                ];
                return [...prev, ...appended];
              });
            }
            transcriptBufferRef.current = { input: '', output: '' };
            return;
          }
        } catch (err) {
          console.error('[Speech Tutor] Error parsing message', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[Speech Tutor] WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setErrorMessage('Connection error occurred');
        setStatus(ConversationStatus.Error);
      };

      ws.onclose = (event) => {
        console.log('[Speech Tutor] WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          intentional: intentionalDisconnectRef.current
        });
        
        clearTimeout(connectionTimeout);
        
        // Clear keepalive
        if (keepaliveIntervalRef.current) {
          clearInterval(keepaliveIntervalRef.current);
          keepaliveIntervalRef.current = null;
        }

        // If intentional disconnect, do nothing (user stopped it)
        if (intentionalDisconnectRef.current) {
          console.log('[Speech Tutor] Intentional disconnect, cleaning up');
          return;
        }

        // Handle unexpected disconnect
        const isNormalClose = event.code === 1000;
        const isAbnormalClose = event.code === 1006;
        
        if (!isNormalClose) {
          console.error('[Speech Tutor] Unexpected disconnect:', event.code, event.reason);
          
          // Improve error message for model/API version issues
          if (event.code === 1008 && event.reason.includes('not found for API version')) {
            setErrorMessage('The speech model is incompatible. Please refresh and try again.');
            setStatus(ConversationStatus.Error);
            stopSession();
            return;
          }
          
          // Attempt reconnection if we haven't exceeded max attempts
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 5000);
            
            setErrorMessage(`Connection lost. Reconnecting in ${delay/1000}s... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            setStatus(ConversationStatus.Error);
            
            setTimeout(() => {
              console.log(`[Speech Tutor] Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
              startSession();
            }, delay);
          } else {
            setErrorMessage('Connection lost. Maximum reconnection attempts reached.');
            setStatus(ConversationStatus.Error);
            stopSession();
            
            toast({
              title: 'Connection Failed',
              description: 'Unable to maintain connection to the server. Please try again.',
              variant: 'destructive',
            });
          }
        }
      };

      // Process audio - only send after setup is acknowledged
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN && setupAcknowledgedRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = float32ToPcm16(inputData);
          const base64Audio = arrayBufferToBase64(pcmData);

          // Send with correct shape expected by Gemini Live API
          ws.send(JSON.stringify({
            realtimeInput: {
              audio: {
                data: base64Audio,
                mimeType: 'audio/pcm;rate=16000'
              }
            }
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (error: any) {
      console.error('[Speech Tutor] Error starting session:', error);
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
      <DialogContent aria-describedby="speech-tutor-desc" className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Bilingual Speech Tutor
          </DialogTitle>
        </DialogHeader>
        <p id="speech-tutor-desc" className="sr-only">Real-time bilingual speech tutor with voice input and audio responses.</p>

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
