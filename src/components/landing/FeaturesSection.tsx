import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Trophy,
  Flame,
  Target,
  Gamepad2,
  Mic,
  Award,
  GraduationCap,
  Headphones,
  Video
} from "lucide-react";
import { GamifiedFeatureCard } from "./GamifiedFeatureCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const FeaturesSection = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: BookOpen,
      title: "Cursos do A1 ao C2",
      description: "Lições curtas e interativas que se adaptam ao seu ritmo. Aprenda vocabulário, gramática e conversação!",
      color: "primary" as const,
      badge: "Novo!",
    },
    {
      icon: Gamepad2,
      title: "Aprenda Jogando",
      description: "Exercícios gamificados, pontos de XP e recompensas que tornam o aprendizado viciante!",
      color: "success" as const,
      badge: "⭐ Popular",
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Conecte-se com outros estudantes, pratique inglês em grupo e faça amigos de todo Brasil!",
      color: "secondary" as const,
    },
    {
      icon: MessageSquare,
      title: "Tutor com IA",
      description: "Seu assistente pessoal 24/7 para tirar dúvidas, praticar conversação e corrigir pronúncia!",
      color: "info" as const,
      badge: "🤖 IA",
    },
    {
      icon: Trophy,
      title: "Click da Semana",
      description: "Desafio semanal de inglês! Responda perguntas, ganhe XP e apareça no ranking dos melhores!",
      color: "warning" as const,
      badge: "🏆",
    },
    {
      icon: Mic,
      title: "Tutor de Fala",
      description: "Pratique sua pronúncia com feedback em tempo real e melhore seu speaking naturalmente!",
      color: "primary" as const,
    },
    {
      icon: Flame,
      title: "Sequência de Dias",
      description: "Mantenha sua sequência estudando todo dia! Quanto mais dias seguidos, mais bônus você ganha!",
      color: "warning" as const,
    },
    {
      icon: Target,
      title: "Metas Diárias",
      description: "Defina suas metas de estudo e acompanhe seu progresso com gráficos e estatísticas!",
      color: "success" as const,
    },
    {
      icon: Award,
      title: "Certificados",
      description: "Receba certificados oficiais ao completar cada curso e comprove seu conhecimento!",
      color: "info" as const,
      badge: "📜",
    },
    {
      icon: GraduationCap,
      title: "Professores Reais",
      description: "Professores disponíveis nas comunidades para tirar dúvidas e guiar seu aprendizado!",
      color: "secondary" as const,
      badge: "👨‍🏫",
    },
    {
      icon: Headphones,
      title: "Hangout Social",
      description: "Conheça outros alunos e pratique inglês com áudio e texto em tempo real!",
      color: "primary" as const,
      badge: "🎧",
    },
    {
      icon: Video,
      title: "Vídeo Aulas",
      description: "Acesso a vídeo aulas sempre atualizadas para complementar seu aprendizado!",
      color: "warning" as const,
      badge: "🎬",
    },
  ];

  return (
    <section className="py-20 relative" aria-label="Recursos da plataforma">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2 text-sm font-medium text-secondary">
            <span>✨</span>
            <span>Tudo que você precisa em um só lugar</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            Por que a Aula Click é 
            <span className="text-primary"> diferente?</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Combinamos metodologia comprovada, tecnologia de IA e professores reais 
            para um aprendizado eficiente e envolvente.
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <GamifiedFeatureCard {...feature} />
            </div>
          ))}
        </div>

        {/* Bottom CTA - only show for non-logged users */}
        {!user && (
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              E muito mais! Descubra todas as funcionalidades assinando a Aula Click 🚀
            </p>
            <Link 
              to="/signup"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              Assinar Agora
              <span className="text-xl">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
