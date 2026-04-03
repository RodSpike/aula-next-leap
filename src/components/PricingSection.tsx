import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type PlanKey = "monthly" | "semester" | "annual";

const plans: { key: PlanKey; name: string; price: string; period: string; monthly: string; badge?: string; discount?: string; popular?: boolean }[] = [
  {
    key: "monthly",
    name: "Mensal",
    price: "R$ 99,90",
    period: "/mês",
    monthly: "R$ 99,90/mês",
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
  },
  {
    key: "annual",
    name: "Anual",
    price: "R$ 838,44",
    period: "/ano",
    monthly: "R$ 69,87/mês",
    badge: "30% OFF",
    discount: "Economize R$ 360,36",
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
    "Sistema de mensagens entre alunos",
    "Certificados de conclusão",
    "Acompanhamento de progresso",
    "Exercícios adaptativos",
    "Acesso mobile e desktop"
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            <Star className="h-4 w-4 mr-2" />
            Escolha seu Plano
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Aprenda Inglês Sem Limites
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tenha acesso completo à plataforma Aula Click com todos os cursos,
            tutor IA, comunidades e muito mais.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative shadow-lg transition-all hover:shadow-xl ${
                plan.popular
                  ? "border-2 border-primary ring-2 ring-primary/20 scale-[1.02]"
                  : "border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4">
                    <Crown className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.badge && (
                  <Badge variant="destructive" className="mx-auto w-fit mt-1">
                    {plan.badge}
                  </Badge>
                )}
                <div className="mt-4">
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">{plan.period}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    equivalente a {plan.monthly}
                  </p>
                </div>
                {plan.discount && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">
                    {plan.discount}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loading !== null}
                  className="w-full"
                  variant={plan.popular ? "hero" : "default"}
                  size="lg"
                >
                  {loading === plan.key ? "Carregando..." : "Assinar Agora"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ✓ Cancele quando quiser
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features list */}
        <div className="max-w-md mx-auto">
          <h3 className="font-semibold text-lg mb-4">Incluído em todos os planos:</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
