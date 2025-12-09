import { Flame, Trophy, Star, Zap } from "lucide-react";

interface GamificationStatsProps {
  streak?: number;
  xp?: number;
  level?: number;
  achievements?: number;
  showLabels?: boolean;
}

export const GamificationStats = ({
  streak = 7,
  xp = 1250,
  level = 5,
  achievements = 12,
  showLabels = true
}: GamificationStatsProps) => {
  const stats = [
    {
      icon: Flame,
      value: streak,
      label: "Dias seguidos",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: Zap,
      value: `${xp} XP`,
      label: "Pontos totais",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Star,
      value: `Nível ${level}`,
      label: "Seu nível",
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      icon: Trophy,
      value: achievements,
      label: "Conquistas",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-8">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div className="text-left">
            <div className="font-bold text-foreground">{stat.value}</div>
            {showLabels && (
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
