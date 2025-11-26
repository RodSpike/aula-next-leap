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
      const { data, error } = await supabase
        .from('enem_lessons')
        .select('content')
        .eq('subject_id', subjectId)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Conteúdo não encontrado",
          description: "O conteúdo desta matéria ainda não foi gerado. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

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
            <p className="text-muted-foreground">Carregando conteúdo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/enem-course')}>
            ← Voltar para Matérias
          </Button>
        </div>

        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 border-b">
            <h1 className="text-4xl font-bold mb-2">{subjectNames[subjectId || '']}</h1>
            <p className="text-muted-foreground">Conteúdo completo para o ENEM e Vestibulares</p>
          </div>
          
          <CardContent className="pt-8">
            <style dangerouslySetInnerHTML={{ __html: `
              .enem-content h2 {
                font-size: 1.875rem;
                font-weight: 700;
                margin-top: 2.5rem;
                margin-bottom: 1.5rem;
                color: hsl(var(--foreground));
                padding-bottom: 0.75rem;
                border-bottom: 2px solid hsl(var(--primary) / 0.2);
              }
              
              .enem-content h3 {
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 2rem;
                margin-bottom: 1rem;
                color: hsl(var(--foreground));
              }
              
              .enem-content p {
                margin-bottom: 1.25rem;
                line-height: 1.8;
                color: hsl(var(--foreground) / 0.9);
              }
              
              .enem-content ul, .enem-content ol {
                margin-bottom: 1.5rem;
                padding-left: 1.5rem;
              }
              
              .enem-content li {
                margin-bottom: 0.75rem;
                line-height: 1.7;
              }
              
              .enem-content strong {
                color: hsl(var(--primary));
                font-weight: 600;
              }
              
              .enem-content .tip {
                background: linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05));
                border-left: 4px solid hsl(var(--primary));
                padding: 1.25rem;
                margin: 1.75rem 0;
                border-radius: 0.5rem;
                box-shadow: 0 2px 8px hsl(var(--primary) / 0.1);
              }
              
              .enem-content .tip strong {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 1.1rem;
              }
              
              .enem-content .example {
                background: linear-gradient(135deg, hsl(var(--accent) / 0.15), hsl(var(--accent) / 0.05));
                border-left: 4px solid hsl(var(--accent));
                padding: 1.25rem;
                margin: 1.75rem 0;
                border-radius: 0.5rem;
                box-shadow: 0 2px 8px hsl(var(--accent) / 0.1);
              }
              
              .enem-content .example strong {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 1.1rem;
                color: hsl(var(--accent-foreground));
              }
              
              .enem-content .warning {
                background: linear-gradient(135deg, hsl(var(--destructive) / 0.1), hsl(var(--destructive) / 0.05));
                border-left: 4px solid hsl(var(--destructive));
                padding: 1.25rem;
                margin: 1.75rem 0;
                border-radius: 0.5rem;
                box-shadow: 0 2px 8px hsl(var(--destructive) / 0.1);
              }
              
              .enem-content .warning strong {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 1.1rem;
                color: hsl(var(--destructive));
              }
            `}} />
            
            <div 
              className="enem-content prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                  Pronto para testar seus conhecimentos?
                </h3>
                <p className="text-muted-foreground">
                  Faça o simulado desta matéria com 15 questões estilo ENEM
                </p>
              </div>
              <Button 
                size="lg"
                className="shadow-md hover:shadow-lg transition-shadow"
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
