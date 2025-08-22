import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Star, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Play
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const stats = [
    { icon: Users, label: "Estudantes Ativos", value: "10.000+" },
    { icon: BookOpen, label: "Cursos Disponíveis", value: "500+" },
    { icon: Star, label: "Avaliação Média", value: "4.9/5" },
    { icon: MessageSquare, label: "Comunidade", value: "50+" },
  ];

  const featuredCourses = [
    {
      id: "1",
      title: "Desenvolvimento Web Completo",
      instructor: "Ana Silva",
      students: 1250,
      rating: 4.8,
      duration: "40h",
      image: "/placeholder.svg",
      price: "R$ 197"
    },
    {
      id: "2", 
      title: "Design UI/UX Moderno",
      instructor: "Carlos Mendes",
      students: 890,
      rating: 4.9,
      duration: "25h",
      image: "/placeholder.svg",
      price: "R$ 149"
    },
    {
      id: "3",
      title: "Marketing Digital Avançado", 
      instructor: "Marina Costa",
      students: 2100,
      rating: 4.7,
      duration: "30h",
      image: "/placeholder.svg",
      price: "R$ 179"
    }
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Cursos Completos",
      description: "Centenas de cursos estruturados com conteúdo atualizado e projetos práticos."
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Conecte-se com outros estudantes, tire dúvidas e compartilhe conhecimento."
    },
    {
      icon: MessageSquare,
      title: "IA Assistant",
      description: "Seu professor virtual está sempre disponível para esclarecer dúvidas."
    },
    {
      icon: Star,
      title: "Qualidade Garantida",
      description: "Todos os cursos são avaliados pela comunidade e constantemente atualizados."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher a Aula Click?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa de aprendizado online com tudo que você precisa para alcançar seus objetivos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cursos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Descubra os cursos mais populares da nossa plataforma
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative">
                  <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                    Destaque
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">por {course.instructor}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{course.price}</span>
                    <Button variant="outline" size="sm">
                      Ver Curso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/courses">
                Ver Todos os Cursos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="bg-gradient-primary text-white p-12">
            <CardContent className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Comece sua jornada de aprendizado hoje
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Junte-se a milhares de estudantes que já transformaram suas carreiras 
                com nossos cursos. Teste grátis por 3 dias!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="secondary" size="xl" asChild>
                  <Link to="/signup">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Começar Teste Grátis
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
                  <Link to="/pricing">
                    Ver Preços
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm opacity-75">
                ✓ Sem compromisso  ✓ Cancele quando quiser  ✓ Acesso completo
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
