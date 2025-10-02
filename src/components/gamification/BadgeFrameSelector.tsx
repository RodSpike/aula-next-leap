import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Frame, Lock, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileFrame {
  id: string;
  key: string;
  name: string;
  description: string | null;
  image_url: string;
  required_level: number;
  is_premium: boolean;
}

export const BadgeFrameSelector: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { gamificationData, achievements, refetch } = useGamification();
  const [frames, setFrames] = useState<ProfileFrame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_frames')
        .select('*')
        .order('required_level', { ascending: true });

      if (error) throw error;
      setFrames(data || []);
    } catch (error) {
      console.error('Error fetching frames:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBadge = async (achievementId: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_gamification')
        .update({ selected_badge_id: achievementId })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Badge atualizado!',
        description: achievementId ? 'Badge selecionado com sucesso' : 'Badge removido',
      });

      refetch();
    } catch (error) {
      console.error('Error selecting badge:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar badge',
        variant: 'destructive',
      });
    }
  };

  const selectFrame = async (frameId: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_gamification')
        .update({ selected_frame_id: frameId })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Moldura atualizada!',
        description: frameId ? 'Moldura selecionada com sucesso' : 'Moldura removida',
      });

      refetch();
    } catch (error) {
      console.error('Error selecting frame:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar moldura',
        variant: 'destructive',
      });
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked_at);

  const canUseFrame = (frame: ProfileFrame) => {
    if (!gamificationData) return false;
    if (frame.is_premium) return false; // TODO: Check subscription
    return gamificationData.current_level >= frame.required_level;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="badges">🏆 Badges</TabsTrigger>
          <TabsTrigger value="frames">🖼️ Molduras</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Badge</CardTitle>
              <CardDescription>
                Escolha um badge desbloqueado para exibir ao lado do seu nome
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unlockedAchievements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Você ainda não desbloqueou nenhum badge. Complete conquistas para ganhar badges!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Button
                    variant={gamificationData?.selected_badge_id === null ? 'default' : 'outline'}
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => selectBadge(null)}
                  >
                    <span className="text-2xl mb-1">∅</span>
                    <span className="text-xs">Nenhum</span>
                  </Button>
                  {unlockedAchievements.map((ua) => (
                    <Button
                      key={ua.id}
                      variant={gamificationData?.selected_badge_id === ua.achievement_id ? 'default' : 'outline'}
                      className="h-20 flex flex-col items-center justify-center relative"
                      onClick={() => selectBadge(ua.achievement_id)}
                    >
                      <span className="text-2xl mb-1">{ua.achievements.icon}</span>
                      <span className="text-xs truncate w-full px-1">{ua.achievements.name}</span>
                      {gamificationData?.selected_badge_id === ua.achievement_id && (
                        <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frames" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Moldura</CardTitle>
              <CardDescription>
                Escolha uma moldura para destacar sua foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button
                  variant={gamificationData?.selected_frame_id === null ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => selectFrame(null)}
                >
                  <Frame className="h-8 w-8 mb-2" />
                  <span className="text-xs">Sem Moldura</span>
                </Button>
                {frames.map((frame) => {
                  const canUse = canUseFrame(frame);
                  return (
                    <Button
                      key={frame.id}
                      variant={gamificationData?.selected_frame_id === frame.id ? 'default' : 'outline'}
                      className="h-24 flex flex-col items-center justify-center relative"
                      onClick={() => canUse && selectFrame(frame.id)}
                      disabled={!canUse}
                    >
                      <div className={`w-12 h-12 rounded-full border-4 mb-2 ${
                        frame.key === 'diamond' ? 'border-cyan-400' :
                        frame.key === 'platinum' ? 'border-gray-400' :
                        frame.key === 'gold' ? 'border-yellow-400' :
                        frame.key === 'silver' ? 'border-gray-300' :
                        frame.key === 'bronze' ? 'border-amber-600' :
                        'border-primary'
                      }`} />
                      <span className="text-xs truncate w-full px-1">{frame.name}</span>
                      {!canUse && (
                        <>
                          <Lock className="absolute top-2 right-2 h-4 w-4" />
                          <Badge variant="outline" className="absolute bottom-1 text-[10px] py-0 px-1">
                            Nível {frame.required_level}
                          </Badge>
                        </>
                      )}
                      {gamificationData?.selected_frame_id === frame.id && (
                        <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};