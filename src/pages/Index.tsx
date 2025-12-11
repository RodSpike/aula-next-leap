import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  usePageMeta({
    title: 'Aula Click - Aprenda Inglês Online | Cursos de Inglês A1 ao C2',
    description: 'Aprenda inglês online com a Aula Click. Cursos interativos do nível A1 ao C2, comunidade ativa, tutor com IA e certificados reconhecidos. Comece seu teste grátis hoje!',
    keywords: 'curso de inglês online, aprender inglês, aula de inglês, inglês para iniciantes, inglês intermediário, inglês avançado, curso de inglês Brasil',
    canonicalPath: '/',
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        setCheckingSubscription(false);
        return;
      }

      try {
        // Check if user is admin
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const { data: adminResp } = await supabase.functions.invoke('check-admin', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (adminResp?.is_admin === true) {
          setHasActiveSubscription(true);
          setCheckingSubscription(false);
          return;
        }

        // Check for free access
        const { data: freeUserData } = await supabase.functions.invoke('check-free-access');
        if (freeUserData?.has_free_access) {
          setHasActiveSubscription(true);
          setCheckingSubscription(false);
          return;
        }

        // Check subscription status
        const { data: subData } = await supabase.functions.invoke('check-subscription');
        if (subData?.subscribed || subData?.in_trial) {
          setHasActiveSubscription(true);
        } else {
          // Fallback: check user_subscriptions table
          const { data: subRow } = await supabase
            .from('user_subscriptions')
            .select('subscription_status, trial_ends_at, current_period_end')
            .eq('user_id', user.id)
            .maybeSingle();

          const now = new Date();
          const inTrial = subRow?.trial_ends_at ? new Date(subRow.trial_ends_at) > now : false;
          const isActive = (subRow?.subscription_status === 'active') || 
                          (subRow?.current_period_end ? new Date(subRow.current_period_end) > now : false);

          setHasActiveSubscription(inTrial || isActive);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  const content = (
    <>
      {/* Only show public Navigation for non-subscribed users */}
      {(!user || !hasActiveSubscription) && <Navigation />}
      
      {/* Hero Section com Mascote */}
      <HeroSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Features Section com Cards Gamificados */}
      <FeaturesSection />
      
      {/* How It Works */}
      <HowItWorksSection />

      {/* Pricing Section - only show for non-subscribed users */}
      {(!user || !hasActiveSubscription) && <PricingSection />}

      {/* Featured Courses */}
      <FeaturedCourses />

      {/* Student Testimonials */}
      <StudentTestimonials />

      {/* Final CTA */}
      <CTASection />
    </>
  );

  // Show loading while checking subscription
  if (user && checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in AND has active subscription, wrap with AppLayout to show sidebar
  if (user && hasActiveSubscription) {
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
