import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bot, Send, Clock, RefreshCw, Users, Sparkles } from 'lucide-react';

interface AITeacher {
  id: string;
  name: string;
  email: string;
  personality: string;
  avatar_url?: string;
  personality_traits: {
    style: string;
    approach: string;
    tone: string;
    examples: string;
  };
  is_active: boolean;
  created_at: string;
}

interface AIPostingSettings {
  id: string;
  interaction_frequency_hours: number;
  tip_frequency_hours: number;
  last_interaction_run: string | null;
  last_tip_run: string | null;
  is_enabled: boolean;
}

export function AITeachersManager() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<AITeacher[]>([]);
  const [settings, setSettings] = useState<AIPostingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch AI teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('ai_teachers')
        .select('*')
        .order('name');

      if (teachersError) throw teachersError;
      
      // Type assertion since the table is new
      setTeachers((teachersData as unknown as AITeacher[]) || []);

      // Fetch posting settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_posting_settings')
        .select('*')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      setSettings(settingsData as unknown as AIPostingSettings);

    } catch (error: any) {
      console.error('Error fetching AI teachers data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados dos professores IA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacher = async (teacherId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_teachers')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', teacherId);

      if (error) throw error;

      setTeachers(prev => prev.map(t => 
        t.id === teacherId ? { ...t, is_active: isActive } : t
      ));

      toast({
        title: 'Sucesso',
        description: `Professor ${isActive ? 'ativado' : 'desativado'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateFrequency = async (field: 'interaction_frequency_hours' | 'tip_frequency_hours', value: number) => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('ai_posting_settings')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [field]: value } : null);

      toast({
        title: 'Sucesso',
        description: 'Frequência atualizada',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const triggerAIPost = async (action: 'interact' | 'tip') => {
    setPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-community-post', {
        body: { action }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Ação de ${action === 'interact' ? 'interação' : 'dica'} executada! ${data?.results?.length || 0} posts processados.`,
      });

      // Refresh settings to get updated timestamps
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao executar ação de IA',
        variant: 'destructive'
      });
    } finally {
      setPosting(false);
    }
  };

  const getPersonalityBadge = (personality: string) => {
    const colors: Record<string, string> = {
      playful: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      serious: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      helpful: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      concise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    const labels: Record<string, string> = {
      playful: 'Brincalhão',
      serious: 'Sério',
      helpful: 'Prestativo',
      concise: 'Direto',
    };
    return (
      <Badge className={colors[personality] || 'bg-gray-100 text-gray-800'}>
        {labels[personality] || personality}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Professores IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Personalidade</TableHead>
                <TableHead>Estilo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="relative">
                      <img
                        src={teacher.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`}
                        alt={teacher.name}
                        className="w-10 h-10 rounded-full ring-2 ring-primary/30"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-primary-foreground">🤖</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{getPersonalityBadge(teacher.personality)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {teacher.personality_traits?.style}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                      {teacher.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={teacher.is_active}
                      onCheckedChange={(checked) => toggleTeacher(teacher.id, checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Postagem Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Frequência de Interação (responder alunos)</Label>
              <Select
                value={settings?.interaction_frequency_hours?.toString() || '12'}
                onValueChange={(value) => updateFrequency('interaction_frequency_hours', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">A cada 3 horas</SelectItem>
                  <SelectItem value="6">A cada 6 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">A cada 24 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Última execução: {formatDate(settings?.last_interaction_run || null)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Frequência de Dicas</Label>
              <Select
                value={settings?.tip_frequency_hours?.toString() || '6'}
                onValueChange={(value) => updateFrequency('tip_frequency_hours', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">A cada 3 horas</SelectItem>
                  <SelectItem value="6">A cada 6 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">A cada 24 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Última execução: {formatDate(settings?.last_tip_run || null)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button 
              onClick={() => triggerAIPost('interact')}
              disabled={posting}
              className="flex items-center gap-2"
            >
              {posting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Interagir com Alunos Agora
            </Button>

            <Button 
              onClick={() => triggerAIPost('tip')}
              disabled={posting}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {posting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Postar Dica Agora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
