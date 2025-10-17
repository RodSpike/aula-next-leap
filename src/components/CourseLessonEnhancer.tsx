import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface CourseLessonEnhancerProps {
  courseId: string;
  courseName: string;
}

export function CourseLessonEnhancer({ courseId, courseName }: CourseLessonEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const { toast } = useToast();

  const enhanceCourseLessons = async () => {
    setIsEnhancing(true);
    setProgress(0);
    setStatusMessage(`Fetching lessons for ${courseName}...`);

    try {
      // Fetch lessons for this specific course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, content')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;

      if (!lessons || lessons.length === 0) {
        toast({
          title: "No Lessons Found",
          description: `There are no lessons in ${courseName} to enhance.`,
          variant: "destructive",
        });
        setIsEnhancing(false);
        return;
      }

      const totalLessons = lessons.length;
      let enhancedCount = 0;
      let failedCount = 0;

      setStatusMessage(`Found ${totalLessons} lessons. Starting enhancement...`);

      // Process each lesson
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        
        setStatusMessage(`Enhancing lesson ${i + 1}/${totalLessons}: ${lesson.title}`);
        setProgress(((i + 1) / totalLessons) * 100);

        try {
          // Call the enhance-lesson-content edge function
          const { data, error } = await supabase.functions.invoke('enhance-lesson-content', {
            body: {
              content: lesson.content,
              title: lesson.title,
              sectionType: 'lesson'
            }
          });

          if (error) {
            console.error(`Failed to enhance lesson ${lesson.id}:`, error);
            failedCount++;
            continue;
          }

          if (data?.enhancedContent) {
            // Update the lesson with enhanced content
            const { error: updateError } = await supabase
              .from('lessons')
              .update({ content: data.enhancedContent })
              .eq('id', lesson.id);

            if (updateError) {
              console.error(`Failed to update lesson ${lesson.id}:`, updateError);
              failedCount++;
            } else {
              enhancedCount++;
            }
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Error processing lesson ${lesson.id}:`, err);
          failedCount++;
        }
      }

      setProgress(100);
      setStatusMessage(`Enhancement complete! Enhanced: ${enhancedCount}, Failed: ${failedCount}`);

      toast({
        title: "Enhancement Complete",
        description: `Successfully enhanced ${enhancedCount} out of ${totalLessons} lessons in ${courseName}.`,
      });
    } catch (error) {
      console.error('Error in course lesson enhancement:', error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setStatusMessage("Enhancement failed.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-2">
      {isEnhancing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{statusMessage}</p>
        </div>
      )}

      <Button
        onClick={enhanceCourseLessons}
        disabled={isEnhancing}
        size="sm"
        variant="outline"
        className="w-full"
      >
        {isEnhancing ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
            Enhancing...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-2" />
            Enhance All Lessons
          </>
        )}
      </Button>
    </div>
  );
}
