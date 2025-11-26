import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle, PlayCircle, Trophy, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  isUnlocked: boolean;
  lessonsCount: number;
  completedLessons: number;
  isCurrentLevel: boolean;
  admin_only?: boolean;
  course_type?: string;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const progressPercentage = course.lessonsCount > 0 
    ? Math.round((course.completedLessons / course.lessonsCount) * 100) 
    : 0;

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'A1': 'bg-success/10 text-success border-success/20',
      'A2': 'bg-success/10 text-success border-success/20',
      'B1': 'bg-warning/10 text-warning border-warning/20',
      'B2': 'bg-warning/10 text-warning border-warning/20',
      'C1': 'bg-destructive/10 text-destructive border-destructive/20',
      'C2': 'bg-destructive/10 text-destructive border-destructive/20',
      'ENEM': 'bg-primary/10 text-primary border-primary/20',
    };
    return colors[level] || 'bg-muted text-muted-foreground';
  };

  const isEnemCourse = course.course_type === 'enem';

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
      !course.isUnlocked ? 'opacity-60' : ''
    } ${
      course.isCurrentLevel ? 'ring-2 ring-primary' : ''
    }`}>
      <CardHeader className="p-0">
        <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 h-48 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-primary/30" />
          
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
            {course.isCurrentLevel && (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                Current
              </Badge>
            )}
            {course.admin_only && (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                Admin Beta
              </Badge>
            )}
          </div>
          
          <div className="absolute top-3 right-3">
            {!course.isUnlocked ? (
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                <Lock className="h-4 w-4 text-white" />
              </div>
            ) : course.completedLessons === course.lessonsCount && course.lessonsCount > 0 ? (
              <div className="bg-success/80 backdrop-blur-sm rounded-full p-2">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                <PlayCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{course.completedLessons}/{course.lessonsCount} lessons</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {progressPercentage}% Complete
          </div>
        </div>

        {course.isCurrentLevel && course.completedLessons < course.lessonsCount && (
          <div className="flex items-center space-x-2 p-3 bg-primary/10 rounded-lg">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Continue your journey
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        {course.isUnlocked ? (
          <Button 
            variant="outline" 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground" 
            asChild
          >
            <Link to={isEnemCourse ? '/enem-course' : `/course/${course.id}`}>
              <PlayCircle className="h-4 w-4 mr-2" />
              {isEnemCourse 
                ? 'Acessar Curso ENEM' 
                : course.completedLessons === 0 
                  ? 'Start Course' 
                  : 'Continue Learning'}
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Locked - Complete Previous Level
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};