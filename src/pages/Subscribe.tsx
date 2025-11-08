import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

  // For logged-in users, directly go to Stripe checkout
  const handleStartTrial = async () => {
    setLoading(true);
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
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        // Open Stripe in same window so user can complete payment
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
          <CardTitle className="text-2xl">Ative seu Período Grátis</CardTitle>
          <CardDescription>
            Experimente 7 dias grátis. Cancele a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg text-muted-foreground line-through">R$ 99,90</span>
              <Badge variant="destructive">-40%</Badge>
            </div>
            <div className="text-3xl font-bold text-primary">R$ 59,90</div>
            <p className="text-sm text-muted-foreground">por mês após o período grátis</p>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              7 dias grátis - Sem cobrança agora
            </Badge>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-blue-900">Como funciona</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use por 7 dias completamente grátis</li>
              <li>• Cancele antes de 7 dias para não ser cobrado</li>
              <li>• Ou continue e pague apenas R$ 59,90/mês</li>
              <li>• Acesso imediato a todos os recursos</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-center">Incluído no plano:</h4>
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
            onClick={handleStartTrial}
            className="w-full animate-pulse" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Começar Período Grátis
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Você será redirecionado para adicionar um método de pagamento. 
            Você não será cobrado durante os 7 dias de teste. Cancele a qualquer momento na plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
