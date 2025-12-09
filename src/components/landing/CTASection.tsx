import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ClickMascot } from "@/components/mascot/ClickMascot";

export const CTASection = () => {
  const benefits = [
    "7 dias grátis para testar tudo",
    "Cancele quando quiser",
    "Acesso a todos os cursos",
    "Comunidade exclusiva",
    "Tutor com IA 24/7"
  ];

  return (
    <section className="py-20 relative overflow-hidden" aria-label="Chamada para ação">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary opacity-95" />
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl animate-bounce opacity-30">🎯</div>
        <div className="absolute top-20 right-20 text-3xl animate-bounce delay-300 opacity-30">📚</div>
        <div className="absolute bottom-10 left-1/4 text-4xl animate-bounce delay-500 opacity-30">🏆</div>
        <div className="absolute bottom-20 right-1/4 text-3xl animate-bounce delay-700 opacity-30">⭐</div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          {/* Mascot */}
          <div className="flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <ClickMascot mood="celebrating" size="lg" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4" />
            <span>Oferta especial - Comece grátis hoje!</span>
          </div>

          {/* Main heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
            Pronto para dominar o inglês? 🚀
          </h2>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Junte-se a mais de 10.000 estudantes que já transformaram seu inglês 
            com a Aula Click. Sua jornada começa agora!
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 py-4">
            {benefits.map((benefit) => (
              <div 
                key={benefit}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
              >
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-sm text-white">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="xl" 
              className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg group"
              asChild
            >
              <Link to="/signup">
                Começar Teste Grátis de 7 Dias
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="xl" 
              className="bg-transparent border-white text-white hover:bg-white/10"
              asChild
            >
              <Link to="/login">
                Já tenho uma conta
              </Link>
            </Button>
          </div>

          {/* Trust badge */}
          <p className="text-sm text-white/70 pt-4">
            ⭐ Avaliação 4.9/5 por mais de 500 estudantes
          </p>
        </div>
      </div>
    </section>
  );
};
