import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, BookOpen, Target, Clock, Lightbulb, Users, CheckCircle } from "lucide-react";

export default function TeacherGuide() {
  const { courseId } = useParams<{ courseId: string }>();

  usePageMeta({
    title: "Teacher's Guide - Aula Click",
    description: "Guia do professor com planos de aula detalhados.",
    canonicalPath: `/teacher/guide/${courseId}`,
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: guides } = useQuery({
    queryKey: ["teacher-guides", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_guides")
        .select("*")
        .eq("course_id", courseId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const guideMap = new Map(guides?.map(g => [g.lesson_id, g]) || []);

  if (lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <Link to="/teacher/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar ao Painel</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <span className="font-bold text-lg text-primary">Teacher's Guide</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{course?.title || "Curso"}</h1>
          <p className="text-muted-foreground">Nível: {course?.level}</p>
        </div>

        {lessons?.map((lesson) => {
          const guide = guideMap.get(lesson.id);
          return (
            <Card key={lesson.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Lição {lesson.order_index + 1}: {lesson.title}
                  </CardTitle>
                  {guide ? (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Guia Disponível
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Em breve</Badge>
                  )}
                </div>
              </CardHeader>

              {guide && (
                <CardContent className="p-6 space-y-6">
                  {/* Objectives */}
                  {guide.objectives && (guide.objectives as string[]).length > 0 && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        Objetivos da Aula
                      </h3>
                      <ul className="space-y-1">
                        {(guide.objectives as string[]).map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Duração estimada: {guide.estimated_duration_minutes} minutos
                  </div>

                  {/* Warm-up */}
                  {guide.warm_up && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Aquecimento (Warm-up)
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.warm_up}</p>
                    </div>
                  )}

                  {/* Presentation Notes */}
                  {guide.presentation_notes && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        Notas de Apresentação
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.presentation_notes}</p>
                    </div>
                  )}

                  {/* Practice Activities */}
                  {guide.practice_activities && Array.isArray(guide.practice_activities) && (guide.practice_activities as any[]).length > 0 && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        Atividades Práticas
                      </h3>
                      <div className="space-y-3">
                        {(guide.practice_activities as any[]).map((activity: any, i: number) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-3">
                            <p className="font-medium text-sm">{activity.title || `Atividade ${i + 1}`}</p>
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                            {activity.duration && (
                              <p className="text-xs text-muted-foreground mt-1">⏱ {activity.duration}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment Tips */}
                  {guide.assessment_tips && (
                    <div>
                      <h3 className="font-semibold mb-2">Dicas de Avaliação</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.assessment_tips}</p>
                    </div>
                  )}

                  {/* Differentiation Notes */}
                  {guide.differentiation_notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Diferenciação</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.differentiation_notes}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
