import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Edit2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LessonEditor } from "@/components/LessonEditor";
import { CourseLessonEnhancer } from "@/components/CourseLessonEnhancer";
import { CourseExerciseGenerator } from "@/components/CourseExerciseGenerator";


interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons_count?: number;
  lessons?: any[];
}

interface CourseFormData {
  title: string;
  description: string;
  level: string;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    level: 'A1'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Force fresh data by disabling cache
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons!inner (
            id,
            title,
            order_index,
            content,
            created_at,
            updated_at
          )
        `)
        .order('level', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Remove duplicates - group by course ID and only keep unique courses
      const uniqueCourses = new Map();
      
      data?.forEach(course => {
        if (!uniqueCourses.has(course.id)) {
          uniqueCourses.set(course.id, {
            ...course,
            lessons: []
          });
        }
        
        // Add lessons to the course
        if (course.lessons) {
          const existingCourse = uniqueCourses.get(course.id);
          const lessonArray = Array.isArray(course.lessons) ? course.lessons : [course.lessons];
          
          lessonArray.forEach(lesson => {
            if (!existingCourse.lessons.some((l: any) => l.id === lesson.id)) {
              existingCourse.lessons.push(lesson);
            }
          });
        }
      });

      const coursesArray = Array.from(uniqueCourses.values()).map(course => ({
        ...course,
        lessons_count: course.lessons?.length || 0,
        // Sort lessons by order_index
        lessons: course.lessons?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      }));

      setCourses(coursesArray);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .insert([{
          ...formData,
          order_index: courses.length + 1
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update(formData)
        .eq('id', editingCourse.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all associated lessons.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });

      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      level: course.level
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      level: 'A1'
    });
  };

  const openLessonEditor = (course: Course) => {
    setSelectedCourseForLessons(course);
    if (course.lessons && course.lessons.length > 0) {
      setSelectedLessonId(course.lessons[0].id);
    } else {
      setSelectedLessonId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Create a new English course with level access rules.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter course description"
                />
              </div>
            <div className="grid gap-2">
              <Label htmlFor="level">Course Level</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCourse}>Create Course</Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {course.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {course.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openLessonEditor(course)}
                  >
                    Manage Content
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <span>Level: <strong>{course.level}</strong></span>
                  <span>Lessons: <strong>{course.lessons_count || 0}</strong></span>
                </div>
                <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information and level access rules.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Course Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter course title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter course description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-level">Course Level</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse}>Update Course</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Editor Dialog */}
      <Dialog 
        open={!!selectedCourseForLessons} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCourseForLessons(null);
            setSelectedLessonId(null);
            // Refresh courses when closing to show latest content
            fetchCourses();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Manage Lessons - {selectedCourseForLessons?.title}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchCourses();
                  toast({
                    title: "Refreshed",
                    description: "Course content reloaded",
                  });
                }}
              >
                Refresh
              </Button>
            </DialogTitle>
            <DialogDescription>
              Create and edit lesson content and exercises for this course.
            </DialogDescription>
          </DialogHeader>
          {selectedCourseForLessons && (
            <div className="space-y-4">
              {/* AI Enhancement for All Lessons */}
              {selectedCourseForLessons.lessons && selectedCourseForLessons.lessons.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">AI Content Enhancement</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enhance all {selectedCourseForLessons.lessons.length} lessons with improved visual formatting
                    </p>
                    <CourseLessonEnhancer
                      courseId={selectedCourseForLessons.id}
                      courseName={selectedCourseForLessons.title}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">AI Exercise Generation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate practice exercises for all lessons in this course
                    </p>
                    <CourseExerciseGenerator
                      courseId={selectedCourseForLessons.id}
                      courseName={selectedCourseForLessons.title}
                      lessonCount={selectedCourseForLessons.lessons.length}
                    />
                  </div>
                </div>
              )}
              
              {/* Lesson Selection */}
              {selectedCourseForLessons.lessons && selectedCourseForLessons.lessons.length > 0 && (
                <div>
                  <Label>Select Lesson to Edit ({selectedCourseForLessons.lessons.length} lessons):</Label>
                  <Select
                    value={selectedLessonId || ""} 
                    onValueChange={(value) => {
                      setSelectedLessonId(value);
                      // Refresh to get latest data when switching lessons
                      fetchCourses();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCourseForLessons.lessons
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            Lesson {lesson.order_index + 1}: {lesson.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedLessonId && (
                <LessonEditor
                  key={selectedLessonId}
                  lessonId={selectedLessonId}
                  lessonTitle={selectedCourseForLessons.lessons?.find(l => l.id === selectedLessonId)?.title || "Lesson"}
                  onClose={() => {
                    setSelectedCourseForLessons(null);
                    setSelectedLessonId(null);
                    fetchCourses(); // Refresh courses to update lesson counts
                  }}
                />
              )}
              
              {!selectedLessonId && selectedCourseForLessons.lessons?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  This course has no lessons yet. Use the AI Content Generation to create lessons first.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};