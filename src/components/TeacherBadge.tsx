import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface TeacherBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function TeacherBadge({ className = "", size = "sm" }: TeacherBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  
  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ${textSize} ${className}`}
    >
      <GraduationCap className={`${iconSize} mr-1`} />
      Teacher
    </Badge>
  );
}
