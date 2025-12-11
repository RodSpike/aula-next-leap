import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, GraduationCap, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { CupheadFoxMascot } from "@/components/mascot/CupheadFoxMascot";

interface CTASectionProps {
  hasActiveSubscription?: boolean;
}

export const CTASection = ({ hasActiveSubscription = false }: CTASectionProps) => {
  // Only show dashboard link if user has active subscription
  const showDashboardLink = hasActiveSubscription;
  const benefits = [
    "7 dias grátis para testar",
    "Cancele quando quiser",
    "Todos os cursos inclusos",
    "Tutor IA + Professores reais"
  ];

  return (
    <section className="py-20 relative overflow-hidden" aria-label="Chamada para ação">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary opacity-95" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          {/* Professional badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white">
            <GraduationCap className="h-4 w-4" />
            <span>Comece sua jornada hoje</span>
          </div>

          {/* Main heading - professional */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
            Pronto para dominar o inglês?
          </h2>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Junte-se a estudantes de todas as idades que estão transformando seu inglês 
            com uma metodologia que combina <strong>tecnologia de IA</strong> e <strong>professores qualificados</strong>.
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

          {/* Subtle mascot */}
          <div className="flex justify-center items-center gap-4 py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <CupheadFoxMascot mood="happy" size="sm" />
            </div>
            <p className="text-white/80 text-sm text-left max-w-xs">
              <strong className="text-white">Clicky</strong> estará com você em cada etapa do seu aprendizado!
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {showDashboardLink ? (
              <Button 
                size="xl" 
                className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg group"
                asChild
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Ir para Dashboard
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            ) : (
              <>
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
              </>
            )}
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
