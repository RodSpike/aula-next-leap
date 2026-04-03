import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ArrowLeft, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";

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

export default function Subscribe() {
  usePageMeta({
    title: 'Assinar - Aula Click | Acesso Completo a Todos os Cursos',
    description: 'Assine a Aula Click a partir de R$69,87/mês. Acesso a todos os cursos de inglês, tutor com IA e comunidade ativa.',
    keywords: 'assinatura aula click, plano inglês online, curso inglês mensal',
    canonicalPath: '/subscribe',
  });

  const [loading, setLoading] = useState<PlanKey | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        // Check admin
        const { data: adminResp } = await supabase.functions.invoke('check-admin', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (adminResp?.is_admin) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check free access
        const { data: freeData } = await supabase.functions.invoke('check-free-access');
        if (freeData?.has_free_access) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check subscription
        const { data: subData } = await supabase.functions.invoke('check-subscription');
        if (subData?.subscribed) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error('[Subscribe] Access check error:', e);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [user, navigate]);

  const handleSubscribe = async (plan: PlanKey) => {
    setLoading(plan);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        navigate('/login');
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
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no checkout",
        description: error.message || "Ocorreu um erro ao processar o pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const features = [
    "Acesso a todos os cursos de inglês",
    "Testes de nivelamento Cambridge",
    "Suporte 24/7 com Tutor de IA",
    "Comunidades interativas",
    "Grupos de estudo",
    "Sistema de mensagens",
    "Certificados de conclusão",
    "Acompanhamento de progresso"
  ];

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <Link to="/" className="font-bold text-lg text-primary">
              Aula Click
            </Link>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Escolha seu Plano</h1>
          <p className="text-muted-foreground">Acesso completo a toda a plataforma Aula Click</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative transition-all hover:shadow-lg ${
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
                  {loading === plan.key ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {loading === plan.key ? "Carregando..." : "Assinar Agora"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ✓ Cancele quando quiser • Sem compromisso
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-md mx-auto">
          <h3 className="font-semibold text-center mb-4">Incluído em todos os planos:</h3>
          <div className="grid grid-cols-1 gap-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
