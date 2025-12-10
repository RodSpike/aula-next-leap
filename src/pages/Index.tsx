import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/PricingSection";
import { FeaturedCourses } from "@/components/FeaturedCourses";
import { StudentTestimonials } from "@/components/StudentTestimonials";
import { CTASection } from "@/components/landing/CTASection";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";

const Index = () => {
  const { user } = useAuth();

  usePageMeta({
    title: 'Aula Click - Aprenda Inglês Online | Cursos de Inglês A1 ao C2',
    description: 'Aprenda inglês online com a Aula Click. Cursos interativos do nível A1 ao C2, comunidade ativa, tutor com IA e certificados reconhecidos. Comece seu teste grátis hoje!',
    keywords: 'curso de inglês online, aprender inglês, aula de inglês, inglês para iniciantes, inglês intermediário, inglês avançado, curso de inglês Brasil',
    canonicalPath: '/',
  });

  const content = (
    <>
      {/* Only show public Navigation for non-logged users */}
      {!user && <Navigation />}
      
      {/* Hero Section com Mascote */}
      <HeroSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Features Section com Cards Gamificados */}
      <FeaturesSection />
      
      {/* How It Works */}
      <HowItWorksSection />

      {/* Pricing Section - only show for non-logged users */}
      {!user && <PricingSection />}

      {/* Featured Courses */}
      <FeaturedCourses />

      {/* Student Testimonials */}
      <StudentTestimonials />

      {/* Final CTA */}
      <CTASection />
    </>
  );

  // If user is logged in, wrap with AppLayout to show sidebar
  if (user) {
    return (
      <AppLayout>
        <main className="min-h-screen bg-background">
          {content}
        </main>
      </AppLayout>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {content}
    </main>
  );
};

export default Index;
