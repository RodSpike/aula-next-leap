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
import { SeedDataButton } from "@/components/SeedDataButton";

const Index = () => {
const stats = [
    { icon: Users, label: "Active Students", value: "10,000+" },
    { icon: BookOpen, label: "English Courses", value: "50+" },
    { icon: Star, label: "Average Rating", value: "4.9/5" },
    { icon: MessageSquare, label: "Community Groups", value: "100+" },
  ];

const featuredCourses = [
    {
      id: "1",
      title: "Complete English Grammar",
      instructor: "Sarah Johnson",
      students: 1250,
      rating: 4.8,
      duration: "40h",
      image: "/placeholder.svg",
      price: "$49"
    },
    {
      id: "2", 
      title: "Business English Mastery",
      instructor: "Michael Brown",
      students: 890,
      rating: 4.9,
      duration: "25h",
      image: "/placeholder.svg",
      price: "$39"
    },
    {
      id: "3",
      title: "Advanced Conversation Skills", 
      instructor: "Emma Davis",
      students: 2100,
      rating: 4.7,
      duration: "30h",
      image: "/placeholder.svg",
      price: "$45"
    }
  ];

const features = [
    {
      icon: BookOpen,
      title: "Complete English Courses",
      description: "Structured English courses with updated content and practical exercises."
    },
    {
      icon: Users,
      title: "Active Community",
      description: "Connect with other English learners, ask questions and share knowledge."
    },
    {
      icon: MessageSquare,
      title: "Tutor IA Personalizado",
      description: "Seu tutor virtual está sempre disponível para ajudá-lo a aprender."
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "All courses are evaluated by the community and constantly updated."
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
              Featured English Courses
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover the most popular English courses on our platform
            </p>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex flex-wrap gap-4 justify-center">
              <SeedDataButton />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative">
                  <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                    Featured
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">by {course.instructor}</p>
                  
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
                      View Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/courses">
                View All Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Placement Test Section */}
      <section className="py-20 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Descubra seu nível de inglês
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Faça nosso teste de nivelamento Cambridge gratuito e descubra exatamente onde você está no seu aprendizado de inglês.
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Teste de Nivelamento Cambridge</h3>
                  <p className="text-muted-foreground">Grátis • 10-15 minutos • Resultado imediato</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Níveis A1 a C2</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Certificado gratuito</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Recomendações personalizadas</span>
                </div>
              </div>
              
              <Button size="xl" asChild className="w-full md:w-auto">
                <Link to="/placement-test">
                  <Play className="mr-2 h-5 w-5" />
                  Fazer Teste Gratuito
                </Link>
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Não é necessário criar conta para fazer o teste
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="bg-gradient-primary text-white p-12">
            <CardContent className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Comece sua jornada de aprendizado hoje mesmo
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Junte-se a milhares de estudantes que já melhoraram suas habilidades 
                with our courses. Free 3-day trial!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="secondary" size="xl" asChild>
                  <Link to="/signup">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Start Free Trial
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
                  <Link to="/login">
                    Já tenho conta
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm opacity-75">
                ✓ No commitment  ✓ Cancel anytime  ✓ Full access
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
