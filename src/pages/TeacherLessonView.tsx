import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useCallback } from "react";
import {
  Loader2, ArrowLeft, BookOpen, Target, Clock, Lightbulb,
  Users, CheckCircle, FileDown, PenLine, ChevronDown, ChevronUp,
  MessageSquare, Home as HomeIcon, Monitor
} from "lucide-react";

export default function TeacherLessonView() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [showPlan, setShowPlan] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: "Aula - Teacher's Guide",
    description: "Material de aula interativo para professores.",
    canonicalPath: `/teacher/guide/${courseId}/lesson/${lessonId}`,
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

  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const { data: guide, isLoading } = useQuery({
    queryKey: ["teacher-guide", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_guides")
        .select("*")
        .eq("lesson_id", lessonId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const updateNote = useCallback((key: string, value: string) => {
    setNotes(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAnswer = useCallback((key: string, value: string) => {
    setExerciseAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const exportToPdf = useCallback(async () => {
    const printArea = printRef.current;
    if (!printArea) return;

    // Clone the print area for PDF
    const clone = printArea.cloneNode(true) as HTMLElement;
    
    // Update all textareas to show their values as styled divs
    const textareas = clone.querySelectorAll('textarea');
    textareas.forEach(ta => {
      const div = document.createElement('div');
      div.style.color = '#2563eb';
      div.style.fontStyle = 'italic';
      div.style.whiteSpace = 'pre-wrap';
      div.style.padding = '8px';
      div.style.minHeight = '24px';
      div.style.borderBottom = '1px solid #93c5fd';
      div.textContent = ta.value || '';
      ta.parentNode?.replaceChild(div, ta);
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${lesson?.title || 'Lesson'} - Aula Click</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1a1a2e; }
          h1 { color: #6d28d9; font-size: 24px; border-bottom: 2px solid #6d28d9; padding-bottom: 8px; }
          h2 { color: #1e40af; font-size: 20px; margin-top: 24px; }
          h3 { color: #374151; font-size: 16px; margin-top: 16px; }
          .section { margin-bottom: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .note { color: #2563eb; font-style: italic; padding: 8px; border-left: 3px solid #2563eb; margin: 8px 0; background: #eff6ff; }
          .exercise-answer { color: #2563eb; font-style: italic; border-bottom: 1px solid #93c5fd; padding: 4px 0; }
          .badge { display: inline-block; background: #6d28d9; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px; }
          .teacher-note { display: none; }
          .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>📘 ${lesson?.title || 'Lesson'}</h1>
        <p style="color: #6b7280; font-size: 14px;">${course?.title || ''} • ${course?.level || ''}</p>
        ${clone.innerHTML}
        <div class="footer">
          <p>Aula Click © ${new Date().getFullYear()} • Material gerado para uso pedagógico</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [lesson, course]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const screenContent = (guide?.screen_share_content as any[] | null) || [];
  const objectives = (guide?.objectives as string[] | null) || [];
  const practiceActivities = (guide?.practice_activities as any[] | null) || [];
  const homeworkSuggestions = (guide?.homework_suggestions as string[] | null) || [];
  const additionalResources = (guide?.additional_resources as any[] | null) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-14 items-center px-4 gap-4">
          <Link
            to={`/teacher/guide/${courseId}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Voltar às Lições</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <span className="font-bold text-primary text-sm sm:text-base">{lesson?.title}</span>
              <p className="text-xs text-muted-foreground hidden sm:block">{course?.title} • {course?.level}</p>
            </div>
          </div>
          <Button onClick={exportToPdf} size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 py-6 space-y-6">
        {/* Teacher's Plan - Collapsible (teacher reference only) */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowPlan(!showPlan)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Plano da Aula (Referência do Professor)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Não aparece no PDF</Badge>
                {showPlan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
          {showPlan && guide && (
            <CardContent className="space-y-4">
              {/* Objectives */}
              {objectives.length > 0 && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    Objetivos
                  </h3>
                  <ul className="space-y-1">
                    {objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duration */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duração estimada: {guide.estimated_duration_minutes || 60} minutos
              </div>

              {/* Warm-up */}
              {guide.warm_up && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Aquecimento (Warm-up)
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.warm_up}</p>
                </div>
              )}

              {/* Presentation Notes */}
              {guide.presentation_notes && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <Monitor className="h-4 w-4 text-primary" />
                    Notas de Apresentação (Screen Share)
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.presentation_notes}</p>
                </div>
              )}

              {/* Assessment Tips */}
              {guide.assessment_tips && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Dicas de Avaliação</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.assessment_tips}</p>
                </div>
              )}

              {/* Differentiation Notes */}
              {guide.differentiation_notes && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Diferenciação</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{guide.differentiation_notes}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Separator className="my-4" />

        {/* Screen Share Content - This is the main teaching material */}
        <div ref={printRef} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Material de Aula
            </h2>
            <p className="text-sm text-muted-foreground">Compartilhe sua tela e use como lousa virtual</p>
          </div>

          {screenContent.length > 0 ? (
            screenContent.map((section: any, i: number) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-muted/30 py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {section.type === 'exercise' && <PenLine className="h-4 w-4 text-primary" />}
                      {section.type === 'vocabulary' && <BookOpen className="h-4 w-4 text-primary" />}
                      {section.type === 'dialogue' && <MessageSquare className="h-4 w-4 text-primary" />}
                      {(section.type === 'explanation' || section.type === 'example') && <Lightbulb className="h-4 w-4 text-primary" />}
                      {!['exercise', 'vocabulary', 'dialogue', 'explanation', 'example'].includes(section.type) && <BookOpen className="h-4 w-4 text-primary" />}
                      {section.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs capitalize">{section.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Main content */}
                  <div className="text-sm whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>

                  {/* Teacher notes - visible only to teacher, hidden in PDF */}
                  {section.teacher_notes && (
                    <div className="teacher-note bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary">
                      <p className="font-semibold mb-1">📌 Nota do Professor:</p>
                      <p>{section.teacher_notes}</p>
                    </div>
                  )}

                  {/* Exercise answer area */}
                  {section.type === 'exercise' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-blue-600 flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" />
                        Respostas do Aluno
                      </label>
                      <textarea
                        value={exerciseAnswers[`exercise-${i}`] || ''}
                        onChange={(e) => updateAnswer(`exercise-${i}`, e.target.value)}
                        placeholder="Digite as respostas do aluno aqui..."
                        className="w-full min-h-[80px] p-3 border-2 border-blue-200 rounded-lg text-blue-600 italic placeholder:text-blue-300 focus:border-blue-400 focus:outline-none resize-y bg-blue-50/50"
                      />
                    </div>
                  )}

                  {/* Teacher annotation area */}
                  <div className="mt-2">
                    <label className="text-xs font-medium text-blue-600 flex items-center gap-1 mb-1">
                      <PenLine className="h-3 w-3" />
                      Anotações
                    </label>
                    <textarea
                      value={notes[`note-${i}`] || ''}
                      onChange={(e) => updateNote(`note-${i}`, e.target.value)}
                      placeholder="Adicione notas aqui..."
                      className="w-full min-h-[48px] p-2 border border-blue-200 rounded-lg text-blue-600 italic placeholder:text-blue-300 focus:border-blue-400 focus:outline-none resize-y bg-transparent text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            /* Fallback: use practice activities and lesson content if no screen_share_content */
            <>
              {lesson?.content && (
                <Card>
                  <CardHeader className="bg-muted/30 py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Conteúdo da Lição
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-sm whitespace-pre-line leading-relaxed">
                      {lesson.content.substring(0, 3000)}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-blue-600 flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" />
                        Anotações
                      </label>
                      <textarea
                        value={notes['lesson-content'] || ''}
                        onChange={(e) => updateNote('lesson-content', e.target.value)}
                        placeholder="Adicione notas aqui..."
                        className="w-full min-h-[48px] p-2 border border-blue-200 rounded-lg text-blue-600 italic placeholder:text-blue-300 focus:border-blue-400 focus:outline-none resize-y bg-transparent text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {practiceActivities.length > 0 && practiceActivities.map((activity: any, i: number) => (
                <Card key={i}>
                  <CardHeader className="bg-muted/30 py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {activity.title || `Atividade ${i + 1}`}
                    </CardTitle>
                    {activity.duration && (
                      <Badge variant="outline" className="text-xs w-fit">⏱ {activity.duration}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm whitespace-pre-line">{activity.description}</p>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-blue-600 flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" />
                        Respostas / Anotações
                      </label>
                      <textarea
                        value={exerciseAnswers[`activity-${i}`] || ''}
                        onChange={(e) => updateAnswer(`activity-${i}`, e.target.value)}
                        placeholder="Digite respostas e notas aqui..."
                        className="w-full min-h-[80px] p-3 border-2 border-blue-200 rounded-lg text-blue-600 italic placeholder:text-blue-300 focus:border-blue-400 focus:outline-none resize-y bg-blue-50/50"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {/* Homework Suggestions */}
          {homeworkSuggestions.length > 0 && (
            <Card>
              <CardHeader className="bg-muted/30 py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HomeIcon className="h-4 w-4 text-primary" />
                  Sugestões de Homework
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {homeworkSuggestions.map((hw, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold">{i + 1}.</span>
                      <span>{hw}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Additional Resources */}
          {additionalResources.length > 0 && (
            <Card>
              <CardHeader className="bg-muted/30 py-3">
                <CardTitle className="text-base">Recursos Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {additionalResources.map((res: any, i: number) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{res.title}</span>
                      {res.url && (
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-primary ml-2 underline">
                          Abrir ↗
                        </a>
                      )}
                      {res.type && <Badge variant="outline" className="ml-2 text-xs">{res.type}</Badge>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Export Button at bottom */}
        <div className="flex justify-center py-8">
          <Button onClick={exportToPdf} size="lg" className="gap-2">
            <FileDown className="h-5 w-5" />
            Exportar Material com Anotações (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
}