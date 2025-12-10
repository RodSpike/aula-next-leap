import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardCheck, RefreshCw, Play, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PlacementTestManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [regenerating, setRegenerating] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'tested'>('idle');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleTestPlacement = () => {
    // Navigate to placement test page for admin to test
    navigate('/placement-test?admin_preview=true');
  };

  const handleRegenerateTest = async () => {
    setRegenerating(true);
    try {
      // Call the edge function to regenerate placement test questions
      const { error } = await supabase.functions.invoke('cambridge-placement-test', {
        body: { action: 'regenerate' }
      });

      if (error) throw error;

      toast({
        title: "Teste Regenerado",
        description: "Um novo teste de nível foi gerado com sucesso. Teste antes de publicar.",
      });
      
      setTestStatus('idle');
    } catch (error: any) {
      console.error('Error regenerating placement test:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao regenerar o teste de nível.",
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
      setConfirmDialogOpen(false);
    }
  };

  const handlePublishTest = async () => {
    try {
      // Mark the new test as active
      const { error } = await supabase.functions.invoke('cambridge-placement-test', {
        body: { action: 'publish' }
      });

      if (error) throw error;

      toast({
        title: "Teste Publicado",
        description: "O novo teste de nível está agora ativo para todos os usuários.",
      });
      
      setTestStatus('idle');
    } catch (error: any) {
      console.error('Error publishing placement test:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao publicar o teste de nível.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Gerenciador do Teste de Nível
        </CardTitle>
        <CardDescription>
          Gerencie e atualize o teste de nivelamento Cambridge para novos usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Status do Teste</h4>
              <p className="text-sm text-muted-foreground mt-1">
                O teste de nível é gerado por IA e contém 20 perguntas adaptativas
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Test the Placement Test */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Play className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Testar o Teste</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Faça o teste de nível como um usuário para avaliar a qualidade das perguntas
                  </p>
                  <Button 
                    onClick={handleTestPlacement}
                    variant="outline"
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Teste
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regenerate Test */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Regenerar Teste</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gerar novas perguntas com IA. Teste antes de publicar para todos.
                  </p>
                  <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full"
                        disabled={regenerating}
                      >
                        {regenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerar
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Regenerar Teste de Nível
                        </DialogTitle>
                        <DialogDescription>
                          Isso irá gerar um novo conjunto de perguntas para o teste de nível. 
                          O teste atual permanecerá ativo até você testar e aprovar o novo.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleRegenerateTest}
                          disabled={regenerating}
                        >
                          {regenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            "Confirmar Regeneração"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                Dica para Admins
              </p>
              <p className="text-muted-foreground">
                Admins são automaticamente configurados como nível C2 e não precisam fazer o teste. 
                Use o botão "Testar o Teste" para avaliar a qualidade das perguntas antes de disponibilizar para novos usuários.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
