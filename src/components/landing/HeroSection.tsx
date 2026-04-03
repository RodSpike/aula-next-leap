import { Button } from "@/components/ui/button";
import { Play, ChevronRight, GraduationCap, Users, Bot, BookOpen, LayoutDashboard, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { CupheadFoxMascot } from "@/components/mascot/CupheadFoxMascot";

interface HeroSectionProps {
  hasActiveSubscription?: boolean;
}

export const HeroSection = ({ hasActiveSubscription = false }: HeroSectionProps) => {
  const showDashboardLink = hasActiveSubscription;
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20" aria-label="Seção principal">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/8 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-secondary/8 rounded-full blur-[120px] animate-float delay-300" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-info/5 rounded-full blur-[80px] animate-float delay-700" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2.5 text-sm font-medium text-primary animate-fade-in backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Plataforma #1 de Ensino de Inglês</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
              Aprenda inglês
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]">
                de forma inteligente
              </span>
              <br />
              <span className="text-foreground/90">com a Aula Click</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-fade-in leading-relaxed" style={{ animationDelay: '200ms' }}>
              <strong className="text-foreground">Aprendizado real, para todas as idades.</strong> Combine 
              tecnologia de IA com suporte de professores qualificados em uma 
              metodologia que torna o estudo <span className="text-primary font-semibold">eficiente e envolvente</span>.
            </p>

            {/* Key benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              {[
                { icon: Bot, title: "Tutor com IA", desc: "Disponível 24/7", color: "primary" },
                { icon: Users, title: "Professores Reais", desc: "Suporte especializado", color: "secondary" },
                { icon: BookOpen, title: "Cursos A1 ao C2", desc: "Todos os níveis", color: "success" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-xl p-3.5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
                  <div className={`w-11 h-11 rounded-xl bg-${item.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className={`h-5 w-5 text-${item.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '400ms' }}>
              {showDashboardLink ? (
                <Button variant="hero" size="xl" asChild className="group text-lg shadow-lg hover:shadow-xl">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Ir para Dashboard
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="hero" size="xl" asChild className="group text-lg shadow-lg hover:shadow-xl transition-all">
                    <Link to="/signup">
                      Assinar Agora
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="xl" asChild className="group backdrop-blur-sm">
                    <Link to="/conhecer-cursos">
                      <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Conhecer Cursos
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shadow-md"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">+10.000 estudantes</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-warning text-sm">★</span>
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Card */}
          <div className="flex-1 flex flex-col items-center gap-6 lg:max-w-md animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="bg-card rounded-2xl p-8 border border-border shadow-xl w-full hover:shadow-2xl transition-shadow duration-500 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
              
              <div className="flex items-start gap-4 mb-6 relative">
                <div className="shrink-0">
                  <CupheadFoxMascot mood="happy" size="sm" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Clicky, seu assistente</p>
                  <p className="text-muted-foreground text-sm">
                    "Olá! Estou aqui para te ajudar a aprender inglês de forma eficiente!"
                  </p>
                </div>
              </div>

              <div className="space-y-4 relative">
                <h3 className="font-bold text-foreground text-lg">
                  Por que escolher a Aula Click?
                </h3>
                
                <ul className="space-y-3">
                  {[
                    { title: "Metodologia comprovada", desc: "que combina teoria e prática" },
                    { title: "IA + Professores reais", desc: "para suporte completo" },
                    { title: "Aprendizado engajante", desc: "com gamificação inteligente" },
                    { title: "Para todas as idades", desc: "do iniciante ao avançado" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-success/30 transition-colors">
                        <span className="text-success text-xs">✓</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{item.title}</strong> {item.desc}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full">
              {[
                { value: "A1-C2", label: "Todos os níveis", color: "primary" },
                { value: "24/7", label: "Suporte IA", color: "secondary" },
                { value: "10k+", label: "Estudantes", color: "success" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card/80 backdrop-blur-sm rounded-xl p-4 text-center border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
                  <p className={`text-2xl font-bold text-${stat.color} group-hover:scale-110 transition-transform inline-block`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};