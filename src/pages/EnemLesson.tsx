import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileCheck } from "lucide-react";

const subjectNames: Record<string, string> = {
  portugues: 'Português e Literatura',
  redacao: 'Redação',
  matematica: 'Matemática',
  fisica: 'Física',
  quimica: 'Química',
  biologia: 'Biologia',
  historia: 'História',
  geografia: 'Geografia',
  filosofia: 'Filosofia',
  sociologia: 'Sociologia',
};

export default function EnemLesson() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [subjectId]);

  const loadContent = async () => {
    if (!subjectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-enem-content', {
        body: { subject: subjectNames[subjectId], type: 'lesson' }
      });

      if (error) throw error;
      setContent(data.content);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Gerando conteúdo personalizado...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/enem-course')}>
            ← Voltar para Matérias
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold mb-6">{subjectNames[subjectId || '']}</h1>
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <FileCheck className="h-6 w-6" />
                  Pronto para testar seus conhecimentos?
                </h3>
                <p className="text-muted-foreground">
                  Faça o simulado desta matéria com 15 questões estilo ENEM
                </p>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate(`/enem-exam/${subjectId}`)}
              >
                Fazer Simulado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
