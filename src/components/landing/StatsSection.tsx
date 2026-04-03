import { Users, BookOpen, Star, MessageSquare, Trophy, Zap } from "lucide-react";
import { useOnlineCounter } from "@/hooks/useOnlineCounter";

export const StatsSection = () => {
  const onlineCount = useOnlineCounter();

  const stats = [
    { icon: Users, label: "Estudantes Ativos", value: "10.000+", description: "Aprendendo inglês", color: "text-primary", bg: "bg-primary/10" },
    { icon: BookOpen, label: "Lições Completadas", value: "500K+", description: "Este mês", color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Star, label: "Avaliação", value: "4.9/5", description: "500+ reviews", color: "text-warning", bg: "bg-warning/10" },
    { icon: Trophy, label: "Certificados", value: "2.500+", description: "Emitidos", color: "text-success", bg: "bg-success/10" },
    { icon: MessageSquare, label: "Comunidade", value: "100+", description: "Grupos ativos", color: "text-info", bg: "bg-info/10" },
    { icon: Zap, label: "Online Agora", value: `${onlineCount}`, description: "Estudando", color: "text-primary", bg: "bg-primary/10", pulse: true },
  ];

  return (
    <section className="py-20 bg-card/50 border-y border-border relative overflow-hidden" aria-label="Estatísticas da plataforma">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--border)/0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground mb-3">
            Junte-se à maior comunidade de inglês do Brasil! 🇧🇷
          </h2>
          <p className="text-muted-foreground text-lg">
            Milhares de estudantes já transformaram seu inglês com a Aula Click
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center group animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`
                w-16 h-16 mx-auto mb-4 rounded-2xl
                ${stat.bg}
                flex items-center justify-center
                group-hover:scale-110 group-hover:shadow-lg transition-all duration-300
                ${stat.pulse ? 'animate-pulse' : ''}
              `}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              
              <div className="text-2xl md:text-3xl font-extrabold text-foreground mb-1 group-hover:scale-105 transition-transform">
                {stat.value}
              </div>
              
              <div className="text-sm font-semibold text-foreground">
                {stat.label}
              </div>
              
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};