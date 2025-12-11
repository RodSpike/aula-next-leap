import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function SubscriptionManager() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      // Call edge function to cancel in Stripe
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada. Você continuará tendo acesso até o fim do período pago.",
      });

      await loadSubscription();
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Não foi possível cancelar a assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // Try customer portal first - this works if user has Stripe customer
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        // If customer portal fails (no Stripe customer), redirect to checkout
        console.log('Customer portal not available, redirecting to checkout');
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout');
        
        if (checkoutError) throw checkoutError;
        
        if (checkoutData?.url) {
          window.open(checkoutData.url, '_blank');
        }
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error opening payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível abrir o portal de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
          <CardDescription>Gerenciamento de assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando informações da assinatura...</p>
        </CardContent>
      </Card>
    );
  }

  const isTrialing = subscription.subscription_status === 'trialing';
  const isCanceled = subscription.canceled_at !== null;
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const periodEndsAt = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = trialEndsAt 
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : periodEndsAt
    ? Math.ceil((periodEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Sua Assinatura</CardTitle>
            <CardDescription>Gerencie sua assinatura e pagamentos</CardDescription>
          </div>
          {isTrialing && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Período Grátis
            </Badge>
          )}
          {isCanceled && (
            <Badge variant="destructive">
              Cancelada
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">Plano Premium</p>
              <p className="text-sm text-muted-foreground">R$ 59,90 / mês</p>
            </div>
          </div>

          {isTrialing && trialEndsAt && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Período de teste</p>
                <p className="text-sm text-blue-800">
                  {daysRemaining > 0 
                    ? `Faltam ${daysRemaining} dias do seu período grátis`
                    : 'Seu período grátis termina hoje'
                  }
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Você será cobrado em {trialEndsAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {!isTrialing && periodEndsAt && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold">Próxima cobrança</p>
                <p className="text-sm text-muted-foreground">
                  {periodEndsAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {isCanceled && periodEndsAt && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Assinatura cancelada</p>
                <p className="text-sm text-orange-800">
                  Você terá acesso até {periodEndsAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleManageSubscription}
            className="w-full"
            variant="outline"
            disabled={loading}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Gerenciar Pagamentos
          </Button>

          {!isCanceled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={loading}
                >
                  Cancelar Assinatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isTrialing 
                      ? "Se você cancelar agora durante o período de teste, perderá o acesso imediatamente."
                      : "Sua assinatura será cancelada, mas você continuará tendo acesso até o fim do período pago."
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Não, manter assinatura</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Você pode reativar sua assinatura a qualquer momento antes do término do período.
        </p>
      </CardContent>
    </Card>
  );
}
