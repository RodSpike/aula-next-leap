import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

export function GenerateAllLessonsButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const parseAIContentToStructuredData = (aiContent: string, lessonTitle: string) => {
    // Parse the AI-generated content and convert it to the structured JSON format
    // This is a simplified parser - in practice, you'd want more robust parsing
    
    const lines = aiContent.split('\n').filter(line => line.trim());
    const parts: any[] = [];
    const exercises: any[] = [];
    
    let currentPart: any = null;
    let currentSection: any = null;
    let isInExercises = false;
    let isInTable = false;
    let currentTable: string[][] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('Práticas e Exercícios')) {
        isInExercises = true;
        continue;
      }
      
      if (line.startsWith('Parte ') && !isInExercises) {
        // Start new part
        if (currentPart) parts.push(currentPart);
        currentPart = {
          title: line,
          content: '',
          sections: [],
          table: null,
          sentence_types: [],
          wh_table: null
        };
        continue;
      }
      
      if (isInExercises) {
        // Parse exercises
        if (line.match(/^\d+\./)) {
          const exerciseMatch = line.match(/^\d+\.\s*(.+)/);
          if (exerciseMatch) {
            exercises.push({
              title: exerciseMatch[1],
              questions: [],
              example: '',
              instructions: ''
            });
          }
        } else if (line.match(/^[a-z]\)/)) {
          // Exercise question
          if (exercises.length > 0) {
            exercises[exercises.length - 1].questions.push(line);
          }
        } else if (line.includes('A:') || line.includes('B:')) {
          // Dialogue example
          if (exercises.length > 0) {
            exercises[exercises.length - 1].example += (exercises[exercises.length - 1].example ? '\n' : '') + line;
          }
        }
      } else if (currentPart) {
        // Add content to current part
        if (line.includes('Formais:') || line.includes('Informais:')) {
          currentSection = {
            title: line,
            items: []
          };
        } else if (currentSection && (line.includes('(') || line.includes('!'))) {
          currentSection.items.push(line);
        } else if (line.includes('|') && (line.includes('Pronome') || line.includes('Wh-Word'))) {
          // Start of table
          isInTable = true;
          currentTable = [];
          const headers = line.split('|').map(h => h.trim()).filter(h => h);
          currentTable.push(headers);
        } else if (isInTable && line.includes('|')) {
          const row = line.split('|').map(h => h.trim()).filter(h => h);
          if (row.length > 0) currentTable.push(row);
        } else if (isInTable && !line.includes('|')) {
          // End of table
          isInTable = false;
          if (currentTable.length > 0) {
            if (currentTable[0].includes('Wh-Word')) {
              currentPart.wh_table = currentTable;
            } else {
              currentPart.table = currentTable;
            }
            currentTable = [];
          }
        }
        
        if (currentSection && line.includes(':') && !line.includes('|')) {
          currentPart.sections.push(currentSection);
          currentSection = null;
        }
        
        if (!isInTable && !line.includes(':') && line.length > 10) {
          currentPart.content += (currentPart.content ? ' ' : '') + line;
        }
      }
    }
    
    if (currentPart) parts.push(currentPart);
    
    return { parts, exercises };
  };

  const generateAllLessons = async () => {
    setIsGenerating(true);
    try {
      // Get all lessons that need content (excluding the one we already created)
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          content,
          course_id,
          courses (level)
        `)
        .neq('title', 'Meet and Greet + Verb To Be');

      if (lessonsError) throw lessonsError;

      let successCount = 0;
      let errorCount = 0;

      for (const lesson of lessons) {
        try {
          console.log(`Generating content for: ${lesson.title}`);
          
          // Generate content using your AI
          const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-lesson-content', {
            body: {
              lessonTitle: lesson.title,
              courseLevel: lesson.courses.level,
              lessonDescription: lesson.content
            }
          });

          if (aiError || !aiResponse.success) {
            console.error(`Failed to generate content for ${lesson.title}:`, aiError || aiResponse.error);
            errorCount++;
            continue;
          }

          // Parse the AI content to structured format
          const { parts, exercises } = parseAIContentToStructuredData(aiResponse.content, lesson.title);
          
          // Delete existing content for this lesson
          await supabase
            .from('lesson_content')
            .delete()
            .eq('lesson_id', lesson.id);

          // Insert introduction content
          const { error: introError } = await supabase
            .from('lesson_content')
            .insert({
              lesson_id: lesson.id,
              section_type: 'introduction',
              title: `Aula: ${lesson.title}`,
              explanation: `Conteúdo completo e detalhado sobre ${lesson.title}`,
              content: { parts },
              examples: [],
              order_index: 1
            });

          if (introError) throw introError;

          // Insert practice content
          if (exercises.length > 0) {
            const { error: practiceError } = await supabase
              .from('lesson_content')
              .insert({
                lesson_id: lesson.id,
                section_type: 'practice',
                title: 'Práticas e Exercícios',
                explanation: 'Complete os exercícios abaixo para praticar o conteúdo aprendido.',
                content: { exercises },
                examples: [],
                order_index: 2
              });

            if (practiceError) throw practiceError;
          }

          successCount++;
          console.log(`Successfully generated content for: ${lesson.title}`);
          
          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (lessonError) {
          console.error(`Error processing lesson ${lesson.title}:`, lessonError);
          errorCount++;
        }
      }

      toast({
        title: "Geração de Conteúdo Concluída!",
        description: `${successCount} aulas criadas com sucesso${errorCount > 0 ? `, ${errorCount} falharam` : ''}.`,
        variant: successCount > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error generating lessons:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar conteúdo das aulas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateAllLessons}
      disabled={isGenerating}
      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando Conteúdo...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          <BookOpen className="w-4 h-4 mr-2" />
          Gerar Todas as Aulas com IA
        </>
      )}
    </Button>
  );
}