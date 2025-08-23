import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Loader2, MessageSquare, Maximize, Minimize, X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function AiChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage);

    try {
      const { data, error } = await supabase.functions.invoke('english-tutor-chat', {
        body: {
          message: inputMessage,
          conversation_history: messages.slice(-10) // Last 10 messages for context
        }
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
                <a href="/login">Entrar</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ChatInterface = () => (
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
                <div className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
      
      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem aqui... (pressione Enter para enviar)"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading}
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
          Faça perguntas sobre qualquer assunto, tire dúvidas ou pratique conversação!
        </p>
      </div>
    </Card>
  );

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
        <ChatInterface />
      </div>
    </div>
  );
}