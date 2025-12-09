import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface GamifiedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "primary" | "secondary" | "success" | "warning" | "info";
  badge?: string;
  progress?: number;
  onClick?: () => void;
}

const colorClasses = {
  primary: {
    bg: "bg-primary/10 hover:bg-primary/20",
    icon: "bg-primary text-white",
    border: "border-primary/30",
    badge: "bg-primary text-white"
  },
  secondary: {
    bg: "bg-secondary/10 hover:bg-secondary/20",
    icon: "bg-secondary text-white",
    border: "border-secondary/30",
    badge: "bg-secondary text-white"
  },
  success: {
    bg: "bg-success/10 hover:bg-success/20",
    icon: "bg-success text-white",
    border: "border-success/30",
    badge: "bg-success text-white"
  },
  warning: {
    bg: "bg-warning/10 hover:bg-warning/20",
    icon: "bg-warning text-warning-foreground",
    border: "border-warning/30",
    badge: "bg-warning text-warning-foreground"
  },
  info: {
    bg: "bg-info/10 hover:bg-info/20",
    icon: "bg-info text-white",
    border: "border-info/30",
    badge: "bg-info text-white"
  }
};

export const GamifiedFeatureCard = ({
  icon: Icon,
  title,
  description,
  color,
  badge,
  progress,
  onClick
}: GamifiedFeatureCardProps) => {
  const colors = colorClasses[color];

  return (
    <div 
      onClick={onClick}
      className={`
        relative p-6 rounded-2xl border-2 cursor-pointer
        ${colors.bg} ${colors.border}
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-lg
        group
      `}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold ${colors.badge} shadow-md`}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center mb-4
        ${colors.icon}
        transform transition-transform group-hover:rotate-6 group-hover:scale-110
        shadow-md
      `}>
        <Icon className="h-7 w-7" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${colors.icon} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
