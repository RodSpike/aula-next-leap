import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo de volta!
          </h1>
          <p className="text-muted-foreground">
            Continue sua jornada de aprendizado
          </p>
          <Badge variant="secondary" className="mt-2">
            ✨ 3 dias grátis restantes
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 em progresso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Estudadas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5</div>
              <p className="text-xs text-muted-foreground">
                Esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Participando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificados</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Conquistados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Continue Assistindo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-accent rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Introdução ao Excel</h3>
                  <p className="text-sm text-muted-foreground">Aula 3 de 10 • 15 min restantes</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <Button size="sm">
                  Continuar
                </Button>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-accent rounded-lg">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Word Avançado</h3>
                  <p className="text-sm text-muted-foreground">Aula 1 de 8 • Recém adicionado</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Iniciar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade da Comunidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-semibold">JS</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">João Silva</span> postou uma nova dúvida em{" "}
                    <span className="text-primary">Excel Básico</span>
                  </p>
                  <p className="text-xs text-muted-foreground">há 2 horas</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold">MF</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">Maria Fernanda</span> compartilhou um arquivo em{" "}
                    <span className="text-primary">Word Avançado</span>
                  </p>
                  <p className="text-xs text-muted-foreground">há 4 horas</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold">RC</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">Roberto Costa</span> completou o curso{" "}
                    <span className="text-primary">PowerPoint Essencial</span>
                  </p>
                  <p className="text-xs text-muted-foreground">ontem</p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                Ver Mais Atividades
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}