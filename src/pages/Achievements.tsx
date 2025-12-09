import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { BadgeFrameSelector } from '@/components/gamification/BadgeFrameSelector';
import { Card, CardContent } from '@/components/ui/card';
import { useGamification } from '@/hooks/useGamification';

const Achievements = () => {
  const { gamificationData } = useGamification();

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 animate-fade-in">
        <Breadcrumb />
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all duration-300">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Seu Progresso</h1>
                <LevelBadge showProgress className="justify-center" />
                {gamificationData && (
                  <div className="flex justify-center gap-8 text-center mt-6">
                    <div className="transition-transform duration-300 hover:scale-110">
                      <div className="text-3xl font-bold text-primary">{gamificationData.total_xp}</div>
                      <div className="text-sm text-muted-foreground">Total XP</div>
                    </div>
                    <div className="transition-transform duration-300 hover:scale-110">
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
    </AppLayout>
  );
};

export default Achievements;
