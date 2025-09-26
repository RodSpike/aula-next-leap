import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Subscribe() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      toast({
        title: "Faça login",
        description: "Entre para continuar ao checkout.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no checkout",
        description: error.message || "Ocorreu um erro ao processar o pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete sua Inscrição</CardTitle>
          <CardDescription>
            Para acessar a plataforma Aula Click, complete o processo de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg text-muted-foreground line-through">R$ 99,90</span>
              <Badge variant="destructive">-40%</Badge>
            </div>
            <div className="text-3xl font-bold text-primary">R$ 59,90</div>
            <p className="text-sm text-muted-foreground">por mês</p>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Oferta para novos alunos
            </Badge>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-900">7 dias grátis</span>
            </div>
            <p className="text-sm text-blue-800">
              Teste a plataforma por 7 dias sem custo. Cancele quando quiser.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Incluído no plano:</h4>
            <div className="grid grid-cols-1 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSubscribe} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Iniciar Teste Grátis de 7 Dias
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao clicar no botão acima, você será redirecionado para o checkout seguro do Stripe. 
            Você pode cancelar sua assinatura a qualquer momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}