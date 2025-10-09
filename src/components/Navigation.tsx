import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen, Users, Star, User, LogOut, MessageSquare, Shield, UserPlus, Trophy, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const MASTER_ADMIN_EMAILS = ["rodspike2k8@gmail.com", "luccadtoledo@gmail.com"];

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        console.log('Checking admin status for user:', user.id, user.email);
        
        // First check if user is master admin
        const isMasterAdmin = user?.email ? MASTER_ADMIN_EMAILS.includes(user.email) : false;
        console.log('Is master admin:', isMasterAdmin);
        
        if (isMasterAdmin) {
          console.log('User is master admin, setting admin status to true');
          setIsAdmin(true);
          return;
        }
        
        // Check if user has admin role in database using the has_role function
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        
        console.log('Admin role check result:', { data, error });
        
        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          return;
        }
        
        console.log('Setting admin status to:', data);
        setIsAdmin(data === true);
      } else {
        console.log('No user, setting admin status to false');
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Desconectado",
        description: "Até mais!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desconectar.",
        variant: "destructive",
      });
    }
  };
  
  const navigation = [
    user 
      ? { name: "My Dashboard", href: "/dashboard", icon: User }
      : { name: "Início", href: "/", icon: BookOpen },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Comunidade", href: "/community", icon: Users },
    { name: "Amigos", href: "/friends", icon: UserPlus },
    ...(user ? [{ name: "Mensagens", href: "/messages", icon: MessageCircle }] : []),
    { name: "IA Chat", href: "/ai-chat", icon: MessageSquare },
    ...(user ? [{ name: "Conquistas", href: "/achievements", icon: Trophy }] : []),
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Aula Click</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={item.name === "My Dashboard" ? () => {
                  // Clear navigation persistence to force dashboard navigation
                  localStorage.removeItem('aula-click-nav-state');
                } : undefined}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Minha Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/dashboard" 
                      onClick={() => {
                        // Clear navigation persistence to force dashboard navigation
                        localStorage.removeItem('aula-click-nav-state');
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user?.id || ''}`}>
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/signup">Começar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.href)
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login" onClick={() => setIsOpen(false)}>Entrar</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>Começar</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};