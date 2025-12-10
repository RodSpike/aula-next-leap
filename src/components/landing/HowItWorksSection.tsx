import { CupheadFoxMascot } from "@/components/mascot/CupheadFoxMascot";
import { UserPlus, Target, BookOpen, TrendingUp } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Crie sua conta grátis",
    description: "Cadastro rápido, sem cartão de crédito. Acesso imediato à plataforma.",
    icon: UserPlus,
  },
  {
    number: 2,
    title: "Faça o teste de nível",
    description: "Descubra seu nível de inglês e receba um plano de estudos personalizado.",
    icon: Target,
  },
  {
    number: 3,
    title: "Estude no seu ritmo",
    description: "Lições interativas, exercícios práticos e suporte de IA e professores.",
    icon: BookOpen,
  },
  {
    number: 4,
    title: "Acompanhe seu progresso",
    description: "Veja sua evolução com métricas claras e conquistas motivadoras.",
    icon: TrendingUp,
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-card" aria-label="Como funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm font-medium text-primary">
            <span>Simples de começar</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            Como funciona a 
            <span className="text-secondary"> Aula Click?</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em 4 passos simples você começa sua jornada de aprendizado
          </p>
        </header>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-success -translate-y-1/2 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={step.number}
                  className="flex flex-col items-center text-center space-y-4 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Step number circle */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-card rounded-2xl p-6 border border-border shadow-md hover:shadow-lg transition-shadow w-full">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle mascot CTA */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 bg-card/50 rounded-2xl p-6 border border-border max-w-2xl mx-auto">
          <CupheadFoxMascot mood="happy" size="sm" />
          <div className="text-center sm:text-left">
            <p className="font-semibold text-foreground">
              Clicky vai te acompanhar em toda sua jornada!
            </p>
            <p className="text-sm text-muted-foreground">
              Seu assistente virtual para dúvidas, prática e motivação.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
