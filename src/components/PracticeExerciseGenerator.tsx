import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2 } from 'lucide-react';

interface PracticeExerciseGeneratorProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
}

export function PracticeExerciseGenerator({ 
  lessonId, 
  lessonTitle, 
  lessonContent 
}: PracticeExerciseGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateExercises = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Gerando exercícios...",
        description: "Isso pode levar alguns momentos.",
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-practice-exercises', {
        body: { 
          lessonContent,
          lessonTitle
        }
      });

      if (error) throw error;

      if (!data.exercises || !Array.isArray(data.exercises)) {
        throw new Error('Invalid response format');
      }

      // Delete existing exercises for this lesson
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('lesson_id', lessonId);

      if (deleteError) {
        console.error('Error deleting old exercises:', deleteError);
      }

      // Insert new exercises
      const exercisesToInsert = data.exercises.map((ex: any, index: number) => ({
        lesson_id: lessonId,
        question: ex.question,
        options: ex.options || [],
        correct_answer: ex.correct_answer,
        explanation: ex.explanation || '',
        order_index: index
      }));

      const { error: insertError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Sucesso!",
        description: `${data.exercises.length} exercícios gerados com sucesso.`,
      });

      // Reload the page to show new exercises
      window.location.reload();

    } catch (error) {
      console.error('Error generating exercises:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar exercícios.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateExercises}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Gerar Exercícios com IA
        </>
      )}
    </Button>
  );
}
