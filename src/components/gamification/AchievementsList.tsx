import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Lock } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  xp_reward: number;
  requirement_count: number;
}

export const AchievementsList: React.FC = () => {
  const { achievements } = useGamification();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAchievements();
  }, []);

  const fetchAllAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('xp_reward', { ascending: true });

      if (error) throw error;
      setAllAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserProgress = (achievementId: string) => {
    const userAchievement = achievements.find(a => a.achievement_id === achievementId);
    return userAchievement || null;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'from-cyan-400 to-blue-500';
      case 'platinum': return 'from-gray-300 to-gray-400';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'silver': return 'from-gray-400 to-gray-500';
      case 'bronze': return 'from-amber-600 to-amber-700';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const categories = ['social', 'learning', 'community', 'streak', 'special'];
  const categoryNames = {
    social: 'Social',
    learning: 'Aprendizado',
    community: 'Comunidade',
    streak: 'Sequências',
    special: 'Especial'
  };

  const renderAchievement = (achievement: Achievement) => {
    const progress = getUserProgress(achievement.id);
    const isUnlocked = progress?.unlocked_at;
    const progressPercent = progress ? (progress.progress / achievement.requirement_count) * 100 : 0;

    return (
      <Card key={achievement.id} className={`relative overflow-hidden ${isUnlocked ? 'border-primary' : 'opacity-60'}`}>
        {isUnlocked && (
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${getTierColor(achievement.tier)} opacity-20 rounded-bl-full`} />
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{achievement.icon}</div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {achievement.name}
                  {isUnlocked && <Trophy className="h-4 w-4 text-primary" />}
                  {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="text-sm">
                  {achievement.description}
                </CardDescription>
              </div>
            </div>
            <Badge className={`bg-gradient-to-r ${getTierColor(achievement.tier)} text-white border-0`}>
              {achievement.xp_reward} XP
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isUnlocked && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>{progress?.progress || 0}/{achievement.requirement_count}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
          {isUnlocked && (
            <div className="text-sm text-muted-foreground">
              🎉 Desbloqueada em {new Date(progress.unlocked_at!).toLocaleDateString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div>Loading achievements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🏆 Conquistas</h2>
        <p className="text-muted-foreground">
          Complete desafios para desbloquear conquistas e ganhar XP!
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <Badge variant="outline">
            {achievements.filter(a => a.unlocked_at).length}/{allAchievements.length} Desbloqueadas
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todas</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {categoryNames[cat as keyof typeof categoryNames]}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {allAchievements.map(renderAchievement)}
          </div>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {allAchievements
                .filter(a => a.category === category)
                .map(renderAchievement)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};