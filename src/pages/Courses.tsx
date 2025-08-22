import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Code, Palette, TrendingUp } from "lucide-react";

// Mock courses data
const courses = [
  {
    id: "1",
    title: "Desenvolvimento Web Completo com React e Node.js",
    description: "Aprenda a criar aplicações web modernas do zero, desde o frontend até o backend, com as tecnologias mais utilizadas no mercado.",
    instructor: "Ana Silva",
    duration: "40h",
    students: 1250,
    rating: 4.8,
    price: "R$ 197",
    image: "/placeholder.svg",
    level: "Intermediário" as const,
    category: "Desenvolvimento",
  },
  {
    id: "2",
    title: "Design UI/UX: Do Conceito ao Protótipo",
    description: "Domine os princípios fundamentais do design de interfaces e experiência do usuário, criando protótipos profissionais.",
    instructor: "Carlos Mendes",
    duration: "25h",
    students: 890,
    rating: 4.9,
    price: "R$ 149",
    image: "/placeholder.svg",
    level: "Iniciante" as const,
    category: "Design",
  },
  {
    id: "3",
    title: "Marketing Digital Avançado",
    description: "Estratégias avançadas de marketing digital, SEO, redes sociais e análise de dados para maximizar seus resultados online.",
    instructor: "Marina Costa",
    duration: "30h",
    students: 2100,
    rating: 4.7,
    price: "R$ 179",
    image: "/placeholder.svg",
    level: "Avançado" as const,
    category: "Marketing",
  },
  {
    id: "4",
    title: "Python para Análise de Dados",
    description: "Utilize Python e suas bibliotecas para análise de dados, visualização e machine learning básico.",
    instructor: "Dr. Roberto Lima",
    duration: "35h",
    students: 1680,
    rating: 4.8,
    price: "R$ 189",
    image: "/placeholder.svg",
    level: "Intermediário" as const,
    category: "Dados",
  },
  {
    id: "5",
    title: "Fotografia Digital Profissional",
    description: "Técnicas avançadas de fotografia digital, edição e composição para criar imagens impactantes.",
    instructor: "Lucas Ferreira",
    duration: "20h",
    students: 750,
    rating: 4.9,
    price: "R$ 129",
    image: "/placeholder.svg",
    level: "Iniciante" as const,
    category: "Fotografia",
  },
  {
    id: "6",
    title: "Empreendedorismo Digital",
    description: "Aprenda a criar e escalar seu negócio digital do zero, com estratégias práticas e cases de sucesso.",
    instructor: "Paula Santos",
    duration: "28h",
    students: 980,
    rating: 4.6,
    price: "R$ 167",
    image: "/placeholder.svg",
    level: "Intermediário" as const,
    category: "Negócios",
  },
];

const categories = [
  { name: "Todos", icon: BookOpen },
  { name: "Desenvolvimento", icon: Code },
  { name: "Design", icon: Palette },
  { name: "Marketing", icon: TrendingUp },
  { name: "Dados", icon: Filter },
  { name: "Fotografia", icon: Filter },
  { name: "Negócios", icon: TrendingUp },
];

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-subtle py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Catálogo de Cursos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubra centenas de cursos online ministrados por especialistas. 
              Comece sua jornada de aprendizado hoje mesmo.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cursos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className="flex items-center space-x-2"
              >
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
            </h2>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {selectedCategory}
              </Badge>
            </div>
          </div>
          
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground">
                Tente ajustar sua busca ou filtros para encontrar cursos.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}