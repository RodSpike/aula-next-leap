import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Trash2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GeneratedCourse {
  id: string;
  title: string;
  description: string;
  level: string;
  course_type: string;
  admin_only: boolean;
}

type GenerationStep = 'idle' | 'creating' | 'generating-structure' | 'generating-lessons' | 'saving' | 'complete';

export function DynamicCourseGenerator() {
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseLevel, setCourseLevel] = useState("ENEM");
  const [courseType, setCourseType] = useState("custom");
  const [aiChatContext, setAiChatContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [existingCourses, setExistingCourses] = useState<GeneratedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);
  const { toast } = useToast();

  const stepLabels: Record<GenerationStep, string> = {
    'idle': '',
    'creating': 'Criando curso...',
    'generating-structure': 'Gerando estrutura do curso...',
    'generating-lessons': 'Gerando conteúdo das aulas...',
    'saving': 'Salvando no banco de dados...',
    'complete': 'Concluído!'
  };

  const loadExistingCourses = async () => {
    setLoadingCourses(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, level, course_type, admin_only')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleGenerate = async () => {
    if (!courseName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome do curso.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep('creating');
    setGenerationProgress(10);

    try {
      // Step 1: Create the course in the database
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseName,
          description: courseDescription,
          level: courseLevel,
          course_type: courseType,
          order_index: 0,
          admin_only: true,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      setGenerationStep('generating-structure');
      setGenerationProgress(20);

      // Step 2: Call edge function to generate content
      toast({
        title: "Gerando conteúdo...",
        description: "Isso pode levar alguns minutos. Aguarde enquanto o AI cria o conteúdo completo do curso.",
      });

      const { data: generationResult, error: generationError } = await supabase.functions.invoke(
        'generate-dynamic-course',
        {
          body: {
            courseId: courseData.id,
            courseName: courseName,
            courseDescription: courseDescription,
            aiChatContext: aiChatContext,
            courseLevel: courseLevel
          }
        }
      );

      if (generationError) {
        console.error('Generation error:', generationError);
        throw new Error(generationError.message || 'Falha ao gerar conteúdo');
      }

      if (generationResult?.error) {
        throw new Error(generationResult.error);
      }

      setGenerationStep('complete');
      setGenerationProgress(100);

      toast({
        title: "Sucesso!",
        description: `Curso "${courseName}" criado com ${generationResult?.lessonsCreated || 0} aulas e ${generationResult?.totalExercises || 0} exercícios! Revise e publique quando estiver pronto.`,
      });

      // Reset form
      setCourseName("");
      setCourseDescription("");
      setAiChatContext("");
      
      // Reload courses list
      loadExistingCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao criar curso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('idle');
      setGenerationProgress(0);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o curso "${courseTitle}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setDeletingCourseId(courseId);
    try {
      // Get lesson IDs for this course
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        
        // Delete exercises for these lessons
        await supabase
          .from('exercises')
          .delete()
          .in('lesson_id', lessonIds);
      }

      // Delete lessons
      await supabase
        .from('lessons')
        .delete()
        .eq('course_id', courseId);

      // Delete the course
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (courseError) throw courseError;

      toast({
        title: "Curso excluído",
        description: `O curso "${courseTitle}" foi excluído com sucesso.`,
      });

      loadExistingCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir curso. Verifique se você tem permissão.",
        variant: "destructive",
      });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleToggleVisibility = async (courseId: string, courseTitle: string, currentAdminOnly: boolean) => {
    setTogglingVisibilityId(courseId);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ admin_only: !currentAdminOnly })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: currentAdminOnly ? "Curso publicado!" : "Curso ocultado",
        description: currentAdminOnly 
          ? `O curso "${courseTitle}" agora está visível para todos os usuários.`
          : `O curso "${courseTitle}" agora está visível apenas para admins.`,
      });

      loadExistingCourses();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar visibilidade. Verifique se você tem permissão.",
        variant: "destructive",
      });
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Criar Novo Curso com Conteúdo Completo
          </CardTitle>
          <CardDescription>
            Crie um curso personalizado com aulas, exercícios e AI tutor gerados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Nome do Curso *</Label>
              <Input
                id="courseName"
                placeholder="Ex: Violão para Iniciantes"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseLevel">Nível/Categoria</Label>
              <Select value={courseLevel} onValueChange={setCourseLevel} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENEM">ENEM</SelectItem>
                  <SelectItem value="Vestibular">Vestibular</SelectItem>
                  <SelectItem value="Concursos">Concursos</SelectItem>
                  <SelectItem value="Profissional">Profissional</SelectItem>
                  <SelectItem value="Idiomas">Idiomas</SelectItem>
                  <SelectItem value="Música">Música</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseDescription">Descrição do Curso</Label>
            <Textarea
              id="courseDescription"
              placeholder="Descreva o objetivo e conteúdo do curso em detalhes para melhor geração de conteúdo..."
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              rows={3}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiChatContext">Contexto para AI Tutor (opcional)</Label>
            <Textarea
              id="aiChatContext"
              placeholder="Instruções especiais para o tutor AI deste curso. Ex: 'Este curso foca em técnicas de violão para iniciantes. O tutor deve usar exemplos práticos de músicas populares e dar dicas de posição de mãos.'"
              value={aiChatContext}
              onChange={(e) => setAiChatContext(e.target.value)}
              rows={4}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Este contexto será usado pelo AI Tutor para personalizar as respostas aos alunos deste curso.
            </p>
          </div>

          {isGenerating && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stepLabels[generationStep]}</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                A geração de conteúdo pode levar de 1 a 3 minutos. Não feche esta página.
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !courseName.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando Curso Completo...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Criar Curso com Conteúdo Completo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cursos Existentes</span>
            <Button variant="outline" size="sm" onClick={loadExistingCourses} disabled={loadingCourses}>
              {loadingCourses ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
            </Button>
          </CardTitle>
          <CardDescription>
            Gerencie os cursos criados (Master Admin pode excluir)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Clique em "Atualizar" para carregar os cursos existentes
            </p>
          ) : (
            <div className="space-y-3">
              {existingCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 border rounded-lg gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{course.title}</p>
                      {course.admin_only ? (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Admin Only
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Público
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.level} • {course.course_type || 'custom'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={course.admin_only ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleVisibility(course.id, course.title, course.admin_only)}
                      disabled={togglingVisibilityId === course.id}
                      title={course.admin_only ? "Publicar para todos" : "Ocultar (admin only)"}
                    >
                      {togglingVisibilityId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : course.admin_only ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      disabled={deletingCourseId === course.id}
                    >
                      {deletingCourseId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
