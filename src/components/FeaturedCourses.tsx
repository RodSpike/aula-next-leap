import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star, Play, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  lessons?: { id: string }[];
}

export function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data: coursesData, error } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            level,
            lessons(id)
          `)
          .order('order_index')
          .limit(6);

        if (error) {
          console.error('Error fetching courses:', error);
          return;
        }

        // Randomize and take only 3 courses
        const shuffled = coursesData?.sort(() => 0.5 - Math.random()) || [];
        setCourses(shuffled.slice(0, 3));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getEstimatedHours = (lessonCount: number) => {
    // Estimate 30-45 minutes per lesson
    const hours = Math.ceil(lessonCount * 0.6); 
    return `${hours}h`;
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      A1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      A2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      B1: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      B2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      C1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      C2: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cursos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Carregando cursos disponíveis...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cursos em Destaque
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubra os cursos de inglês mais populares da nossa plataforma
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative">
                <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
                <Badge className={`absolute top-3 left-3 ${getLevelColor(course.level)}`}>
                  Nível {course.level}
                </Badge>
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  Destaque
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description || "Curso completo de inglês com exercícios práticos e conteúdo atualizado."}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{getEstimatedHours(course.lessons?.length || 0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{Math.floor(Math.random() * 1000) + 200}+ alunos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span>{(4.5 + Math.random() * 0.4).toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Incluído na assinatura premium
                    </p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Acesso completo
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/course/${course.id}`}>
                      Ver Curso
                    </Link>
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
  );
}