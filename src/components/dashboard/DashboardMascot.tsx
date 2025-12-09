import { useMemo } from "react";
import { CupheadFoxMascot, CupheadFoxMood } from "@/components/mascot/CupheadFoxMascot";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardMascotProps {
  userName?: string;
  level?: number;
  totalXp?: number;
  hasCompletedPlacementTest?: boolean;
  coursesCount?: number;
  recentAchievementsCount?: number;
}

export const DashboardMascot = ({
  userName,
  level = 1,
  totalXp = 0,
  hasCompletedPlacementTest = false,
  coursesCount = 0,
  recentAchievementsCount = 0,
}: DashboardMascotProps) => {
  const { mood, message } = useMemo(() => {
    const hour = new Date().getHours();
    const firstName = userName?.split(' ')[0] || 'estudante';
    
    // Priority-based contextual messages
    
    // 1. Recent achievement celebration
    if (recentAchievementsCount > 0) {
      return {
        mood: "celebrating" as CupheadFoxMood,
        message: `Parabéns pelas conquistas, ${firstName}! 🏆`,
      };
    }
    
    // 2. Hasn't taken placement test
    if (!hasCompletedPlacementTest) {
      return {
        mood: "excited" as CupheadFoxMood,
        message: "Bora fazer o teste de nível? 🎯",
      };
    }
    
    // 3. No courses yet
    if (coursesCount === 0) {
      return {
        mood: "waving" as CupheadFoxMood,
        message: "Que tal começar um curso hoje? 📚",
      };
    }
    
    // 4. Level milestones
    if (level >= 10 && level % 5 === 0) {
      return {
        mood: "celebrating" as CupheadFoxMood,
        message: `Nível ${level}! Você é incrível! 🌟`,
      };
    }
    
    // 5. XP milestones
    if (totalXp >= 1000 && totalXp % 500 < 50) {
      return {
        mood: "excited" as CupheadFoxMood,
        message: `${totalXp} XP! Continue assim! ⚡`,
      };
    }
    
    // 6. Time-based greetings
    if (hour >= 5 && hour < 12) {
      const morningMessages = [
        `Bom dia, ${firstName}! Pronto pra estudar? ☀️`,
        "Manhã perfeita para aprender! 📖",
        `Oi ${firstName}! Vamos começar o dia bem? 🌅`,
      ];
      return {
        mood: "happy" as CupheadFoxMood,
        message: morningMessages[Math.floor(Math.random() * morningMessages.length)],
      };
    }
    
    if (hour >= 12 && hour < 18) {
      const afternoonMessages = [
        `Boa tarde, ${firstName}! 🌤️`,
        "Hora de praticar um pouco? 💪",
        `Que tal uma lição rápida, ${firstName}?`,
      ];
      return {
        mood: "studying" as CupheadFoxMood,
        message: afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)],
      };
    }
    
    if (hour >= 18 && hour < 22) {
      const eveningMessages = [
        `Boa noite, ${firstName}! 🌙`,
        "Revisão noturna? Ótima ideia! ✨",
        `${firstName}, bora terminar o dia estudando?`,
      ];
      return {
        mood: "thinking" as CupheadFoxMood,
        message: eveningMessages[Math.floor(Math.random() * eveningMessages.length)],
      };
    }
    
    // Late night
    return {
      mood: "sleeping" as CupheadFoxMood,
      message: `Estudando tarde, ${firstName}? 😴💤`,
    };
  }, [userName, level, totalXp, hasCompletedPlacementTest, coursesCount, recentAchievementsCount]);

  return (
    <Card className="bg-gradient-to-br from-[#FFF8DC]/50 to-[#FFE4B5]/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="shrink-0">
          <CupheadFoxMascot mood={mood} size="md" animate={true} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-lg" style={{ fontFamily: "serif" }}>
            Click diz:
          </p>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
