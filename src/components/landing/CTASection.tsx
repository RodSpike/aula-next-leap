import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, GraduationCap, LayoutDashboard, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CupheadFoxMascot } from "@/components/mascot/CupheadFoxMascot";

interface CTASectionProps {
  hasActiveSubscription?: boolean;
}

export const CTASection = ({ hasActiveSubscription = false }: CTASectionProps) => {
  const showDashboardLink = hasActiveSubscription;
  const benefits = [
    "Cancele quando quiser",
    "Todos os cursos inclusos",
    "Tutor IA + Professores reais",
    "Planos a partir de R$ 69,87/mês"
  ];

  return (
    <section className="py-24 relative overflow-hidden" aria-label="Chamada para ação">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(white/5_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2.5 text-sm font-medium text-white border border-white/20">
            <GraduationCap className="h-4 w-4" />
            <span>Comece sua jornada hoje</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Pronto para dominar o inglês?
          </h2>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Junte-se a estudantes de todas as idades que estão transformando seu inglês 
            com uma metodologia que combina <strong>tecnologia de IA</strong> e <strong>professores qualificados</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-3 py-4">
            {benefits.map((benefit) => (
              <div 
                key={benefit}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <CheckCircle className="h-4 w-4 text-white/90" />
                <span className="text-sm text-white font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4 py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <CupheadFoxMascot mood="happy" size="sm" />
            </div>
            <p className="text-white/80 text-sm text-left max-w-xs">
              <strong className="text-white">Clicky</strong> estará com você em cada etapa do seu aprendizado!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {showDashboardLink ? (
              <Button 
                size="xl" 
                className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg group font-bold"
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
                  className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg group font-bold"
                  asChild
                >
                  <Link to="/signup">
                    Assinar Agora
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 font-semibold"
                  asChild
                >
                  <Link to="/login">
                    Já tenho uma conta
                  </Link>
                </Button>
              </>
            )}
          </div>

          <p className="text-sm text-white/60 pt-4">
            ⭐ Avaliação 4.9/5 por mais de 500 estudantes
          </p>
        </div>
      </div>
    </section>
  );
};