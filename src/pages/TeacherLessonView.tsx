import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cleanHtmlContent } from "@/utils/cleanHtmlContent";
import {
  Loader2, ArrowLeft, BookOpen, Target, Clock, Lightbulb,
  Users, CheckCircle, FileDown, PenLine, ChevronDown, ChevronUp,
  MessageSquare, Home as HomeIcon, Monitor, ExternalLink, Video,
  Trash2, Plus, FileText as FileTextIcon, Link as LinkIcon, RotateCcw, Image as ImageIcon, Save
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  } catch { return null; }
  return null;
};

const normalizeResource = (resource: any) => {
  if (resource && typeof resource === "object" && !Array.isArray(resource)) return resource;
  return { title: String(resource || "Recurso adicional"), type: "resource", url: "" };
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
  const [addingResource, setAddingResource] = useState(false);
  const [newResourceType, setNewResourceType] = useState<"video" | "worksheet">("video");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [savingNewResource, setSavingNewResource] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [uploadingSectionImage, setUploadingSectionImage] = useState<number | null>(null);
  const sectionImageInputRef = useRef<HTMLInputElement>(null);
  const [pendingSectionIndex, setPendingSectionIndex] = useState<number | null>(null);
  const [editingSectionContent, setEditingSectionContent] = useState<number | null>(null);
  const [sectionContentDraft, setSectionContentDraft] = useState("");
  const [savingSectionContent, setSavingSectionContent] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: "Aula - Teacher's Guide",
    description: "Material de aula interativo para professores.",
    canonicalPath: `/teacher/guide/${courseId}/lesson/${lessonId}`,
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("id", lessonId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const { data: guide, isLoading } = useQuery({
    queryKey: ["teacher-guide", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_guides").select("*").eq("lesson_id", lessonId!).single();
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

  const { data: isTeacherRole = false } = useQuery({
    queryKey: ["teacher-guide-teacher-access", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "teacher" });
      return data === true;
    },
    enabled: !!user,
  });

  // Teachers and admins can edit guides
  const canEdit = isAdmin || isTeacherRole;

  const screenContent = (guide?.screen_share_content as any[] | null) || [];
  const objectives = (guide?.objectives as string[] | null) || [];
  const practiceActivities = (guide?.practice_activities as any[] | null) || [];
  const homeworkSuggestions = (guide?.homework_suggestions as string[] | null) || [];
  const additionalResources = ((guide?.additional_resources as any[] | null) || []).map(normalizeResource);
  const flashcards = ((guide as any)?.flashcards as any[] | null) || [];

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
    setVideoDrafts((prev) => ({ ...prev, [index]: currentUrl || "" }));
  }, []);

  const closeVideoEditor = useCallback(() => { setEditingVideoIndex(null); }, []);

  const toggleFlashcard = useCallback((index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const triggerSectionImageUpload = useCallback((sectionIndex: number) => {
    setPendingSectionIndex(sectionIndex);
    setTimeout(() => sectionImageInputRef.current?.click(), 0);
  }, []);

  const handleSectionImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const sectionIndex = pendingSectionIndex;
    if (!file || sectionIndex === null || !lessonId || !guide) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    try {
      setUploadingSectionImage(sectionIndex);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${lessonId}/${Date.now()}-section-${sectionIndex}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("teacher-guide-images")
        .upload(fileName, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("teacher-guide-images").getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error("Failed to get public URL");

      const updatedContent = [...screenContent];
      updatedContent[sectionIndex] = { ...updatedContent[sectionIndex], image_url: publicUrl };
      const { error } = await supabase.from("teacher_guides").update({ screen_share_content: updatedContent }).eq("lesson_id", lessonId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      toast({ title: "Imagem adicionada com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploadingSectionImage(null);
      setPendingSectionIndex(null);
      if (sectionImageInputRef.current) sectionImageInputRef.current.value = '';
    }
  }, [pendingSectionIndex, lessonId, guide, screenContent, queryClient, toast]);

  const removeSectionImage = useCallback(async (sectionIndex: number) => {
    if (!lessonId || !guide) return;
    const updatedContent = [...screenContent];
    const { image_url, ...rest } = updatedContent[sectionIndex];
    updatedContent[sectionIndex] = rest;
    try {
      const { error } = await supabase.from("teacher_guides").update({ screen_share_content: updatedContent }).eq("lesson_id", lessonId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      toast({ title: "Imagem removida" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [lessonId, guide, screenContent, queryClient, toast]);

  const startEditingSectionContent = useCallback((sectionIndex: number, currentContent: string) => {
    setEditingSectionContent(sectionIndex);
    setSectionContentDraft(cleanHtmlContent(currentContent || ""));
  }, []);

  const saveSectionContent = useCallback(async () => {
    if (editingSectionContent === null || !lessonId || !guide) return;
    try {
      setSavingSectionContent(true);
      const updatedContent = [...screenContent];
      updatedContent[editingSectionContent] = { ...updatedContent[editingSectionContent], content: sectionContentDraft };
      const { error } = await supabase.from("teacher_guides").update({ screen_share_content: updatedContent }).eq("lesson_id", lessonId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      setEditingSectionContent(null);
      toast({ title: "Conteúdo atualizado" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSavingSectionContent(false);
    }
  }, [editingSectionContent, lessonId, guide, screenContent, sectionContentDraft, queryClient, toast]);

  const deleteResource = useCallback(async (index: number) => {
    if (!lessonId || !guide) return;
    const updatedResources = additionalResources.filter((_, i) => i !== index);
    try {
      const { error } = await supabase.from("teacher_guides").update({ additional_resources: updatedResources }).eq("lesson_id", lessonId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      toast({ title: "Recurso removido" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [additionalResources, guide, lessonId, queryClient, toast]);

  const addNewResource = useCallback(async () => {
    if (!lessonId || !guide) return;
    const title = newResourceTitle.trim();
    const url = newResourceUrl.trim();
    if (!title) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    if (newResourceType === "video" && url) {
      const videoId = extractYouTubeId(url);
      if (!videoId) { toast({ title: "Link do YouTube inválido", variant: "destructive" }); return; }
    }
    const newResource = {
      title, type: newResourceType,
      url: newResourceType === "video" && url ? `https://www.youtube.com/watch?v=${extractYouTubeId(url)}` : url,
    };
    const updatedResources = [...additionalResources, newResource];
    try {
      setSavingNewResource(true);
      const { error } = await supabase.from("teacher_guides").update({ additional_resources: updatedResources }).eq("lesson_id", lessonId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      setAddingResource(false); setNewResourceTitle(""); setNewResourceUrl("");
      toast({ title: "Recurso adicionado" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally { setSavingNewResource(false); }
  }, [additionalResources, guide, lessonId, newResourceTitle, newResourceType, newResourceUrl, queryClient, toast]);

  const saveVideoResource = useCallback(async (index: number) => {
    if (!lessonId || !guide) return;
    const rawUrl = (videoDrafts[index] || "").trim();
    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      toast({ title: "Link inválido", description: "Cole um link válido do YouTube.", variant: "destructive" });
      return;
    }
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const updatedResources = additionalResources.map((resource, ri) =>
      ri === index ? { ...resource, type: "video", url: canonicalUrl } : resource
    );
    try {
      setSavingVideoIndex(index);
      const { error } = await supabase.from("teacher_guides").update({ additional_resources: updatedResources }).eq("lesson_id", lessonId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-guide", lessonId] });
      setEditingVideoIndex(null);
      toast({ title: "Vídeo atualizado" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar vídeo", description: error.message, variant: "destructive" });
    } finally { setSavingVideoIndex(null); }
  }, [additionalResources, guide, lessonId, queryClient, toast, videoDrafts]);

  const exportToPdf = useCallback(async () => {
    const printArea = printRef.current;
    if (!printArea) return;

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

    // Show all flashcard backs in PDF
    const flashcardBacks = clone.querySelectorAll('[data-flashcard-back]');
    flashcardBacks.forEach((el) => {
      (el as HTMLElement).style.display = 'block';
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
          .flashcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
          .flashcard-pdf { border: 1px solid hsl(214 32% 91%); border-radius: 8px; padding: 12px; }
          .flashcard-pdf .front { font-weight: bold; margin-bottom: 4px; }
          .flashcard-pdf .back { color: hsl(215 16% 47%); font-size: 14px; }
          .flashcard-pdf img { max-width: 120px; max-height: 80px; margin-top: 8px; border-radius: 4px; }
          .section-image { max-width: 100%; max-height: 300px; border-radius: 8px; margin: 12px 0; }
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
    setTimeout(() => { printWindow.print(); }, 500);
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
      {/* Hidden file input for section image uploads */}
      <input
        ref={sectionImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSectionImageUpload}
      />
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
        {/* Teacher's Plan - Collapsible */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="cursor-pointer" onClick={() => setShowPlan(!showPlan)}>
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
              {objectives.length > 0 && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <Target className="h-4 w-4 text-primary" /> Objetivos
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duração estimada: {guide.estimated_duration_minutes || 60} minutos
              </div>
              {guide.warm_up && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-primary" /> Aquecimento (Warm-up)
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{cleanHtmlContent(guide.warm_up)}</p>
                </div>
              )}
              {guide.presentation_notes && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <Monitor className="h-4 w-4 text-primary" /> Notas de Apresentação
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{cleanHtmlContent(guide.presentation_notes)}</p>
                </div>
              )}
              {guide.assessment_tips && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Dicas de Avaliação</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{cleanHtmlContent(guide.assessment_tips)}</p>
                </div>
              )}
              {guide.differentiation_notes && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Diferenciação</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{cleanHtmlContent(guide.differentiation_notes)}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Separator className="my-4" />

        {/* Screen Share Content */}
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
                  {/* Admin image upload */}
                  {canEdit && !section.image_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 no-print"
                      onClick={() => triggerSectionImageUpload(i)}
                      disabled={uploadingSectionImage === i}
                    >
                      {uploadingSectionImage === i ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                      Adicionar Imagem
                    </Button>
                  )}

                  {/* Section image */}
                  {section.image_url && (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={section.image_url}
                        alt={section.title || `Illustration ${i + 1}`}
                        className="section-image max-w-full max-h-[300px] rounded-xl border border-border object-contain"
                        loading="lazy"
                      />
                      {canEdit && (
                        <div className="flex gap-2 no-print">
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => triggerSectionImageUpload(i)}>
                            <RotateCcw className="h-3 w-3" /> Trocar
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => removeSectionImage(i)}>
                            <Trash2 className="h-3 w-3" /> Remover
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section content - with HTML cleaning */}
                  {editingSectionContent === i && canEdit ? (
                    <div className="space-y-2 no-print">
                      <Textarea
                        value={sectionContentDraft}
                        onChange={(e) => setSectionContentDraft(e.target.value)}
                        className="min-h-[200px] text-sm"
                        placeholder="Edite o conteúdo da seção..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1" onClick={saveSectionContent} disabled={savingSectionContent}>
                          {savingSectionContent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingSectionContent(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="text-sm whitespace-pre-line leading-relaxed">{cleanHtmlContent(section.content)}</div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                          onClick={() => startEditingSectionContent(i, section.content)}
                        >
                          <PenLine className="h-3 w-3" /> Editar Conteúdo
                        </Button>
                      )}
                    </div>
                  )}

                  {section.teacher_notes && (
                    <div className="teacher-note bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary">
                      <p className="font-semibold mb-1">📌 Nota do Professor:</p>
                      <p>{cleanHtmlContent(section.teacher_notes)}</p>
                    </div>
                  )}

                  {section.type === 'exercise' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" /> Respostas do Aluno
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

                  <div className="mt-2">
                    <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                      <PenLine className="h-3 w-3" /> Anotações
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
            <>
              {lesson?.content && (
                <Card>
                  <CardHeader className="bg-muted/30 py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Conteúdo da Lição
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-sm whitespace-pre-line leading-relaxed">{lesson.content.substring(0, 3000)}</div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" /> Anotações
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
                      <label className="text-xs font-medium text-info flex items-center gap-1 mb-1">
                        <PenLine className="h-3 w-3" /> Respostas / Anotações
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

          {/* Flashcards Section */}
          {flashcards.length > 0 && (
            <Card>
              <CardHeader className="bg-muted/30 py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  Flashcards
                </CardTitle>
                <p className="text-xs text-muted-foreground">Clique para virar e revelar a resposta</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {flashcards.map((card: any, i: number) => {
                    const isFlipped = flippedCards[i] || false;
                    return (
                      <div
                        key={i}
                        onClick={() => toggleFlashcard(i)}
                        className="cursor-pointer rounded-xl border-2 border-primary/20 bg-background p-4 min-h-[120px] flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-primary/50 hover:shadow-md"
                      >
                        {card.category && (
                          <Badge variant="outline" className="text-xs mb-2 capitalize">{card.category}</Badge>
                        )}
                        {!isFlipped ? (
                          <>
                            {card.image_url && (
                              <img
                                src={card.image_url}
                                alt={card.front}
                                className="max-w-[140px] max-h-[90px] rounded-lg mb-2 object-contain"
                                loading="lazy"
                              />
                            )}
                            <p className="font-semibold text-foreground">{card.front}</p>
                            <p className="text-xs text-muted-foreground mt-2">Toque para ver a resposta</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-primary font-medium">{card.back}</p>
                            <p className="text-xs text-muted-foreground mt-2">Toque para voltar</p>
                          </>
                        )}
                        {/* Hidden back for PDF export */}
                        <div data-flashcard-back className="hidden">
                          <p className="text-sm"><strong>{card.front}</strong> → {card.back}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PDF-only flashcard table */}
                <div className="hidden" data-pdf-flashcard-table>
                  <h3 style={{ marginTop: '16px', fontSize: '14px', fontWeight: 'bold' }}>Flashcards - Referência</h3>
                  <div className="flashcard-grid">
                    {flashcards.map((card: any, i: number) => (
                      <div key={i} className="flashcard-pdf">
                        <div className="front">{card.front}</div>
                        <div className="back">{card.back}</div>
                        {card.image_url && <img src={card.image_url} alt={card.front} />}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Homework Suggestions */}
          {homeworkSuggestions.length > 0 && (
            <Card>
              <CardHeader className="bg-muted/30 py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HomeIcon className="h-4 w-4 text-primary" /> Sugestões de Homework
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
          {(additionalResources.length > 0 || canEdit) && (
            <Card>
              <CardHeader className="bg-muted/30 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recursos Adicionais</CardTitle>
                  {canEdit && (
                    <Button type="button" variant="outline" size="sm" className="no-print" onClick={() => setAddingResource(true)}>
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  )}
                </div>
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
                            {res.type && <Badge variant="outline" className="text-xs capitalize">{res.type}</Badge>}
                          </div>
                          {isVideoResource && !resourceUrl && (
                            <p className="text-sm text-muted-foreground">Adicione um link do YouTube.</p>
                          )}
                        </div>
                        <div className="no-print flex flex-shrink-0 flex-wrap items-center gap-2">
                          {resourceUrl && (
                            <Button asChild variant="outline" size="sm">
                              <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" /> Abrir link
                              </a>
                            </Button>
                          )}
                          {canEdit && isVideoResource && (
                            <Button type="button" variant="secondary" size="sm" onClick={() => openVideoEditor(i, resourceUrl)}>
                              <Video className="h-4 w-4" /> {youtubeId ? "Editar YouTube" : "Adicionar YouTube"}
                            </Button>
                          )}
                          {canEdit && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover recurso</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que deseja remover "{res.title}"?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteResource(i)}>Remover</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      {canEdit && isVideoResource && isEditingThisVideo && (
                        <div className="no-print space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                          <p className="text-sm font-medium">Cole um link do YouTube.</p>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input value={videoDrafts[i] ?? resourceUrl} onChange={(e) => updateVideoDraft(i, e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={() => saveVideoResource(i)} disabled={savingVideoIndex === i}>
                                {savingVideoIndex === i ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={closeVideoEditor} disabled={savingVideoIndex === i}>Cancelar</Button>
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
                          <p className="text-xs font-medium text-muted-foreground">Link para o aluno revisar</p>
                          <p className="pdf-video-url mt-1 break-all text-sm text-foreground">{resourceUrl}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add new resource form */}
                {canEdit && addingResource && (
                  <div className="no-print space-y-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                    <p className="text-sm font-semibold">Novo Recurso</p>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={newResourceType === "video" ? "default" : "outline"} onClick={() => setNewResourceType("video")}>
                        <Video className="h-4 w-4" /> Vídeo YouTube
                      </Button>
                      <Button type="button" size="sm" variant={newResourceType === "worksheet" ? "default" : "outline"} onClick={() => setNewResourceType("worksheet")}>
                        <FileTextIcon className="h-4 w-4" /> Worksheet / Link
                      </Button>
                    </div>
                    <Input value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} placeholder="Título do recurso" />
                    <Input value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} placeholder={newResourceType === "video" ? "https://www.youtube.com/watch?v=..." : "https://docs.google.com/..."} />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={addNewResource} disabled={savingNewResource}>
                        {savingNewResource ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingResource(false); setNewResourceTitle(""); setNewResourceUrl(""); }} disabled={savingNewResource}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {additionalResources.length === 0 && !addingResource && (
                  <p className="text-sm text-muted-foreground">Nenhum recurso adicional ainda.</p>
                )}
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
