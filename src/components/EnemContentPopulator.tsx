import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen } from "lucide-react";

export function EnemContentPopulator() {
  const [isPopulating, setIsPopulating] = useState(false);
  const { toast } = useToast();

  const handlePopulate = async () => {
    const confirmed = window.confirm(
      "Isso irá gerar todo o conteúdo ENEM (12 matérias com aulas e simulados, incluindo Inglês e Espanhol). Pode levar alguns minutos. Deseja continuar?"
    );

    if (!confirmed) return;

    setIsPopulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-enem-content');

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Todo o conteúdo ENEM foi gerado e armazenado.",
      });

      console.log('Population results:', data);
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
          Gera e armazena todo o conteúdo das aulas e simulados para todas as 12 matérias do ENEM (incluindo Inglês e Espanhol)
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <p className="text-sm text-muted-foreground mt-4">
            Isso pode levar vários minutos. Por favor, aguarde...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
