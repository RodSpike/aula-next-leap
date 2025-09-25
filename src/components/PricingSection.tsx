import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function PricingSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/signup';
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            <Star className="h-4 w-4 mr-2" />
            Oferta Especial para Novos Alunos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Aprenda Inglês Sem Limites
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tenha acesso completo à plataforma Aula Click, incluindo testes de nivelamento, 
            cursos completos, suporte 24/7 com Tutor de IA, comunidades interativas, 
            grupos de estudo, sistema de mensagens e diversos outros recursos para 
            potencializar sua aprendizagem.
          </p>
        </div>

        <Card className="max-w-md mx-auto shadow-xl border-2 border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Plano Premium</CardTitle>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl text-muted-foreground line-through">R$ 99,90</span>
                <Badge variant="destructive">50% OFF</Badge>
              </div>
              <div className="text-4xl font-bold text-primary">R$ 59,90</div>
              <p className="text-sm text-muted-foreground">por mês</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                7 dias grátis para testar
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full"
                variant="hero"
                size="lg"
              >
                {loading ? "Carregando..." : "Começar Teste Grátis"}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                ✓ Cancele quando quiser • Sem compromisso • Cobrança após 7 dias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}