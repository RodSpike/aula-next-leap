import { ClickMascot } from "@/components/mascot/ClickMascot";

const steps = [
  {
    number: 1,
    title: "Crie sua conta grátis",
    description: "Leva menos de 1 minuto! Sem cartão de crédito.",
    emoji: "✨",
    mascotMood: "waving" as const
  },
  {
    number: 2,
    title: "Faça o teste de nível",
    description: "Descubra seu nível de inglês e comece no lugar certo.",
    emoji: "🎯",
    mascotMood: "thinking" as const
  },
  {
    number: 3,
    title: "Estude 5 min por dia",
    description: "Lições rápidas que cabem na sua rotina!",
    emoji: "📚",
    mascotMood: "happy" as const
  },
  {
    number: 4,
    title: "Ganhe XP e suba de nível",
    description: "Desbloqueie conquistas e apareça no ranking!",
    emoji: "🏆",
    mascotMood: "celebrating" as const
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-card" aria-label="Como funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm font-medium text-primary">
            <span>🚀</span>
            <span>Super simples de começar</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            Como funciona a 
            <span className="text-secondary"> Aula Click?</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em 4 passos simples você já está aprendendo inglês de verdade! 🎉
          </p>
        </header>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-success -translate-y-1/2 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="flex flex-col items-center text-center space-y-4 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Step number circle */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                    {step.number}
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl">
                    {step.emoji}
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
            ))}
          </div>
        </div>

        {/* Mascot CTA */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <ClickMascot mood="excited" size="lg" message="Bora começar? É grátis! 🎮" />
        </div>
      </div>
    </section>
  );
};
