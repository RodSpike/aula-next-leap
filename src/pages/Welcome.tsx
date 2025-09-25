import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function Welcome() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateCheckout = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-checkout', {
          body: { session_id: sessionId }
        });

        if (error || !data?.success) {
          throw new Error('Checkout validation failed');
        }

        setStatus('success');
        
        // Show success message
        toast({
          title: "Bem-vindo à Aula Click!",
          description: "Sua assinatura foi ativada com sucesso. Aproveite seus 7 dias grátis!",
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('Checkout validation error:', error);
        setStatus('error');
      }
    };

    validateCheckout();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <CardTitle>Validando pagamento...</CardTitle>
              <CardDescription>
                Aguarde enquanto confirmamos sua assinatura
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <CardTitle className="text-green-700">Bem-vindo à Aula Click!</CardTitle>
              <CardDescription>
                Sua assinatura foi ativada com sucesso
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <CardTitle className="text-red-700">Erro na validação</CardTitle>
              <CardDescription>
                Ocorreu um erro ao validar seu pagamento
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✨ <strong>7 dias grátis ativados!</strong><br />
                  Explore todos os recursos da plataforma sem custo.
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Redirecionando para o painel em alguns segundos...
              </p>
              
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Ir para o Painel
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se você completou o pagamento, entre em contato conosco ou tente fazer login novamente.
              </p>
              
              <div className="flex gap-2">
                <Button onClick={() => navigate('/subscribe')} variant="outline" className="flex-1">
                  Tentar Novamente
                </Button>
                <Button onClick={() => navigate('/login')} className="flex-1">
                  Fazer Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}