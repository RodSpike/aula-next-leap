import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Home, BookOpen, Users, MessageCircle, Trophy, MoreHorizontal, Settings, Mic, UserCircle, Medal, Gamepad2 } from "lucide-react";
import { SpeechTutorDialog } from "@/components/speech-tutor/SpeechTutorDialog";

export const MobileNavigation = () => {
  const location = useLocation();
  const unreadCount = useUnreadMessages();
  const [moreOpen, setMoreOpen] = useState(false);
  const [speechTutorOpen, setSpeechTutorOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Social", href: "/community", icon: Users },
    { name: "Chat", href: "/messages", icon: MessageCircle, badge: unreadCount },
  ];

  const moreItems = [
    { name: "Conquistas", href: "/achievements", icon: Trophy },
    { name: "Click da Semana", href: "/click-of-the-week", icon: Gamepad2 },
    { name: "Amigos", href: "/friends", icon: UserCircle },
    { name: "Hangout", href: "/hangout", icon: Medal },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreItems.some(item => location.pathname === item.href);

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe"
        style={{ 
          zIndex: 9999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
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
          
          {/* AI Tutor Button */}
          <button
            onClick={() => setSpeechTutorOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full px-2 relative transition-colors text-muted-foreground hover:text-primary"
          >
            <Mic className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">AI Tutor</span>
          </button>
          
          {/* More Menu */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full px-2 relative transition-colors",
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className={cn(
                  "h-5 w-5 mb-1",
                  isMoreActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isMoreActive && "font-semibold"
                )}>
                  Mais
                </span>
                {isMoreActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Mais opções</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-4 py-4">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      <SpeechTutorDialog open={speechTutorOpen} onOpenChange={setSpeechTutorOpen} />
    </>
  );
};
