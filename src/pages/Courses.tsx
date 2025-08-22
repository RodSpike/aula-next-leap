import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, MessageSquare, Users, Clock } from "lucide-react";

// English courses data
const courses = [
  {
    id: "1",
    title: "Complete English Grammar Mastery",
    description: "Master English grammar from basic to advanced level with practical exercises and real-world examples.",
    instructor: "Sarah Johnson",
    duration: "40h",
    students: 1250,
    rating: 4.8,
    price: "$49",
    image: "/placeholder.svg",
    level: "Intermediate" as const,
    category: "Grammar",
  },
  {
    id: "2",
    title: "Business English Communication",
    description: "Professional English for workplace communication, presentations, and business writing.",
    instructor: "Michael Brown",
    duration: "25h",
    students: 890,
    rating: 4.9,
    price: "$39",
    image: "/placeholder.svg",
    level: "Advanced" as const,
    category: "Business",
  },
  {
    id: "3",
    title: "English Conversation Practice",
    description: "Improve your speaking skills with interactive conversations and pronunciation practice.",
    instructor: "Emma Davis",
    duration: "30h",
    students: 2100,
    rating: 4.7,
    price: "$45",
    image: "/placeholder.svg",
    level: "Intermediate" as const,
    category: "Speaking",
  },
  {
    id: "4",
    title: "English for Beginners",
    description: "Start your English learning journey with basic vocabulary, grammar, and everyday conversations.",
    instructor: "James Wilson",
    duration: "35h",
    students: 1680,
    rating: 4.8,
    price: "$35",
    image: "/placeholder.svg",
    level: "Beginner" as const,
    category: "Basic",
  },
  {
    id: "5",
    title: "IELTS Preparation Course",
    description: "Comprehensive preparation for IELTS exam with practice tests and expert strategies.",
    instructor: "Lisa Chen",
    duration: "20h",
    students: 750,
    rating: 4.9,
    price: "$65",
    image: "/placeholder.svg",
    level: "Advanced" as const,
    category: "Test Prep",
  },
  {
    id: "6",
    title: "English Writing Skills",
    description: "Improve your English writing for essays, emails, and creative expression.",
    instructor: "Robert Taylor",
    duration: "28h",
    students: 980,
    rating: 4.6,
    price: "$42",
    image: "/placeholder.svg",
    level: "Intermediate" as const,
    category: "Writing",
  },
];

const categories = [
  { name: "All", icon: BookOpen },
  { name: "Basic", icon: Users },
  { name: "Grammar", icon: BookOpen },
  { name: "Business", icon: MessageSquare },
  { name: "Speaking", icon: MessageSquare },
  { name: "Writing", icon: Filter },
  { name: "Test Prep", icon: Clock },
];

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
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
              English Course Catalog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our comprehensive English courses taught by expert instructors. 
              Start your learning journey today.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for courses..."
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
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
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
                No courses found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find courses.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}