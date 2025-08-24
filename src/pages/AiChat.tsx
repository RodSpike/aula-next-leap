import { useState, useRef, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Loader2, MessageSquare, Maximize, Minimize, X, Mic, MicOff, Upload, FileText, Play, Pause, Square, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    currentAudio: null,
    messageId: null,
    speed: 1.0,
    usingSynth: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
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
        .from('chat_messages')
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      setRecordingCanceled(false);
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (!recordingCanceled && chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          await processVoiceInput(audioBlob);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar o microfone. Verifique as permissões.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    setRecordingCanceled(true);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (error) throw error;
        
        if (data?.text) {
          setInputMessage(data.text);
          toast({
            title: 'Sucesso',
            description: 'Áudio convertido para texto!',
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao processar o áudio. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type and size (max 10MB)
      const allowedTypes = ['text/plain', 'application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Erro',
          description: 'Tipo de arquivo não suportado. Use: texto, PDF ou imagens.',
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

      // If it's a PDF, extract text using OCR
      if (file.type === 'application/pdf') {
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
            setInputMessage(`Por favor, analise e corrija este texto extraído do PDF "${file.name}":\n\n${data.text}`);
            toast({
              title: 'Sucesso',
              description: 'Texto extraído do PDF com sucesso!',
            });
          } else {
            throw new Error('Não foi possível extrair texto do PDF');
          }
        } catch (error) {
          console.error('Error processing PDF:', error);
          toast({
            title: 'Erro',
            description: 'Falha ao processar o PDF. Tente novamente.',
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
      // Stop any currently playing audio
      if (audioState.currentAudio) {
        audioState.currentAudio.pause();
        audioState.currentAudio.currentTime = 0;
      }

      setAudioState(prev => ({ ...prev, isPlaying: true, isPaused: false, messageId, speed }));

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, speed }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setAudioState(prev => ({ 
            ...prev, 
            isPlaying: false, 
            isPaused: false, 
            currentAudio: null, 
            messageId: null 
          }));
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setAudioState(prev => ({ 
            ...prev, 
            isPlaying: false, 
            isPaused: false, 
            currentAudio: null, 
            messageId: null 
          }));
          URL.revokeObjectURL(audioUrl);
        };

        setAudioState(prev => ({ ...prev, currentAudio: audio }));
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing AI response:', error);
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false, 
        currentAudio: null, 
        messageId: null 
      }));
      toast({
        title: 'Erro',
        description: 'Falha ao reproduzir áudio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const pauseAudio = () => {
    if (audioState.currentAudio) {
      audioState.currentAudio.pause();
      setAudioState(prev => ({ ...prev, isPaused: true }));
    }
  };

  const resumeAudio = () => {
    if (audioState.currentAudio) {
      audioState.currentAudio.play();
      setAudioState(prev => ({ ...prev, isPaused: false }));
    }
  };

  const stopAudio = () => {
    if (audioState.currentAudio) {
      audioState.currentAudio.pause();
      audioState.currentAudio.currentTime = 0;
    }
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      currentAudio: null, 
      messageId: null 
    }));
  };

  const changeSpeed = (speed: number) => {
    if (audioState.currentAudio) {
      audioState.currentAudio.playbackRate = speed;
    }
    setAudioState(prev => ({ ...prev, speed }));
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
        if (data.error.includes('Gemini API key')) {
          errorMessage = 'Serviço de IA está temporariamente indisponível. Tente novamente mais tarde.';
        } else if (data.error.includes('Gemini API error')) {
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
            <div className="space-y-4 p-4">
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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Audio controls for AI messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                          {audioState.isPlaying && audioState.messageId === message.id ? (
                            <div className="flex items-center gap-2">
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
                                {[1, 1.5, 2].map((speed) => (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playAIResponse(message.id, message.content)}
                              className="h-6 w-6 p-0"
                              title="Ouvir resposta"
                            >
                              <Volume2 className="h-3 w-3" />
                            </Button>
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
          
          {/* Voice Recording Modal */}
          {isRecording && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-80 p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Gravando áudio...</h3>
                  <p className="text-sm text-muted-foreground">
                    Fale claramente. O áudio será convertido em texto e enviado para o IA.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={cancelRecording}>
                      Cancelar
                    </Button>
                    <Button onClick={stopRecording}>
                      Enviar
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
            
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem aqui... (pressione Enter para enviar)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isRecording}
                className="flex-1"
                autoFocus
              />
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.pdf,.jpg,.jpeg,.png,.gif"
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
                title="Anexar arquivo"
              >
                <Upload className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={startRecording}
                disabled={isLoading || isRecording}
                title="Gravar áudio"
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading || isRecording}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Faça perguntas, grave áudio, ou envie arquivos (incluindo PDFs) para análise! Use Enter para enviar.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}