import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, CheckCircle, XCircle } from "lucide-react";

export function EnemContentPopulator() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [processedSubjects, setProcessedSubjects] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handlePopulate = async () => {
    const confirmed = window.confirm(
      "Isso irá gerar todo o conteúdo ENEM (12 matérias com aulas e simulados). Pode levar alguns minutos. Deseja continuar?"
    );

    if (!confirmed) return;

    setIsPopulating(true);
    setProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setProcessedSubjects([]);
    setErrors([]);

    try {
      let batchIndex = 0;
      let hasMore = true;

      while (hasMore) {
        console.log(`Calling batch ${batchIndex}...`);
        
        const { data, error } = await supabase.functions.invoke('populate-enem-content', {
          body: { batchIndex }
        });

        if (error) {
          console.error(`Batch ${batchIndex} error:`, error);
          setErrors(prev => [...prev, `Lote ${batchIndex + 1}: ${error.message}`]);
          // Continue to next batch even on error
        } else if (data) {
          console.log(`Batch ${batchIndex} result:`, data);
          
          if (data.totalBatches) {
            setTotalBatches(data.totalBatches);
          }
          
          if (data.processedSubjects) {
            setProcessedSubjects(prev => [...prev, ...data.processedSubjects]);
          }

          // Check for individual subject errors
          if (data.results) {
            const failedSubjects = data.results
              .filter((r: any) => !r.success)
              .map((r: any) => `${r.subject}: ${r.error}`);
            if (failedSubjects.length > 0) {
              setErrors(prev => [...prev, ...failedSubjects]);
            }
          }
          
          hasMore = data.hasMore ?? false;
          batchIndex = data.nextBatch ?? batchIndex + 1;
        }

        setCurrentBatch(batchIndex);
        const progressPercent = totalBatches > 0 
          ? Math.round((batchIndex / totalBatches) * 100)
          : Math.round(((batchIndex) / 6) * 100); // 6 batches of 2 = 12 subjects
        setProgress(Math.min(progressPercent, 100));

        // Small delay between batches to avoid rate limits
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setProgress(100);
      
      if (errors.length === 0) {
        toast({
          title: "Sucesso!",
          description: "Todo o conteúdo ENEM foi gerado e armazenado.",
        });
      } else {
        toast({
          title: "Concluído com erros",
          description: `Geração concluída. ${errors.length} erros encontrados.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error populating content:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Gerar Conteúdo ENEM
        </CardTitle>
        <CardDescription>
          Gera e armazena todo o conteúdo das aulas e simulados para todas as 12 matérias do ENEM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handlePopulate} 
          disabled={isPopulating}
          className="w-full"
        >
          {isPopulating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Conteúdo...
            </>
          ) : (
            "Gerar Todo Conteúdo ENEM"
          )}
        </Button>

        {isPopulating && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Lote {currentBatch + 1} de {totalBatches || 6} - {progress}%
            </p>
          </div>
        )}

        {processedSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Matérias processadas:</p>
            <div className="flex flex-wrap gap-2">
              {processedSubjects.map((subject, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  <CheckCircle className="h-3 w-3" />
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">Erros:</p>
            <div className="flex flex-col gap-1">
              {errors.map((error, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                >
                  <XCircle className="h-3 w-3" />
                  {error}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
