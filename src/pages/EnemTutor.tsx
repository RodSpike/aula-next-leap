import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Loader2, BookOpen, GraduationCap, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const enemSubjects = [
  { value: 'all', label: 'Todas as Matérias', icon: BookOpen },
  { value: 'portugues', label: 'Português e Literatura', icon: BookOpen },
  { value: 'redacao', label: 'Redação', icon: BookOpen },
  { value: 'matematica', label: 'Matemática', icon: GraduationCap },
  { value: 'fisica', label: 'Física', icon: GraduationCap },
  { value: 'quimica', label: 'Química', icon: GraduationCap },
  { value: 'biologia', label: 'Biologia', icon: GraduationCap },
  { value: 'historia', label: 'História', icon: Award },
  { value: 'geografia', label: 'Geografia', icon: Award },
  { value: 'filosofia', label: 'Filosofia', icon: Award },
  { value: 'sociologia', label: 'Sociologia', icon: Award },
  { value: 'ingles', label: 'Inglês', icon: BookOpen },
  { value: 'espanhol', label: 'Espanhol', icon: BookOpen },
];

export default function EnemTutor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set welcome message
    const urlSubject = searchParams.get('subject');
    const mistakesCount = searchParams.get('mistakes');
    
    let welcomeContent = `Olá! Sou seu tutor especializado em ENEM e vestibulares brasileiros! 🎓

Estou aqui para ajudá-lo a dominar todas as matérias cobradas nas provas mais importantes do Brasil. Posso ajudar com:

📚 **Todas as Matérias do ENEM:**
- Linguagens (Português, Literatura, Inglês, Espanhol)
- Matemática (Álgebra, Geometria, Estatística)
- Ciências da Natureza (Física, Química, Biologia)
- Ciências Humanas (História, Geografia, Filosofia, Sociologia)
- Redação (estrutura, competências, proposta de intervenção)

💡 **O que posso fazer por você:**
- Explicar conteúdos difíceis com exemplos práticos
- Dar dicas de memorização e técnicas de estudo
- Mostrar questões recorrentes do ENEM
- Ajudar com estratégias de prova
- Revisar e corrigir redações
- Ensinar métodos de organização (mapas mentais, flashcards, etc.)`;

    if (urlSubject && mistakesCount) {
      const subjectName = enemSubjects.find(s => s.value === urlSubject)?.label || urlSubject;
      welcomeContent = `Olá! Vi que você acabou de fazer o simulado de **${subjectName}** e errou ${mistakesCount} questão(ões). 📊

Não se preocupe! Erros são parte fundamental do aprendizado. Vamos trabalhar juntos para reforçar esses conceitos.

💪 **Como posso ajudá-lo:**
- Explicar os conceitos que geraram dúvidas
- Dar técnicas de memorização específicas para ${subjectName}
- Mostrar macetes para questões similares no ENEM
- Criar um plano de estudo focado nos seus pontos fracos

**Sobre o que você gostaria de conversar primeiro?** Pode me perguntar sobre qualquer tópico de ${subjectName} ou sobre os erros que você cometeu no simulado.`;
      
      if (urlSubject !== 'all') {
        setSelectedSubject(urlSubject);
      }
    }

    const welcomeMessage: Message = {
      id: 'welcome',
      content: welcomeContent,
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [searchParams]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para usar o tutor ENEM.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('enem-tutor-chat', {
        body: {
          messages: conversationMessages,
          subject: selectedSubject !== 'all' ? enemSubjects.find(s => s.value === selectedSubject)?.label : null
        }
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                Tutor ENEM & Vestibulares
              </h1>
              <p className="text-muted-foreground mt-2">
                Seu assistente de IA especializado em preparação para ENEM e vestibulares brasileiros
              </p>
            </div>
            <Badge variant="outline" className="h-fit">
              <Award className="h-4 w-4 mr-1" />
              Admin Beta
            </Badge>
          </div>

          {/* Subject Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">
              Matéria:
            </label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enemSubjects.map((subject) => {
                  const Icon = subject.icon;
                  return (
                    <SelectItem key={subject.value} value={subject.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {subject.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Conversa com o Tutor
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none dark:prose-invert ${
                    message.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-background/50 px-1 py-0.5 rounded text-sm">{children}</code>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua pergunta sobre ENEM, redação, matérias..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}