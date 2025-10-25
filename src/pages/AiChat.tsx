import { useState, useRef, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPortuguese, hasPortugueseMixed } from "@/utils/portugueseDetection";
import { Send, Bot, User, Loader2, MessageSquare, Maximize, Minimize, X, Mic, MicOff, Upload, FileText, Play, Pause, Square, Volume2, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { EnhancedChatInput } from "@/components/enhanced/EnhancedChatInput";
import { useVoiceRecognition } from "@/components/enhanced/VoiceRecognition";
import { PronunciationEvaluator } from "@/components/PronunciationEvaluator";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentAudio: HTMLAudioElement | null;
  messageId: string | null;
  speed: number;
  usingSynth: boolean;
  selectedVoice: string | null;
}

interface SpeechRecognitionState {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
}

interface TranslationInfo {
  originalText: string;
  translatedText: string;
  hasTranslation: boolean;
}

export default function AiChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCanceled, setRecordingCanceled] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pronunciationMode, setPronunciationMode] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    currentAudio: null,
    messageId: null,
    speed: 1.0,
    usingSynth: false,
    selectedVoice: null,
  });
  const [speechState, setSpeechState] = useState<SpeechRecognitionState>({
    isListening: false,
    interimTranscript: '',
    finalTranscript: '',
  });
  const [translationInfo, setTranslationInfo] = useState<TranslationInfo | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when component mounts
  useEffect(() => {
    if (user && !messagesLoaded) {
      loadMessages();
    }
  }, [user, messagesLoaded]);

  // Initialize speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Set default female English (US) voice
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en-US') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('karen') ||
         voice.name.toLowerCase().includes('susan'))
      ) || voices.find(voice => voice.lang.includes('en-US')) || voices[0];
      
      if (preferredVoice && !audioState.selectedVoice) {
        setAudioState(prev => ({ ...prev, selectedVoice: preferredVoice.name }));
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const translateText = async (text: string): Promise<TranslationInfo> => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text }
      });

      if (error) {
        console.error('Translation error:', error);
        return { originalText: text, translatedText: text, hasTranslation: false };
      }

      return data;
    } catch (error) {
      console.error('Translation error:', error);
      return { originalText: text, translatedText: text, hasTranslation: false };
    }
  };

  // Enhanced voice recognition with better browser compatibility
  const voiceRecognition = useVoiceRecognition({
    onTranscript: async (transcript: string) => {
      setSpeechState(prev => ({ ...prev, finalTranscript: transcript }));
      
      // Check if translation is needed
      if (hasPortugueseMixed(transcript) || detectPortuguese(transcript)) {
        const translationResult = await translateText(transcript);
        setTranslationInfo(translationResult);
      } else {
        setTranslationInfo({ originalText: transcript, translatedText: transcript, hasTranslation: false });
      }
    },
    onError: (error: string) => {
      setSpeechState(prev => ({ ...prev, isListening: false }));
      toast({
        title: 'Voice Recognition Error',
        description: error,
        variant: 'destructive',
      });
    },
    language: 'pt-BR',
    continuous: false
  });

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
      } else {
        // If no messages exist, set welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          content: "Olá! Sou seu tutor de IA personalizado. Estou aqui para ajudá-lo a aprender, responder perguntas e oferecer suporte em seus estudos. No que posso ajudá-lo hoje?",
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoaded(true);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!user || message.id === 'welcome') return;

    try {
      await supabase
        .from('ai_chat_messages')
        .insert({
          user_id: user.id,
          content: message.content,
          role: message.role,
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const startSpeechRecognition = () => {
    if (!voiceRecognition.isSupported) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support speech recognition. You can still type messages normally.',
      });
      return;
    }
    voiceRecognition.startListening();
    setIsRecording(true);
    setSpeechState(prev => ({ ...prev, isListening: true, interimTranscript: '', finalTranscript: '' }));
    setTranslationInfo(null);
  };

  const stopSpeechRecognition = () => {
    voiceRecognition.stopListening();
    setIsRecording(false);
  };

  const cancelSpeechRecognition = () => {
    voiceRecognition.abortListening();
    setSpeechState(prev => ({ ...prev, isListening: false, interimTranscript: '', finalTranscript: '' }));
    setIsRecording(false);
    setTranslationInfo(null);
  };

  const acceptTranscription = () => {
    if (translationInfo) {
      setInputMessage(translationInfo.translatedText);
      setSpeechState(prev => ({ ...prev, finalTranscript: '' }));
      setTranslationInfo(null);
      setIsRecording(false);
    }
  };

  // This function is now handled by speech recognition

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type and size (max 10MB)
      const allowedTypes = [
        'text/plain', 
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword' // .doc
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Erro',
          description: 'Tipo de arquivo não suportado. Use: texto, PDF, imagens, DOC ou DOCX.',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: 'Erro',
          description: 'Arquivo muito grande. O tamanho máximo é 10MB.',
          variant: 'destructive',
        });
        return;
      }

      // If it's a document file, extract text using OCR
      if (file.type === 'application/pdf' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword') {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const { data, error } = await supabase.functions.invoke('pdf-ocr', {
            body: formData
          });
          
          if (error) throw error;
          
          if (data?.text) {
            setUploadedFile(file);
            const fileType = file.type === 'application/pdf' ? 'PDF' : 'documento';
            setInputMessage(`Por favor, analise e corrija este texto extraído do ${fileType} "${file.name}":\n\n${data.text}`);
            toast({
              title: 'Sucesso',
              description: `Texto extraído do ${fileType} com sucesso!`,
            });
          } else {
            throw new Error(`Não foi possível extrair texto do ${file.type === 'application/pdf' ? 'PDF' : 'documento'}`);
          }
        } catch (error) {
          console.error('Error processing document:', error);
          toast({
            title: 'Erro',
            description: 'Falha ao processar o documento. Tente novamente.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setUploadedFile(file);
        setInputMessage(`Arquivo anexado: ${file.name}. Por favor, analise este arquivo e forneça feedback ou sugestões.`);
      }
    }
  };

  const processFileWithMessage = async (file: File, message: string) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve({
          content: reader.result,
          type: file.type,
          name: file.name
        });
      };
      reader.onerror = reject;
      
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const playAIResponse = async (messageId: string, text: string, speed: number = 1.0) => {
    try {
      setAudioState(prev => ({ ...prev, isPlaying: true, isPaused: false, messageId, speed, usingSynth: true }));

      // Get language segments
      toast({ title: 'Detecting languages...', description: 'Preparing audio' });
      
      const { data, error } = await supabase.functions.invoke('intelligent-text-to-speech', {
        body: { text }
      });

      if (error || !data?.segments) {
        throw new Error('Failed to detect language segments');
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      // Speak each segment with appropriate voice
      const speakSegments = async (segments: any[], index: number = 0) => {
        if (index >= segments.length) {
          setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: false, messageId: null, usingSynth: false }));
          return;
        }

        const segment = segments[index];
        const utterance = new SpeechSynthesisUtterance(segment.text);
        
        // Find appropriate voice for language
        const voices = speechSynthesis.getVoices();
        const voice = segment.language === 'pt-BR'
          ? voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR')) || voices.find(v => v.lang.startsWith('pt'))
          : voices.find(v => v.lang.includes('en-US') || v.lang.includes('en_US')) || voices.find(v => v.lang.startsWith('en'));
        
        if (voice) utterance.voice = voice;
        utterance.lang = segment.language;
        utterance.rate = speed;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => speakSegments(segments, index + 1);
        utterance.onerror = () => {
          setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: false, currentAudio: null, messageId: null, usingSynth: false }));
          toast({ title: 'Erro', description: 'Falha ao reproduzir áudio.', variant: 'destructive' });
        };

        synthUtteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      };

      // Load voices if needed
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          speechSynthesis.onvoiceschanged = resolve;
        });
      }

      speakSegments(data.segments);

    } catch (error) {
      console.error('Error playing AI response:', error);
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false, 
        currentAudio: null, 
        messageId: null,
        usingSynth: false
      }));
      toast({
        title: 'Erro',
        description: 'Falha ao reproduzir áudio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const pauseAudio = () => {
    if (audioState.usingSynth) {
      speechSynthesis.pause();
      setAudioState(prev => ({ ...prev, isPaused: true }));
    }
  };

  const resumeAudio = () => {
    if (audioState.usingSynth) {
      speechSynthesis.resume();
      setAudioState(prev => ({ ...prev, isPaused: false }));
    }
  };

  const stopAudio = () => {
    if (audioState.usingSynth) {
      speechSynthesis.cancel();
    }
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      currentAudio: null, 
      messageId: null,
      usingSynth: false
    }));
  };

  const changeSpeed = (speed: number) => {
    if (audioState.usingSynth && synthUtteranceRef.current) {
      // For speech synthesis, we need to restart with new rate
      const wasPlaying = audioState.isPlaying && !audioState.isPaused;
      if (wasPlaying) {
        stopAudio();
        // We'll need to replay with new speed, but this is a limitation of Web Speech API
      }
    }
    setAudioState(prev => ({ ...prev, speed }));
  };

  const changeVoice = (voiceName: string) => {
    setAudioState(prev => ({ ...prev, selectedVoice: voiceName }));
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    let messageContent = inputMessage;
    let fileData = null;

    // Process file if uploaded
    if (uploadedFile) {
      try {
        fileData = await processFileWithMessage(uploadedFile, inputMessage);
        messageContent = `${inputMessage}\n\n[Arquivo anexado: ${uploadedFile.name}]`;
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao processar o arquivo anexado.',
          variant: 'destructive',
        });
        return;
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setUploadedFile(null);
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage);
    
    // Log AI chat activity
    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action: 'ai_chat_question',
        context: { text_snippet: currentInput.slice(0, 200) }
      });
    } catch (logError) {
      console.error('Failed to log AI chat activity:', logError);
    }

    try {
      const requestBody: any = {
        message: currentInput,
        conversation_history: messages.slice(-10)
      };

      // Add file data if present
      if (fileData) {
        requestBody.file_data = fileData;
      }

      const { data, error } = await supabase.functions.invoke('english-tutor-chat', {
        body: requestBody
      });
      
      if (error) throw error;
      if (data?.error) {
        let errorMessage = 'Algo deu errado com o tutor IA. Tente novamente.';
        if (data.error.includes('OpenAI API key')) {
          errorMessage = 'Serviço de IA está temporariamente indisponível. Tente novamente mais tarde.';
        } else if (data.error.includes('OpenAI API error')) {
          errorMessage = 'Serviço de IA está com problemas. Tente novamente em breve.';
        }
        
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      // Save assistant message
      await saveMessage(assistantMessage);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const details = error?.message || error?.error || 'Unknown error';
      toast({
        title: 'Erro',
        description: `Falha ao obter resposta do tutor IA. ${details}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Ensure input stays focused
  useEffect(() => {
    if (inputRef.current && !isLoading && !isRecording) {
      inputRef.current.focus();
    }
  }, [inputMessage, isLoading, isRecording]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tutor IA Personalizado</h3>
              <p className="text-muted-foreground mb-4">
                Entre para começar seus estudos com seu tutor de IA pessoal.
              </p>
            <Button asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-background" : "min-h-screen bg-background"}>
      {!isFullscreen && <Navigation />}
      
      {!isFullscreen && (
        <section className="bg-gradient-subtle py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <Bot className="h-12 w-12 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Tutor IA Personalizado
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Converse, aprenda e tire suas dúvidas com seu tutor de IA pessoal disponível 24/7.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Chat Interface */}
      <div className={isFullscreen ? "h-full" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        <Card className={`flex flex-col ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat de Aprendizado
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-8 w-8"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
                {isFullscreen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="space-y-4 p-4 pb-8">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`rounded-lg p-3 relative ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}>
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-semibold" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-semibold" {...props} />,
                            p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                            code: ({node, ...props}: any) => props.inline ? (
                              <code className="px-1 py-0.5 rounded bg-accent text-foreground" {...props} />
                            ) : (
                              <code className="block p-3 rounded bg-accent text-foreground overflow-auto" {...props} />
                            )
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Audio controls for AI messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                          {audioState.isPlaying && audioState.messageId === message.id ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {audioState.isPaused ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={resumeAudio}
                                  className="h-6 w-6 p-0"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={pauseAudio}
                                  className="h-6 w-6 p-0"
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={stopAudio}
                                className="h-6 w-6 p-0"
                              >
                                <Square className="h-3 w-3" />
                              </Button>
                              <div className="flex gap-1">
                                {[0.5, 1, 1.5, 2].map((speed) => (
                                  <Button
                                    key={speed}
                                    variant={audioState.speed === speed ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => changeSpeed(speed)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {speed}x
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playAIResponse(message.id, message.content)}
                                className="h-6 w-6 p-0"
                                title="Ouvir resposta"
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                              {availableVoices.length > 0 && (
                                <select
                                  className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
                                  value={audioState.selectedVoice || ''}
                                  onChange={(e) => changeVoice(e.target.value)}
                                  title="Escolher voz"
                                >
                                  {availableVoices
                                    .filter(voice => voice.lang.includes('en-US'))
                                    .map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                      {voice.name.split(' ')[0]} {voice.name.includes('female') || voice.name.toLowerCase().includes('karen') || voice.name.toLowerCase().includes('samantha') || voice.name.toLowerCase().includes('susan') ? '♀' : voice.name.toLowerCase().includes('male') ? '♂' : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">O tutor IA está digitando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          {/* Speech Recognition Modal */}
          {isRecording && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-96 p-6">
                 <div className="text-center space-y-4">
                   <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                     <Mic className="h-8 w-8 text-white" />
                   </div>
                   <h3 className="text-lg font-semibold">Ouvindo...</h3>
                   <p className="text-sm text-muted-foreground">
                     Fale em português ou inglês - a tradução é automática!
                   </p>
                   
                   {speechState.interimTranscript && (
                     <div className="p-3 bg-muted rounded-lg">
                       <p className="text-sm italic text-muted-foreground">{speechState.interimTranscript}</p>
                     </div>
                   )}
                   
                   {translationInfo && (
                     <div className="space-y-3">
                       <div className="p-3 bg-background rounded-lg border">
                         <p className="text-xs text-muted-foreground mb-1">Original:</p>
                         <p className="text-sm">"{translationInfo.originalText}"</p>
                         
                         {translationInfo.hasTranslation && (
                           <>
                             <p className="text-xs text-muted-foreground mt-3 mb-1">Traduzido para inglês:</p>
                             <p className="text-sm font-medium text-primary">"{translationInfo.translatedText}"</p>
                           </>
                         )}
                       </div>
                       
                       <Button onClick={acceptTranscription} className="w-full">
                         Usar {translationInfo.hasTranslation ? 'Tradução' : 'Texto'}
                       </Button>
                     </div>
                   )}
                   
                   <div className="flex gap-2 justify-center">
                     <Button variant="outline" onClick={cancelSpeechRecognition}>
                       Cancelar
                     </Button>
                     <Button onClick={stopSpeechRecognition}>
                       Parar
                     </Button>
                   </div>
                 </div>
              </Card>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            {uploadedFile && (
              <div className="mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{uploadedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <EnhancedChatInput
              value={inputMessage}
              onChange={setInputMessage}
              onSend={sendMessage}
              onFileSelect={(file) => {
                // Create a synthetic event to match the expected signature
                const syntheticEvent = {
                  target: { files: [file] }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileUpload(syntheticEvent);
              }}
              placeholder="Digite sua mensagem aqui... (pressione Enter para enviar)"
              disabled={isLoading || isRecording}
              showVoiceInput={voiceRecognition.isSupported}
              onVoiceStart={startSpeechRecognition}
              onVoiceStop={stopSpeechRecognition}
              isListening={voiceRecognition.isListening}
              className="space-y-3"
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileUpload}
              className="hidden"
            />
            
             <p className="text-xs text-muted-foreground mt-2">
               Faça perguntas em português ou inglês, use reconhecimento de voz automático, ou envie arquivos para análise! Use Enter para enviar.
             </p>
          </div>
        </Card>
      </div>
    </div>
  );
}