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
    bg: "bg-card hover:bg-primary/5",
    icon: "bg-primary text-primary-foreground",
    border: "border-border hover:border-primary/40",
    badge: "bg-primary text-primary-foreground"
  },
  secondary: {
    bg: "bg-card hover:bg-secondary/5",
    icon: "bg-secondary text-secondary-foreground",
    border: "border-border hover:border-secondary/40",
    badge: "bg-secondary text-secondary-foreground"
  },
  success: {
    bg: "bg-card hover:bg-success/5",
    icon: "bg-success text-success-foreground",
    border: "border-border hover:border-success/40",
    badge: "bg-success text-success-foreground"
  },
  warning: {
    bg: "bg-card hover:bg-warning/5",
    icon: "bg-warning text-warning-foreground",
    border: "border-border hover:border-warning/40",
    badge: "bg-warning text-warning-foreground"
  },
  info: {
    bg: "bg-card hover:bg-info/5",
    icon: "bg-info text-info-foreground",
    border: "border-border hover:border-info/40",
    badge: "bg-info text-info-foreground"
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
        relative p-6 rounded-2xl border cursor-pointer
        ${colors.bg} ${colors.border}
        transition-all duration-300 ease-out
        hover:scale-[1.03] hover:shadow-xl
        group h-full
      `}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-2.5 -right-2.5 px-3 py-1 rounded-full text-xs font-bold ${colors.badge} shadow-md`}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-4
        ${colors.icon}
        transform transition-all duration-300 group-hover:rotate-3 group-hover:scale-110
        shadow-md
      `}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
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