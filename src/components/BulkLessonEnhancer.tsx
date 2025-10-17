import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BulkLessonEnhancer() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const { toast } = useToast();

  const enhanceAllLessons = async () => {
    setIsEnhancing(true);
    setProgress(0);
    setStatusMessage("Fetching all lessons...");

    try {
      // Fetch all lessons from all courses
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, content, course_id, courses(level)')
        .order('course_id')
        .order('order_index');

      if (lessonsError) throw lessonsError;

      if (!lessons || lessons.length === 0) {
        toast({
          title: "No Lessons Found",
          description: "There are no lessons to enhance.",
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
        const courseLevel = (lesson as any).courses?.level || 'A1';
        
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
        description: `Successfully enhanced ${enhancedCount} out of ${totalLessons} lessons.`,
      });
    } catch (error) {
      console.error('Error in bulk enhancement:', error);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Bulk Lesson Enhancement
        </CardTitle>
        <CardDescription>
          Enhance all lesson content with AI-powered formatting and visual improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will enhance ALL lessons from ALL courses. The process may take several minutes.
            Each lesson will be formatted with improved HTML structure, better readability, and enhanced visual presentation.
          </AlertDescription>
        </Alert>

        {isEnhancing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>
        )}

        <Button
          onClick={enhanceAllLessons}
          disabled={isEnhancing}
          className="w-full"
        >
          {isEnhancing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Enhance All Lessons
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
