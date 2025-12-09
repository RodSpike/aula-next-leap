import { Users, BookOpen, Star, MessageSquare, Trophy, Zap } from "lucide-react";
import { useOnlineCounter } from "@/hooks/useOnlineCounter";

export const StatsSection = () => {
  const onlineCount = useOnlineCounter();

  const stats = [
    { 
      icon: Users, 
      label: "Estudantes Ativos", 
      value: "10.000+",
      description: "Aprendendo inglês",
      color: "text-primary"
    },
    { 
      icon: BookOpen, 
      label: "Lições Completadas", 
      value: "500K+",
      description: "Este mês",
      color: "text-secondary"
    },
    { 
      icon: Star, 
      label: "Avaliação", 
      value: "4.9/5",
      description: "500+ reviews",
      color: "text-warning"
    },
    { 
      icon: Trophy, 
      label: "Certificados", 
      value: "2.500+",
      description: "Emitidos",
      color: "text-success"
    },
    { 
      icon: MessageSquare, 
      label: "Comunidade", 
      value: "100+",
      description: "Grupos ativos",
      color: "text-info"
    },
    { 
      icon: Zap, 
      label: "Online Agora", 
      value: `${onlineCount}`,
      description: "Estudando",
      color: "text-orange-500",
      pulse: true
    },
  ];

  return (
    <section className="py-16 bg-card border-y border-border" aria-label="Estatísticas da plataforma">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Junte-se à maior comunidade de inglês do Brasil! 🇧🇷
          </h2>
          <p className="text-muted-foreground">
            Milhares de estudantes já transformaram seu inglês com a Aula Click
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`
                w-14 h-14 mx-auto mb-3 rounded-2xl
                bg-gradient-to-br from-muted to-muted/50
                flex items-center justify-center
                group-hover:scale-110 transition-transform
                ${stat.pulse ? 'animate-pulse' : ''}
              `}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              
              <div className="text-2xl md:text-3xl font-extrabold text-foreground">
                {stat.value}
              </div>
              
              <div className="text-sm font-medium text-foreground">
                {stat.label}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
