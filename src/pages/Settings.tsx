import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { SoundSettings } from "@/components/settings/SoundSettings";
import { CreditCard, Bell, Shield, Volume2 } from "lucide-react";

export default function Settings() {
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
