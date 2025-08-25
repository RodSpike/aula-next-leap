import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: string;
  image: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-success/10 text-success border-success/20";
      case "Intermediate":
        return "bg-warning/10 text-warning border-warning/20";
      case "Advanced":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
          </div>
          <div className="absolute top-3 right-3">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
              <Play className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {course.category}
            </Badge>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="text-sm font-medium">{course.rating}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>by {course.instructor}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.students.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{course.price}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button variant="outline" className="w-full group-hover:variant-primary" asChild>
          <Link to={`/course/${course.id}`}>
            View Course
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};