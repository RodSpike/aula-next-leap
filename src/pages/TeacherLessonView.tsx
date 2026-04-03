import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, ArrowLeft, BookOpen, Target, Clock, Lightbulb,
  Users, CheckCircle, FileDown, PenLine, ChevronDown, ChevronUp,
  MessageSquare, Home as HomeIcon, Monitor, ExternalLink, Video
} from "lucide-react";

const extractYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.searchParams.get("v");
    if (videoId && videoId.length === 11) return videoId;
  } catch {
    return null;
  }

  return null;
};

const normalizeResource = (resource: any) => {
  if (resource && typeof resource === "object" && !Array.isArray(resource)) {
    return resource;
  }

  return {
    title: String(resource || "Recurso adicional"),
    type: "resource",
    url: "",
  };
};

export default function TeacherLessonView() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPlan, setShowPlan] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [videoDrafts, setVideoDrafts] = useState<Record<number, string>>({});
  const [savingVideoIndex, setSavingVideoIndex] = useState<number | null>(null);
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

  const { data: isAdmin = false } = useQuery({
    queryKey: ["teacher-guide-admin-access", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data === true;
    },
    enabled: !!user,
  });

  const screenContent = (guide?.screen_share_content as any[] | null) || [];
  const objectives = (guide?.objectives as string[] | null) || [];
  const practiceActivities = (guide?.practice_activities as any[] | null) || [];
  const homeworkSuggestions = (guide?.homework_suggestions as string[] | null) || [];
  const additionalResources = ((guide?.additional_resources as any[] | null) || []).map(normalizeResource);

  const updateNote = useCallback((key: string, value: string) => {
    setNotes(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAnswer = useCallback((key: string, value: string) => {
    setExerciseAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateVideoDraft = useCallback((index: number, value: string) => {
    setVideoDrafts((prev) => ({ ...prev, [index]: value }));
  }, []);

  const openVideoEditor = useCallback((index: number, currentUrl?: string | null) => {
    setEditingVideoIndex(index);
    setVideoDrafts((prev) => ({
      ...prev,
      [index]: currentUrl || "",
    }));
  }, []);

  const closeVideoEditor = useCallback(() => {
    setEditingVideoIndex(null);
  }, []);

  const saveVideoResource = useCallback(async (index: number) => {
    if (!lessonId || !guide) return;

    const rawUrl = (videoDrafts[index] || "").trim();
    const videoId = extractYouTubeId(rawUrl);

    if (!videoId) {
      toast({
        title: "Link inválido",
        description: "Cole um link válido do YouTube para embutir o vídeo nesta aula.",
        variant: "destructive",
      });
      return;
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const updatedResources = additionalResources.map((resource, resourceIndex) =>
      resourceIndex === index
        ? {
            ...resource,
            type: "video",
            url: canonicalUrl,
          }
        : resource
    );

    try {
      setSavingVideoIndex(index);

      const { error } = await supabase
        .from("teacher_guides")
        .update({ additional_resources: updatedResources })
        .eq("lesson_id", lessonId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      setEditingVideoIndex(null);
      toast({
        title: "Vídeo atualizado",
        description: "O recurso agora aparece embutido dentro da aula e mantém o link no PDF.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar vídeo",
        description: error.message || "Não foi possível atualizar o link do YouTube.",
        variant: "destructive",
      });
    } finally {
      setSavingVideoIndex(null);
    }
  }, [additionalResources, guide, lessonId, queryClient, toast, videoDrafts]);

  const exportToPdf = useCallback(async () => {
    const printArea = printRef.current;
    if (!printArea) return;

    // Clone the print area for PDF
    const clone = printArea.cloneNode(true) as HTMLElement;

    const replaceInteractiveFields = (selector: string, className: string) => {
      const fields = clone.querySelectorAll<HTMLTextAreaElement>(selector);

      fields.forEach((field) => {
        const div = document.createElement('div');
        div.className = className;
        div.textContent = field.value || '';
        field.parentNode?.replaceChild(div, field);
      });
    };

    replaceInteractiveFields('textarea[data-pdf-kind="answer"]', 'exercise-answer');
    replaceInteractiveFields('textarea[data-pdf-kind="note"]', 'note');

    const lingeringTextareas = clone.querySelectorAll('textarea');
    lingeringTextareas.forEach((ta) => {
      const div = document.createElement('div');
      div.className = 'note';
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
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: hsl(215 25% 27%); }
          h1 { color: hsl(212 95% 50%); font-size: 24px; border-bottom: 2px solid hsl(212 95% 50%); padding-bottom: 8px; }
          h2 { color: hsl(212 95% 40%); font-size: 20px; margin-top: 24px; }
          h3 { color: hsl(215 25% 27%); font-size: 16px; margin-top: 16px; }
          .section { margin-bottom: 20px; padding: 16px; border: 1px solid hsl(214 32% 91%); border-radius: 8px; }
          .note { color: hsl(199 89% 48%); font-style: italic; white-space: pre-wrap; padding: 8px; min-height: 24px; border-left: 3px solid hsl(199 89% 48%); margin: 8px 0; background: hsl(199 89% 48% / 0.08); }
          .exercise-answer { color: hsl(199 89% 48%); font-style: italic; white-space: pre-wrap; min-height: 24px; border-bottom: 1px solid hsl(199 89% 48% / 0.35); padding: 4px 0 8px; }
          .badge { display: inline-block; background: hsl(212 95% 50%); color: hsl(0 0% 100%); padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px; }
          .teacher-note, .no-print, .embedded-video { display: none !important; }
          .pdf-video-url { display: block; margin-top: 6px; word-break: break-word; font-size: 12px; color: hsl(215 25% 27%); }
          .footer { margin-top: 32px; text-align: center; font-size: 12px; color: hsl(215 16% 47%); border-top: 1px solid hsl(214 32% 91%); padding-top: 12px; }
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
                      <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" />
                        Respostas do Aluno
                      </label>
                      <textarea
                        value={exerciseAnswers[`exercise-${i}`] || ''}
                        onChange={(e) => updateAnswer(`exercise-${i}`, e.target.value)}
                        placeholder="Digite as respostas do aluno aqui..."
                        data-pdf-kind="answer"
                        className="w-full min-h-[80px] resize-y rounded-lg border-2 border-info/30 bg-info/10 p-3 text-info italic placeholder:text-info/50 focus:border-info focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Teacher annotation area */}
                  <div className="mt-2">
                    <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                      <PenLine className="h-3 w-3" />
                      Anotações
                    </label>
                    <textarea
                      value={notes[`note-${i}`] || ''}
                      onChange={(e) => updateNote(`note-${i}`, e.target.value)}
                      placeholder="Adicione notas aqui..."
                      data-pdf-kind="note"
                      className="w-full min-h-[48px] resize-y rounded-lg border border-info/30 bg-transparent p-2 text-sm text-info italic placeholder:text-info/50 focus:border-info focus:outline-none"
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
                      <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" />
                        Anotações
                      </label>
                      <textarea
                        value={notes['lesson-content'] || ''}
                        onChange={(e) => updateNote('lesson-content', e.target.value)}
                        placeholder="Adicione notas aqui..."
                        data-pdf-kind="note"
                        className="w-full min-h-[48px] resize-y rounded-lg border border-info/30 bg-transparent p-2 text-sm text-info italic placeholder:text-info/50 focus:border-info focus:outline-none"
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
                      <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" />
                        Respostas / Anotações
                      </label>
                      <textarea
                        value={exerciseAnswers[`activity-${i}`] || ''}
                        onChange={(e) => updateAnswer(`activity-${i}`, e.target.value)}
                        placeholder="Digite respostas e notas aqui..."
                        data-pdf-kind="answer"
                        className="w-full min-h-[80px] resize-y rounded-lg border-2 border-info/30 bg-info/10 p-3 text-info italic placeholder:text-info/50 focus:border-info focus:outline-none"
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
              <CardContent className="p-6 space-y-4">
                {additionalResources.map((res: any, i: number) => {
                  const resourceUrl = typeof res.url === "string" ? res.url.trim() : "";
                  const youtubeId = extractYouTubeId(resourceUrl);
                  const isVideoResource = res.type === "video";
                  const isEditingThisVideo = editingVideoIndex === i;

                  return (
                    <div key={i} className="space-y-3 rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{res.title}</span>
                            {res.type && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {res.type}
                              </Badge>
                            )}
                          </div>

                          {isVideoResource && !resourceUrl && (
                            <p className="text-sm text-muted-foreground">
                              Adicione um link do YouTube para que o vídeo possa ser reproduzido dentro do site.
                            </p>
                          )}

                          {isVideoResource && resourceUrl && !youtubeId && (
                            <p className="text-sm text-muted-foreground">
                              Esse recurso ainda usa um link externo. Troque por um link do YouTube para incorporar o vídeo aqui.
                            </p>
                          )}
                        </div>

                        <div className="no-print flex flex-wrap items-center gap-2">
                          {resourceUrl && (
                            <Button asChild variant="outline" size="sm">
                              <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Abrir link
                              </a>
                            </Button>
                          )}

                          {isAdmin && isVideoResource && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => openVideoEditor(i, resourceUrl)}
                            >
                              <Video className="h-4 w-4" />
                              {youtubeId ? "Editar YouTube" : "Adicionar YouTube"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {isAdmin && isVideoResource && isEditingThisVideo && (
                        <div className="no-print space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                          <p className="text-sm font-medium">
                            Cole um link do YouTube para tocar o vídeo dentro da aula.
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={videoDrafts[i] ?? resourceUrl}
                              onChange={(e) => updateVideoDraft(i, e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => saveVideoResource(i)}
                                disabled={savingVideoIndex === i}
                              >
                                {savingVideoIndex === i ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={closeVideoEditor}
                                disabled={savingVideoIndex === i}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {youtubeId && (
                        <div className="embedded-video no-print overflow-hidden rounded-xl border border-border bg-muted">
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                              title={res.title || `Vídeo ${i + 1}`}
                              className="h-full w-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        </div>
                      )}

                      {resourceUrl && (
                        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Link para o aluno revisar depois da aula
                          </p>
                          <p className="pdf-video-url mt-1 break-all text-sm text-foreground">
                            {resourceUrl}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
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