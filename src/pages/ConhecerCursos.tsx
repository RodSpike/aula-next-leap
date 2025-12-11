import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  Users, 
  MessageCircle, 
  Brain, 
  Mic, 
  Award,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { CupheadFoxMascot } from "@/components/mascot/CupheadFoxMascot";

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  lessons?: { id: string }[];
}

const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const getLevelInfo = (level: string) => {
  const info: { [key: string]: { name: string; description: string; color: string } } = {
    A1: { 
      name: 'Iniciante', 
      description: 'Aprenda o básico do inglês: saudações, números, cores e frases simples.',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    A2: { 
      name: 'Básico', 
      description: 'Desenvolva vocabulário do dia a dia e comunicação básica.',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    B1: { 
      name: 'Intermediário', 
      description: 'Expanda sua fluência para situações profissionais e viagens.',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    },
    B2: { 
      name: 'Intermediário Superior', 
      description: 'Comunique-se com confiança em qualquer contexto.',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    C1: { 
      name: 'Avançado', 
      description: 'Domine nuances da língua e expressões idiomáticas.',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    C2: { 
      name: 'Proficiente', 
      description: 'Alcance fluência nativa em qualquer situação.',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    },
  };
  return info[level] || info['A1'];
};

const getLevelIcon = (level: string) => {
  const icons: { [key: string]: any } = {
    'A1': BookOpen,
    'A2': BookOpen, 
    'B1': GraduationCap,
    'B2': GraduationCap,
    'C1': Trophy,
    'C2': Trophy,
  };
  return icons[level] || BookOpen;
};

export default function ConhecerCursos() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: 'Conheça Nossos Cursos de Inglês - Aula Click | A1 ao C2',
    description: 'Descubra os cursos de inglês da Aula Click. Do iniciante ao avançado, aprenda com IA, professores reais e uma comunidade ativa. Comece seu teste grátis!',
    keywords: 'cursos de inglês, inglês online, aprender inglês, curso A1, curso C2, inglês para iniciantes, inglês avançado',
    canonicalPath: '/conhecer-cursos',
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data: coursesData, error } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            level,
            lessons(id)
          `)
          .or('admin_only.is.null,admin_only.eq.false')
          .order('order_index')
          .limit(12);

        if (error) {
          console.error('Error fetching courses:', error);
          return;
        }

        setCourses(coursesData || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const content = (
    <div className="min-h-screen bg-background">
      {/* Only show public Navigation for non-logged users */}
      {!user && <Navigation />}

      {/* Hero Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Cursos Completos do A1 ao C2
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Aprenda Inglês de Forma <span className="text-primary">Inteligente</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cursos estruturados com IA, professores reais e uma comunidade ativa 
              para te ajudar em cada passo da sua jornada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">
                  Já tenho uma conta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Níveis Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Cursos para Todos os Níveis
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Do iniciante ao fluente, temos o curso certo para você. 
              Faça o teste de nivelamento e descubra por onde começar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levelOrder.map((level) => {
              const info = getLevelInfo(level);
              const Icon = getLevelIcon(level);
              const levelCourses = courses.filter(c => c.level === level);
              const lessonCount = levelCourses.reduce((acc, c) => acc + (c.lessons?.length || 0), 0);

              return (
                <Card key={level} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge className={info.color}>
                        Nível {level}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{info.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {info.description}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Play className="h-4 w-4 mr-1" />
                      <span>{lessonCount || '10+'} lições disponíveis</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Por Que Escolher a Aula Click?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Combinamos tecnologia de ponta com suporte humano real para acelerar seu aprendizado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">IA Personalizada</h3>
              <p className="text-sm text-muted-foreground">
                Tutor de IA que se adapta ao seu nível e corrige seus erros em tempo real.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Prática de Fala</h3>
              <p className="text-sm text-muted-foreground">
                Converse com IA para treinar pronúncia e fluência no seu ritmo.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Professores Reais</h3>
              <p className="text-sm text-muted-foreground">
                Professores sempre disponíveis na comunidade para tirar dúvidas.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Comunidade Ativa</h3>
              <p className="text-sm text-muted-foreground">
                Conecte-se com outros alunos e pratique inglês juntos.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Professores Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                Suporte Humano Real
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Professores Sempre Presentes
              </h2>
              <p className="text-muted-foreground mb-6">
                Diferente de outros apps, na Aula Click você não está sozinho. 
                Nossos professores estão sempre ativos na comunidade para:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Tirar dúvidas sobre gramática e vocabulário</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Corrigir textos e explicar erros comuns</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Criar desafios e atividades em grupo</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Motivar e acompanhar seu progresso</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl"></div>
                <Card className="relative p-8 text-center">
                  <CupheadFoxMascot mood="happy" size="lg" />
                  <h3 className="font-semibold text-lg mt-4">Clicky e a equipe</h3>
                  <p className="text-sm text-muted-foreground">
                    Sempre prontos para ajudar você!
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IA Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Card className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">ClickAI - Seu Tutor Pessoal</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground italic">
                    "I want to practice speaking about my hobbies..."
                  </p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-sm">
                    "Great choice! Let's start with a simple question: What do you like to do in your free time?"
                  </p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Star className="h-3 w-3 text-warning mr-1" />
                  <span>Correções em tempo real • Adaptado ao seu nível</span>
                </div>
              </Card>
            </div>
            <div className="order-1 md:order-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                Inteligência Artificial
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                IA Que Realmente Ensina
              </h2>
              <p className="text-muted-foreground mb-6">
                Nossa IA não é apenas um chatbot. O ClickAI é um tutor inteligente 
                que entende seu nível, corrige seus erros e te desafia a melhorar.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Conversação natural por texto e voz</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Correção de pronúncia e gramática</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <span>Exercícios personalizados para suas dificuldades</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Certificados Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Award className="h-3 w-3 mr-1" />
              Reconhecimento
            </Badge>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Certificados de Conclusão
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ao completar cada nível com 70% ou mais de aproveitamento, 
              você recebe um certificado para comprovar seu progresso.
            </p>
          </div>

          <div className="flex justify-center">
            <Card className="max-w-md p-8 text-center">
              <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-warning" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Certificado Digital</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Baixe em PDF e compartilhe no LinkedIn ou adicione ao seu currículo.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {levelOrder.map((level) => (
                  <Badge key={level} variant="outline">
                    {level}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Pronto para Começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Faça o teste de nivelamento gratuito e descubra seu nível de inglês. 
            Experimente 7 dias grátis!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Fazer Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">
                Entrar na Conta
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  // If user is logged in, wrap with AppLayout to show sidebar and redirect to actual courses
  if (user) {
    return (
      <AppLayout>
        <main className="min-h-screen bg-background">
          {content}
        </main>
      </AppLayout>
    );
  }

  return content;
}
