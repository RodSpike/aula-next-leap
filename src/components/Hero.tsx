import { Button } from "@/components/ui/button";
import { Play, Star, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-education.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-primary">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Plataforma de Aprendizado Online</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Aprenda sem
                <span className="bg-gradient-primary bg-clip-text text-transparent"> limites</span>
                <br />
                com a Aula Click
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Descubra uma nova forma de aprender com cursos interativos, 
                comunidade ativa e suporte personalizado com IA. Comece sua 
                jornada educacional hoje mesmo.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full border-2 border-background"></div>
                  <div className="w-8 h-8 bg-secondary rounded-full border-2 border-background"></div>
                  <div className="w-8 h-8 bg-success rounded-full border-2 border-background"></div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">+10.000 estudantes</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="flex text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-medium text-muted-foreground">4.9 (500+ avaliações)</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup" className="group">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Começar Teste Grátis
                </Link>
              </Button>
              
              <Button variant="outline" size="xl" asChild>
                <Link to="/courses" className="group">
                  <Play className="mr-2 h-5 w-5" />
                  Ver Cursos
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Cursos Completos</h3>
                  <p className="text-xs text-muted-foreground">Conteúdo atualizado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Comunidade</h3>
                  <p className="text-xs text-muted-foreground">Conecte-se com outros</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">IA Assistant</h3>
                  <p className="text-xs text-muted-foreground">Suporte inteligente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Estudantes aprendendo com tecnologia"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-lg z-20 animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-sm font-medium">Aula ao vivo</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-lg z-20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">127 estudantes</p>
                  <p className="text-xs text-muted-foreground">online agora</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};