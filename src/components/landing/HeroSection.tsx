import { Button } from "@/components/ui/button";
import { Play, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ClickMascot } from "@/components/mascot/ClickMascot";
import { GamificationStats } from "./GamificationStats";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20" aria-label="Seção principal">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-warning/10 rounded-full blur-2xl animate-pulse delay-500" />
        
        {/* Floating elements */}
        <div className="absolute top-1/4 right-1/4 text-4xl animate-bounce delay-200">🎯</div>
        <div className="absolute top-1/3 left-1/6 text-3xl animate-bounce delay-500">📚</div>
        <div className="absolute bottom-1/3 right-1/6 text-3xl animate-bounce delay-700">🏆</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>A forma mais divertida de aprender inglês!</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Aprenda inglês
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]">
                jogando e se divertindo
              </span>
              <br />
              com a Aula Click 🎮
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Estude 5 minutos por dia e domine o inglês! 
              Lições rápidas, exercícios gamificados e uma comunidade incrível te esperando. 
              <span className="font-semibold text-primary"> Grátis para começar!</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" asChild className="group text-lg">
                <Link to="/signup">
                  Começar Agora - É Grátis!
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button variant="outline" size="xl" asChild className="group">
                <Link to="/courses">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Ver Como Funciona
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
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
                <p className="text-sm text-muted-foreground">Aprendendo inglês agora mesmo!</p>
              </div>
            </div>
          </div>

          {/* Right Content - Mascot */}
          <div className="flex-1 flex flex-col items-center gap-8">
            <div className="relative">
              {/* Mascot with message */}
              <ClickMascot 
                mood="waving" 
                size="xl" 
                message="Oi! Vamos aprender juntos? 🇬🇧" 
              />
              
              {/* Decorative badges around mascot */}
              <div className="absolute -top-4 -left-8 bg-card rounded-xl px-3 py-2 shadow-lg border border-border animate-bounce">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <span className="font-bold text-sm">7 dias!</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-8 bg-card rounded-xl px-3 py-2 shadow-lg border border-border animate-bounce delay-300">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-bold text-sm">+50 XP</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-12 bg-success text-white rounded-full p-2 shadow-lg animate-pulse">
                <span className="text-lg">✓</span>
              </div>
            </div>

            {/* Gamification Preview */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-xl w-full max-w-md">
              <h3 className="text-center font-bold text-foreground mb-4">
                Veja o que você vai conquistar! 🏆
              </h3>
              <GamificationStats />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
