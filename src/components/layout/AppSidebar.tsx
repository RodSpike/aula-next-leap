import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Users, 
  MessageCircle, 
  UserPlus, 
  Trophy, 
  Gamepad2, 
  MessageSquare, 
  Shield,
  BarChart3,
  Settings,
  LogOut,
  Mic,
  Zap,
  Target,
  Home,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { SpeechTutorDialog } from "@/components/speech-tutor/SpeechTutorDialog";

// Simple level badge component
const SimpleLevelBadge = ({ level, size = "md" }: { level: number; size?: "sm" | "md" }) => {
  const tierColor = () => {
    if (level >= 100) return 'from-purple-500 to-pink-500';
    if (level >= 50) return 'from-yellow-500 to-orange-500';
    if (level >= 25) return 'from-yellow-400 to-yellow-600';
    if (level >= 10) return 'from-gray-400 to-gray-500';
    return 'from-amber-600 to-amber-700';
  };
  
  return (
    <div className={cn(
      "bg-gradient-to-r text-white rounded-full flex items-center justify-center font-bold shadow-md",
      tierColor(),
      size === "sm" ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
    )}>
      {level}
    </div>
  );
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  color?: string;
}

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const unreadCount = useUnreadMessages();
  const { gamificationData, getProgressToNextLevel, getXPForNextLevel } = useGamification();
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [speechTutorOpen, setSpeechTutorOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const MASTER_ADMIN_EMAILS = ["rodspike2k8@gmail.com", "luccadtoledo@gmail.com"];

  useEffect(() => {
    const checkAdminAndProfile = async () => {
      if (user) {
        const isMasterAdmin = user?.email ? MASTER_ADMIN_EMAILS.includes(user.email) : false;
        if (isMasterAdmin) {
          setIsAdmin(true);
        } else {
          const { data } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });
          setIsAdmin(data === true);
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(profileData);
      }
    };
    checkAdminAndProfile();
  }, [user]);

  const mainNav: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home, color: "text-blue-500" },
    { name: "Cursos", href: "/courses", icon: BookOpen, color: "text-green-500" },
    { name: "Click da Semana", href: "/click-of-the-week", icon: Target, color: "text-orange-500" },
  ];

  const socialNav: NavItem[] = [
    { name: "Comunidade", href: "/community", icon: Users, color: "text-purple-500" },
    { name: "Mensagens", href: "/messages", icon: MessageCircle, badge: unreadCount, color: "text-pink-500" },
    { name: "Amigos", href: "/friends", icon: UserPlus, color: "text-cyan-500" },
    { name: "Hangout", href: "/hangout", icon: Gamepad2, color: "text-yellow-500" },
  ];

  const toolsNav: NavItem[] = [
    { name: "IA Chat", href: "/ai-chat", icon: MessageSquare, color: "text-indigo-500" },
    { name: "Conquistas", href: "/achievements", icon: Trophy, color: "text-amber-500" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive(item.href)
          ? "bg-primary/10 text-primary font-medium shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <item.icon className={cn(
        "h-5 w-5 shrink-0 transition-all duration-300",
        isActive(item.href) ? "text-primary" : item.color,
        "group-hover:scale-110"
      )} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {item.badge && item.badge > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs animate-pulse">
              {item.badge > 99 ? '99+' : item.badge}
            </Badge>
          )}
        </>
      )}
      {collapsed && item.badge && item.badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </Link>
  );

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </div>
  );

  return (
    <>
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border flex flex-col",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
                Aula Click
              </span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 transition-transform duration-300 hover:scale-110"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Card */}
        {user && gamificationData && (
          <div className={cn(
            "p-4 border-b border-border",
            collapsed && "flex justify-center"
          )}>
            {collapsed ? (
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  <SimpleLevelBadge level={gamificationData.current_level} size="sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-primary/50">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <SimpleLevelBadge level={gamificationData.current_level} size="sm" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {profile?.display_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.cambridge_level ? `Nível ${profile.cambridge_level}` : 'Faça o teste'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      {gamificationData.total_xp} XP
                    </span>
                    <span className="text-muted-foreground">
                      Nível {gamificationData.current_level + 1}
                    </span>
                  </div>
                  <Progress value={getProgressToNextLevel()} className="h-2" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            <NavSection title="Principal" items={mainNav} />
            <NavSection title="Social" items={socialNav} />
            <NavSection title="Ferramentas" items={toolsNav} />
            
            {isAdmin && (
              <NavSection title="Admin" items={[
                { name: "Painel Admin", href: "/admin", icon: Shield, color: "text-red-500" },
                { name: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "text-emerald-500" }
              ]} />
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Theme Toggle */}
          {mounted && (
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-2 transition-all duration-300",
                collapsed && "justify-center px-0"
              )}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <div className="relative h-4 w-4">
                <Sun className={cn(
                  "h-4 w-4 absolute inset-0 transition-all duration-300",
                  theme === 'dark' ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                )} />
                <Moon className={cn(
                  "h-4 w-4 absolute inset-0 transition-all duration-300",
                  theme === 'dark' ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                )} />
              </div>
              {!collapsed && (
                <span className="transition-all duration-200">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              )}
            </Button>
          )}

          {user && (
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:bg-primary/15",
                collapsed && "justify-center px-0"
              )}
              onClick={() => setSpeechTutorOpen(true)}
            >
              <Mic className="h-4 w-4 text-primary" />
              {!collapsed && <span>ClickAI</span>}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Configurações</span>}
          </Button>
          
          {user && (
            <Button 
              variant="ghost" 
              className={cn("w-full justify-start gap-2 text-muted-foreground hover:text-destructive", collapsed && "justify-center px-0")}
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </Button>
          )}
        </div>
      </aside>

      <SpeechTutorDialog open={speechTutorOpen} onOpenChange={setSpeechTutorOpen} />
    </>
  );
};
