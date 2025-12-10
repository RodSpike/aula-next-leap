import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Play, 
  CheckCircle, 
  Clock, 
  Loader2,
  History,
  FileText,
  ArrowUpCircle,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TestVersion {
  id: string;
  version_number: number;
  is_active: boolean;
  created_at: string;
  notes: string | null;
  created_by: string;
}

export function PlacementTestManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TestVersion | null>(null);
  const [versions, setVersions] = useState<TestVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');

  // Fetch test versions
  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('placement_test_versions')
        .select('*')
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions((data as TestVersion[]) || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCurrentVersion = () => {
    navigate('/placement-test?admin_preview=true');
  };

  const handleGenerateNewTest = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setShowConfirmDialog(false);
    
    try {
      // Generate new test using the edge function
      const { data, error } = await supabase.functions.invoke('cambridge-placement-test', {
        body: { action: 'regenerate' }
      });

      if (error) throw error;

      // Get the next version number
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;

      // Save the new version (initially inactive)
      const { error: insertError } = await supabase
        .from('placement_test_versions')
        .insert({
          version_number: nextVersion,
          questions: data?.questions || {},
          is_active: false,
          created_by: user.id,
          notes: notes || null
        });

      if (insertError) throw insertError;

      toast({
        title: 'Novo teste gerado!',
        description: `Versão ${nextVersion} criada. Teste antes de ativar.`,
      });

      setNotes('');
      fetchVersions();
    } catch (error: any) {
      console.error('Error generating test:', error);
      toast({
        title: 'Erro ao gerar teste',
        description: error.message || 'Falha ao gerar novo teste',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivateVersion = async () => {
    if (!selectedVersion) return;

    try {
      // Deactivate all versions
      await supabase
        .from('placement_test_versions')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Activate selected version
      const { error } = await supabase
        .from('placement_test_versions')
        .update({ is_active: true })
        .eq('id', selectedVersion.id);

      if (error) throw error;

      toast({
        title: 'Versão ativada!',
        description: `Versão ${selectedVersion.version_number} está agora em produção.`,
      });

      setShowActivateDialog(false);
      setSelectedVersion(null);
      fetchVersions();
    } catch (error: any) {
      console.error('Error activating version:', error);
      toast({
        title: 'Erro ao ativar versão',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handlePreviewVersion = (version: TestVersion) => {
    navigate(`/placement-test?admin_preview=true&version=${version.id}`);
  };

  const activeVersion = versions.find(v => v.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerenciador de Teste de Nível
        </CardTitle>
        <CardDescription>
          Gere, teste e gerencie versões do teste de nível Cambridge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Versão Atual</TabsTrigger>
            <TabsTrigger value="history">Histórico de Versões</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {activeVersion ? (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Versão {activeVersion.version_number}</span>
                    <Badge variant="default">Ativa</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Criada em {format(new Date(activeVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {activeVersion.notes && (
                  <p className="text-sm text-muted-foreground">{activeVersion.notes}</p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma versão ativa. Gere e ative um teste.</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={handleTestCurrentVersion}
                variant="outline"
                className="w-full gap-2"
              >
                <Play className="h-4 w-4" />
                Testar Versão Atual
              </Button>

              <Button 
                onClick={() => setShowConfirmDialog(true)}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Gerar Nova Versão
                  </>
                )}
              </Button>
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
                    Use o botão "Testar" para avaliar a qualidade das perguntas antes de ativar para novos usuários.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma versão de teste encontrada.</p>
                <p className="text-xs mt-1">Gere a primeira versão do teste.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {versions.map((version) => (
                    <div 
                      key={version.id}
                      className={`p-4 rounded-lg border ${version.is_active ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Versão {version.version_number}</span>
                          {version.is_active && <Badge variant="default">Ativa</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(version.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {version.notes && (
                        <p className="text-sm text-muted-foreground mb-3">{version.notes}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePreviewVersion(version)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Testar
                        </Button>
                        {!version.is_active && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowActivateDialog(true);
                            }}
                          >
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                            Ativar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Confirm Generate Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar Nova Versão do Teste</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Uma nova versão do teste de nível será gerada usando IA.
                  A nova versão ficará inativa até você testar e ativar manualmente.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Notas (opcional)
                  </label>
                  <Textarea
                    placeholder="Ex: Foco em gramática avançada, mais questões B2..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateNewTest}>
              Gerar Nova Versão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Activate Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar Versão {selectedVersion?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta versão substituirá a atual e será usada por todos os novos usuários no teste de nível.
              Certifique-se de ter testado esta versão antes de ativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateVersion}>
              Ativar Versão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
