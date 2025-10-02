import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Zap } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface LevelBadgeProps {
  showProgress?: boolean;
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ showProgress = false, className = '' }) => {
  const { gamificationData, getXPForNextLevel, getProgressToNextLevel } = useGamification();

  if (!gamificationData) return null;

  const tierColor = (level: number) => {
    if (level >= 100) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (level >= 25) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (level >= 10) return 'bg-gradient-to-r from-gray-400 to-gray-500';
    return 'bg-gradient-to-r from-amber-600 to-amber-700';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
            <div className={`${tierColor(gamificationData.current_level)} text-white px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold shadow-lg`}>
              <Trophy className="h-4 w-4" />
              <span>Nível {gamificationData.current_level}</span>
            </div>
            {showProgress && (
              <div className="w-full space-y-1">
                <Progress value={getProgressToNextLevel()} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {gamificationData.total_xp} XP
                  </span>
                  <span>{getXPForNextLevel()} XP para o próximo nível</span>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Nível {gamificationData.current_level}</p>
            <p className="text-sm">{gamificationData.total_xp} XP total</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(getProgressToNextLevel())}% para o nível {gamificationData.current_level + 1}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};