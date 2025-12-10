import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Home, BookOpen, Users, MessageCircle, Trophy, MoreHorizontal, 
  Settings, Mic, UserCircle, Medal, Gamepad2, Moon, Sun,
  Shield, BarChart3, CreditCard, GraduationCap, Tv, Users2
} from "lucide-react";
import { SpeechTutorDialog } from "@/components/speech-tutor/SpeechTutorDialog";
import { useTheme } from "next-themes";

export const MobileNavigation = () => {
  const location = useLocation();
  const unreadCount = useUnreadMessages();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [speechTutorOpen, setSpeechTutorOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const isDark = theme === "dark";

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check if master admin
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email === 'rodspike2k8@gmail.com') {
        setIsAdmin(true);
        return;
      }

      // Check role in database
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(!!data);
    };

    checkAdminStatus();
  }, [user]);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Social", href: "/community", icon: Users },
    { name: "Chat", href: "/messages", icon: MessageCircle, badge: unreadCount },
  ];

  const moreItems = [
    { name: "IA Chat", href: "/ai-chat", icon: MessageCircle },
    { name: "Conquistas", href: "/achievements", icon: Trophy },
    { name: "Click da Semana", href: "/click-of-the-week", icon: Gamepad2 },
    { name: "Amigos", href: "/friends", icon: UserCircle },
    { name: "Hangout", href: "/hangout", icon: Medal },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  const adminItems = [
    { name: "Painel Admin", href: "/admin", icon: Shield },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Pagamentos", href: "/admin/payments", icon: CreditCard },
    { name: "Gerenciar Cursos", href: "/course-management", icon: GraduationCap },
    { name: "English TV", href: "/admin", icon: Tv },
    { name: "Usuários Free", href: "/admin", icon: Users2 },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreItems.some(item => location.pathname === item.href);
  const isAdminActive = adminItems.some(item => location.pathname === item.href);

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
            <SheetContent 
              side="bottom" 
              className="h-auto max-h-[85vh] rounded-t-xl pb-8 overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            >
              <SheetHeader className="animate-fade-in">
                <SheetTitle>Mais opções</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-4 py-4">
                {moreItems.map((item, index) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 hover:scale-105",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    style={{
                      animation: moreOpen ? `fade-in 0.3s ease-out ${index * 0.05}s both` : undefined
                    }}
                  >
                    <item.icon className="h-6 w-6 mb-2 transition-transform duration-200" />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                ))}
              </div>
              
              {/* Admin Section - Only visible to admins */}
              {isAdmin && (
                <>
                  <Separator className="my-4" />
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-2 mb-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Área Admin</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {adminItems.map((item, index) => (
                        <Link
                          key={`${item.href}-${item.name}`}
                          to={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 hover:scale-105 border border-primary/20",
                            isActive(item.href)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-primary/5"
                          )}
                          style={{
                            animation: moreOpen ? `fade-in 0.3s ease-out ${(moreItems.length + index) * 0.05}s both` : undefined
                          }}
                        >
                          <item.icon className="h-5 w-5 mb-1.5 transition-transform duration-200" />
                          <span className="text-[10px] font-medium text-center leading-tight">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Dark Mode Toggle */}
              <div 
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 mb-6 mt-4"
                style={{
                  animation: moreOpen ? `fade-in 0.3s ease-out ${(moreItems.length + (isAdmin ? adminItems.length : 0)) * 0.05}s both` : undefined
                }}
              >
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">Modo Escuro</span>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      <SpeechTutorDialog open={speechTutorOpen} onOpenChange={setSpeechTutorOpen} />
    </>
  );
};
