import { Button } from "@/components/ui/button";
import { Play, ChevronRight, GraduationCap, Users, Bot, BookOpen, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { CupheadFoxMascot } from "@/components/mascot/CupheadFoxMascot";

interface HeroSectionProps {
  hasActiveSubscription?: boolean;
}

export const HeroSection = ({ hasActiveSubscription = false }: HeroSectionProps) => {
  // Only show dashboard link if user has active subscription
  const showDashboardLink = hasActiveSubscription;
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20" aria-label="Seção principal">
      {/* Background decorations - more subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-success/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Badge - more professional */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              <span>Plataforma de Ensino de Inglês</span>
            </div>

            {/* Main Heading - focused on learning */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Aprenda inglês
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]">
                de forma inteligente
              </span>
              <br />
              com a Aula Click
            </h1>

            {/* Subheading - emphasizing real learning with AI + real teachers */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              <strong className="text-foreground">Aprendizado real, para todas as idades.</strong> Combine 
              tecnologia de IA com suporte de professores qualificados em uma 
              metodologia que torna o estudo <span className="text-primary font-semibold">eficiente e envolvente</span>.
            </p>

            {/* Key benefits - professional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3 border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Tutor com IA</p>
                  <p className="text-xs text-muted-foreground">Disponível 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3 border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Professores Reais</p>
                  <p className="text-xs text-muted-foreground">Suporte especializado</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3 border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-success" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Cursos A1 ao C2</p>
                  <p className="text-xs text-muted-foreground">Todos os níveis</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {showDashboardLink ? (
                <Button variant="hero" size="xl" asChild className="group text-lg">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Ir para Dashboard
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="hero" size="xl" asChild className="group text-lg">
                    <Link to="/signup">
                      Começar Teste Grátis
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="xl" asChild className="group">
                    <Link to="/conhecer-cursos">
                      <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Conhecer Cursos
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Social Proof - professional */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">+10.000 estudantes</p>
                <p className="text-sm text-muted-foreground">De todas as idades aprendendo inglês</p>
              </div>
            </div>
          </div>

          {/* Right Content - Mascot smaller and more subtle */}
          <div className="flex-1 flex flex-col items-center gap-6 lg:max-w-md">
            {/* Learning focused card with subtle mascot */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-xl w-full">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0">
                  <CupheadFoxMascot 
                    mood="happy" 
                    size="sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Clicky, seu assistente</p>
                  <p className="text-muted-foreground text-sm">
                    "Olá! Estou aqui para te ajudar a aprender inglês de forma eficiente!"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-foreground text-lg">
                  Por que escolher a Aula Click?
                </h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Metodologia comprovada</strong> que combina teoria e prática
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">IA + Professores reais</strong> para suporte completo
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Aprendizado engajante</strong> com gamificação inteligente
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Para todas as idades</strong> do iniciante ao avançado
                    </p>
                  </li>
                </ul>
              </div>
            </div>

            {/* Stats - professional */}
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-card/80 rounded-xl p-4 text-center border border-border">
                <p className="text-2xl font-bold text-primary">A1-C2</p>
                <p className="text-xs text-muted-foreground">Todos os níveis</p>
              </div>
              <div className="bg-card/80 rounded-xl p-4 text-center border border-border">
                <p className="text-2xl font-bold text-secondary">24/7</p>
                <p className="text-xs text-muted-foreground">Suporte IA</p>
              </div>
              <div className="bg-card/80 rounded-xl p-4 text-center border border-border">
                <p className="text-2xl font-bold text-success">7 dias</p>
                <p className="text-xs text-muted-foreground">Teste grátis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
