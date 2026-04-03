import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function BulkTeacherGuideGenerator() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentLesson: "" });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [regenerateMode, setRegenerateMode] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-for-guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, level")
        .order("order_index");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: existingGuides, refetch: refetchGuides } = useQuery({
    queryKey: ["existing-guides-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_guides")
        .select("course_id, lesson_id");
      if (error) throw error;
      return data || [];
    },
  });

  const getGuideCount = (courseId: string) =>
    existingGuides?.filter((g) => g.course_id === courseId).length || 0;

  const generateForCourse = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setGenerating(true);

    try {
      // Get all lessons for the course
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("course_id", courseId)
        .order("order_index");

      if (error || !lessons) throw new Error("Failed to fetch lessons");

      // Filter out lessons that already have guides (unless regenerating)
      let lessonsToGenerate = lessons;
      if (!regenerateMode) {
        const existingLessonIds = new Set(
          existingGuides?.filter((g) => g.course_id === courseId).map((g) => g.lesson_id) || []
        );
        lessonsToGenerate = lessons.filter((l) => !existingLessonIds.has(l.id));
      }

      if (lessonsToGenerate.length === 0) {
        toast({ title: "Completo", description: "Todas as lições já possuem guias. Ative 'Regerar existentes' para atualizar." });
        setGenerating(false);
        setSelectedCourseId(null);
        return;
      }

      setProgress({ current: 0, total: lessonsToGenerate.length, currentLesson: "" });

      let successCount = 0;
      for (let i = 0; i < lessonsToGenerate.length; i++) {
        const lesson = lessonsToGenerate[i];
        setProgress({ current: i, total: lessonsToGenerate.length, currentLesson: lesson.title });

        try {
          const { data, error: fnError } = await supabase.functions.invoke("generate-teacher-guide", {
            body: { course_id: courseId, lesson_id: lesson.id },
          });

          if (fnError) {
            console.error(`Failed for ${lesson.title}:`, fnError);
          } else if (data?.error) {
            console.error(`API error for ${lesson.title}:`, data.error);
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error generating guide for ${lesson.title}:`, err);
        }

        // Delay to avoid rate limiting (3s for AI API calls)
        await new Promise((r) => setTimeout(r, 3000));
      }

      setProgress((p) => ({ ...p, current: lessonsToGenerate.length }));
      toast({
        title: "Geração concluída",
        description: `${successCount}/${lessonsToGenerate.length} guias gerados com sucesso.`,
      });
      refetchGuides();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
      setSelectedCourseId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Gerar Teacher's Guide em Massa
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gere guias do professor via IA para todas as lições de um curso.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {generating && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Gerando: {progress.currentLesson}</span>
            </div>
            <Progress value={(progress.current / Math.max(progress.total, 1)) * 100} />
            <p className="text-xs text-muted-foreground">
              {progress.current}/{progress.total} lições processadas
            </p>
          </div>
         )}

        <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Regerar guias existentes</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Ative para substituir guias já gerados pelo novo formato interativo com conteúdo para compartilhar tela</p>
            </div>
          </div>
          <Switch checked={regenerateMode} onCheckedChange={setRegenerateMode} disabled={generating} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses?.map((course) => {
            const guideCount = getGuideCount(course.id);
            const isActive = selectedCourseId === course.id;

            return (
              <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{course.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{course.level}</Badge>
                    {guideCount > 0 && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {guideCount} guias
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateForCourse(course.id)}
                  disabled={generating}
                >
                  {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
