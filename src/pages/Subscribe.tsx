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
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    agreedTerms: false,
    agreedMarketing: false
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreedTerms) {
      toast({
        title: "Aceite os termos",
        description: "Você precisa aceitar os termos de uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Save prospect data first (via Edge Function to avoid RLS/auth issues)
      const { error: prospectError } = await supabase.functions.invoke('save-prospect', {
        body: {
          email: formData.email,
          name: formData.name,
          agreed_terms: formData.agreedTerms,
          agreed_marketing: formData.agreedMarketing,
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        },
      });

      if (prospectError) {
        console.error('Error saving prospect:', prospectError);
        // Continue anyway - don't block checkout
      }

      // Proceed to Stripe checkout
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const invokeOptions: any = token
        ? { 
            headers: { Authorization: `Bearer ${token}` },
            body: { email: formData.email }
          }
        : { body: { email: formData.email } };

      const { data, error } = await supabase.functions.invoke('create-checkout', invokeOptions);
      
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

  // Pre-fill email if user is logged in
  useState(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete sua Inscrição</CardTitle>
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
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-900">Como funciona</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cadastre-se agora sem pagar nada</li>
              <li>• Use por 7 dias completamente grátis</li>
              <li>• Cancele antes de 7 dias para não ser cobrado</li>
              <li>• Ou continue e pague apenas R$ 59,90/mês</li>
            </ul>
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreedTerms: checked as boolean }))
                  }
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                  Concordo com os termos de uso e política de privacidade *
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.agreedMarketing}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreedMarketing: checked as boolean }))
                  }
                />
                <label htmlFor="marketing" className="text-sm text-muted-foreground leading-tight">
                  Aceito receber ofertas e novidades por e-mail
                </label>
              </div>

              <Button 
                type="submit"
                className="w-full" 
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
            </form>
          ) : (
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
          )}

          <p className="text-xs text-center text-muted-foreground">
            Após o cadastro, você será redirecionado para adicionar um método de pagamento. 
            Você não será cobrado durante os 7 dias de teste. Cancele a qualquer momento na plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
