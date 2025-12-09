import { Link, useLocation } from "react-router-dom";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Home, BookOpen, Users, MessageCircle, Trophy } from "lucide-react";

export const MobileNavigation = () => {
  const location = useLocation();
  const unreadCount = useUnreadMessages();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Social", href: "/community", icon: Users },
    { name: "Chat", href: "/messages", icon: MessageCircle, badge: unreadCount },
    { name: "XP", href: "/achievements", icon: Trophy },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full px-2 relative transition-colors",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <item.icon className={cn(
                "h-5 w-5 mb-1",
                isActive(item.href) && "scale-110"
              )} />
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center text-[10px] px-1"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
              )}
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              isActive(item.href) && "font-semibold"
            )}>
              {item.name}
            </span>
            {isActive(item.href) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};
