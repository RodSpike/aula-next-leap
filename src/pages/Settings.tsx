import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { SoundSettings } from "@/components/settings/SoundSettings";
import { CreditCard, Bell, Shield, Volume2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        return;
      }

      try {
        // Check admin status first
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const { data: adminResp } = await supabase.functions.invoke('check-admin', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (adminResp?.is_admin === true) {
          setHasActiveSubscription(true);
          return;
        }

        // Check free access
        const { data: freeUserData } = await supabase.functions.invoke('check-free-access');
        if (freeUserData?.has_free_access) {
          setHasActiveSubscription(true);
          return;
        }

        // Check subscription
        const { data: subData } = await supabase.functions.invoke('check-subscription');
        if (subData?.subscribed || subData?.in_trial) {
          setHasActiveSubscription(true);
          return;
        }

        // Fallback: check user_subscriptions table
        const { data: subRow } = await supabase
          .from('user_subscriptions')
          .select('subscription_status, trial_ends_at, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        const now = new Date();
        const inTrial = subRow?.trial_ends_at ? new Date(subRow.trial_ends_at) > now : false;
        const isActive = (subRow?.subscription_status === 'active') || (subRow?.current_period_end ? new Date(subRow.current_period_end) > now : false);

        setHasActiveSubscription(inTrial || isActive);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Show loading while checking subscription
  if (hasActiveSubscription === null) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // User without active subscription - show only subscription tab
  if (!hasActiveSubscription) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 animate-fade-in">
          <Breadcrumb />
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">Gerencie sua assinatura para acessar a plataforma</p>
            </div>

            <SubscriptionManager />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 animate-fade-in">
        <Breadcrumb />
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
          </div>

          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="subscription" className="transition-all duration-300 data-[state=active]:scale-105">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Assinatura</span>
              </TabsTrigger>
              <TabsTrigger value="sounds" className="transition-all duration-300 data-[state=active]:scale-105">
                <Volume2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sons</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="transition-all duration-300 data-[state=active]:scale-105">
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="transition-all duration-300 data-[state=active]:scale-105">
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Privacidade</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-4 animate-fade-in">
              <SubscriptionManager />
            </TabsContent>

            <TabsContent value="sounds" className="space-y-4 animate-fade-in">
              <SoundSettings />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 animate-fade-in">
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>Configure como você quer receber notificações</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurações de notificações em breve...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4 animate-fade-in">
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Privacidade</CardTitle>
                  <CardDescription>Gerencie suas configurações de privacidade</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurações de privacidade em breve...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
