import React from 'react';
import { Navigation } from '@/components/Navigation';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { BadgeFrameSelector } from '@/components/gamification/BadgeFrameSelector';
import { Card, CardContent } from '@/components/ui/card';
import { useGamification } from '@/hooks/useGamification';

const Achievements = () => {
  const { gamificationData } = useGamification();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Seu Progresso</h1>
                <LevelBadge showProgress className="justify-center" />
                {gamificationData && (
                  <div className="flex justify-center gap-8 text-center mt-6">
                    <div>
                      <div className="text-3xl font-bold text-primary">{gamificationData.total_xp}</div>
                      <div className="text-sm text-muted-foreground">Total XP</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{gamificationData.current_level}</div>
                      <div className="text-sm text-muted-foreground">Nível Atual</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <BadgeFrameSelector />
          <AchievementsList />
        </div>
      </main>
    </div>
  );
};

export default Achievements;