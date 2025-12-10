import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff, FlaskConical, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { BulkLessonEnhancer } from "@/components/BulkLessonEnhancer";
import { CourseLessonEnhancer } from "@/components/CourseLessonEnhancer";
import { BulkAudioGenerator } from "@/components/BulkAudioGenerator";
import { SeedDataButton } from "@/components/SeedDataButton";
import { BulkExerciseRegenerator } from "@/components/BulkExerciseRegenerator";
import { EnemContentPopulator } from "@/components/EnemContentPopulator";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  order_index: number;
  lessons_count: number;
  admin_only: boolean;
}

export default function CourseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    level: "A1",
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select(`
          *,
          lessons (count)
        `)
        .order("level")
        .order("order_index");

      if (error) throw error;

      const formatted = coursesData.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description || "",
        level: course.level,
        order_index: course.order_index,
        lessons_count: course.lessons?.[0]?.count || 0,
        admin_only: course.admin_only || false,
      }));

      setCourses(formatted);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  const createCourse = async () => {
    if (!newCourse.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the highest order_index for this level
      const { data: existingCourses } = await supabase
        .from("courses")
        .select("order_index")
        .eq("level", newCourse.level)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = existingCourses && existingCourses.length > 0 
        ? existingCourses[0].order_index + 1 
        : 0;

      const { error } = await supabase.from("courses").insert({
        title: newCourse.title,
        description: newCourse.description,
        level: newCourse.level,
        order_index: nextOrderIndex,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      setNewCourse({ title: "", description: "", level: "A1" });
      setShowCreateForm(false);
      fetchCourses();
    } catch (error: any) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all associated lessons and exercises.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });

      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const toggleCourseVisibility = async (courseId: string, currentAdminOnly: boolean) => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ admin_only: !currentAdminOnly })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Visibilidade atualizada",
        description: !currentAdminOnly 
          ? "Curso agora está oculto para usuários" 
          : "Curso agora está visível para todos",
      });

      fetchCourses();
    } catch (error: any) {
      console.error("Error toggling visibility:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar visibilidade",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Course Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage English learning courses
            </p>
          </div>
          
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? "Cancel" : "Create Course"}
          </Button>
        </div>

        {/* Add Bulk Tools at the top */}
        <div className="mb-8 space-y-4">
          <BulkLessonEnhancer />
          <BulkAudioGenerator />
          <BulkExerciseRegenerator />
          <EnemContentPopulator />
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Course Title</label>
                <Input
                  placeholder="e.g., Basic Greetings"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe what students will learn in this course..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Level</label>
                <Select
                  value={newCourse.level}
                  onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={createCourse} className="w-full">
                Create Course
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <FlaskConical className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.filter(c => c.admin_only).length}</p>
                <p className="text-sm text-muted-foreground">Cursos em Beta (Ocultos)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.filter(c => !c.admin_only).length}</p>
                <p className="text-sm text-muted-foreground">Cursos Publicados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beta Courses Section */}
        {courses.filter(c => c.admin_only).length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <FlaskConical className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-bold">Cursos em Beta</h2>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Visível apenas para admins
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(c => c.admin_only).map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-all border-yellow-500/50 bg-yellow-500/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {course.title}
                          <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            {course.level}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description || "No description"}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{course.lessons_count} lessons</span>
                    </div>

                    {/* Publish Button */}
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => toggleCourseVisibility(course.id, course.admin_only)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Publicar Curso
                    </Button>

                    <CourseLessonEnhancer 
                      courseId={course.id} 
                      courseName={course.title}
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Published Courses Section */}
        {courses.filter(c => !c.admin_only).length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold">Cursos Publicados</h2>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                Visível para todos os usuários
              </Badge>
            </div>
            
            {/* Group published courses by level */}
            {["A1", "A2", "B1", "B2", "C1", "C2", "ENEM", "Custom"].map((level) => {
              const levelCourses = courses.filter((c) => !c.admin_only && c.level === level);
              
              if (levelCourses.length === 0) return null;

              return (
                <div key={level} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Level {level}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levelCourses.map((course) => (
                      <Card key={course.id} className="hover:shadow-lg transition-all border-green-500/20">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                {course.title}
                                <Badge variant="outline" className="text-xs bg-green-500/20 text-green-600 border-green-500/30">
                                  Publicado
                                </Badge>
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description || "No description"}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{course.lessons_count} lessons</span>
                          </div>

                          {/* Hide Button */}
                          <Button 
                            variant="outline"
                            className="w-full border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                            onClick={() => toggleCourseVisibility(course.id, course.admin_only)}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Ocultar Curso
                          </Button>

                          <CourseLessonEnhancer 
                            courseId={course.id} 
                            courseName={course.title}
                          />

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/course/${course.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {courses.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first course to get started
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
