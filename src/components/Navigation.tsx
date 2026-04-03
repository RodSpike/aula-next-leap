import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen, Users, MessageSquare, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';
  
  const navigation = isHomePage ? [] : [
    { name: "Início", href: "/", icon: BookOpen },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Comunidade", href: "/community", icon: Users },
    { name: "IA Chat", href: "/ai-chat", icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Aula Click</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild className="font-medium">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button variant="hero" size="sm" asChild className="shadow-md hover:shadow-lg transition-shadow group">
              <Link to="/signup">
                Começar
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-3 pt-2 pb-4 space-y-1 bg-background/95 backdrop-blur-md border-t border-border/50">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-base font-medium transition-all ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login" onClick={() => setIsOpen(false)}>Entrar</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/signup" onClick={() => setIsOpen(false)}>Começar</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};