import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type PlanKey = "monthly" | "semester" | "annual";

const plans: { key: PlanKey; name: string; price: string; period: string; monthly: string; badge?: string; discount?: string; popular?: boolean; icon: typeof Crown }[] = [
  {
    key: "monthly",
    name: "Mensal",
    price: "R$ 99,90",
    period: "/mês",
    monthly: "R$ 99,90/mês",
    icon: Zap,
  },
  {
    key: "semester",
    name: "Semestral",
    price: "R$ 479,52",
    period: "/6 meses",
    monthly: "R$ 79,92/mês",
    badge: "20% OFF",
    discount: "Economize R$ 119,88",
    popular: true,
    icon: Crown,
  },
  {
    key: "annual",
    name: "Anual",
    price: "R$ 838,44",
    period: "/ano",
    monthly: "R$ 69,87/mês",
    badge: "30% OFF",
    discount: "Economize R$ 360,36",
    icon: Shield,
  },
];

export function PricingSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<PlanKey | null>(null);

  const handleSubscribe = async (plan: PlanKey) => {
    setLoading(plan);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        window.location.href = '/signup';
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${token}` },
        body: { plan },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const features = [
    "Testes de nivelamento Cambridge",
    "Cursos completos para todos os níveis",
    "Suporte 24/7 com Tutor de IA",
    "Comunidades interativas",
    "Grupos de estudo personalizados",
    "Certificados de conclusão",
    "Exercícios adaptativos",
    "Acesso mobile e desktop"
  ];

  return (
    <section className="py-24 bg-gradient-subtle relative overflow-hidden" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5 text-sm font-medium text-primary">
            <Star className="h-4 w-4" />
            <span>Planos Acessíveis</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            Aprenda Inglês <span className="text-primary">Sem Limites</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesso completo à plataforma com todos os cursos,
            tutor IA, comunidades e muito mais.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.map((plan, index) => {
            const PlanIcon = plan.icon;
            return (
              <Card
                key={plan.key}
                className={`relative transition-all duration-500 hover:shadow-2xl group animate-fade-in ${
                  plan.popular
                    ? "border-2 border-primary ring-2 ring-primary/20 md:scale-[1.05] shadow-xl bg-card"
                    : "border border-border hover:border-primary/30 bg-card/80"
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-5 py-1.5 text-sm shadow-lg">
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                    plan.popular 
                      ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg' 
                      : 'bg-muted'
                  } group-hover:scale-110 transition-transform duration-300`}>
                    <PlanIcon className={`h-7 w-7 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge variant="destructive" className="mx-auto w-fit mt-2 shadow-sm">
                      {plan.badge}
                    </Badge>
                  )}
                  <div className="mt-5">
                    <div className="text-4xl font-extrabold text-foreground">{plan.price}</div>
                    <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      equivalente a <span className="font-semibold text-foreground">{plan.monthly}</span>
                    </p>
                  </div>
                  {plan.discount && (
                    <p className="text-sm font-semibold text-success mt-3 bg-success/10 rounded-full px-4 py-1.5 mx-auto w-fit">
                      💰 {plan.discount}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pb-8">
                  <Button
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loading !== null}
                    className={`w-full transition-all duration-300 ${plan.popular ? 'shadow-md hover:shadow-lg' : ''}`}
                    variant={plan.popular ? "hero" : "default"}
                    size="lg"
                  >
                    {loading === plan.key ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    ) : null}
                    {loading === plan.key ? "Carregando..." : "Assinar Agora"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    ✓ Cancele quando quiser • Sem compromisso
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features list */}
        <div className="max-w-lg mx-auto bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
          <h3 className="font-bold text-lg mb-6 text-foreground">Incluído em todos os planos:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm group">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center mr-3 shrink-0 group-hover:bg-success/20 transition-colors">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}