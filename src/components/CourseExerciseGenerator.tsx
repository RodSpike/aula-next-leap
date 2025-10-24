import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CourseExerciseGeneratorProps {
  courseId: string;
  courseName: string;
  lessonCount: number;
}

export const CourseExerciseGenerator: React.FC<CourseExerciseGeneratorProps> = ({
  courseId,
  courseName,
  lessonCount,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const { toast } = useToast();

  const run = async () => {
    if (!confirm(`Generate exercises for all ${lessonCount} lessons in "${courseName}"?`)) return;
    
    setIsRunning(true);
    setResult(null);
    setProgress(0);

    try {
      toast({ 
        title: "Starting Exercise Generation", 
        description: `Generating exercises for ${lessonCount} lessons...` 
      });

      const batchSize = 3;
      let offset = 0;
      let totalSuccesses = 0;
      let totalFailures = 0;
      const allDetails: any[] = [];

      while (offset < lessonCount) {
        const { data, error } = await supabase.functions.invoke("bulk-generate-practice-exercises", { 
          body: { courseId, offset, batchSize }
        });
        if (error) throw error;

        totalSuccesses += data?.successes ?? 0;
        totalFailures += data?.failures ?? 0;
        if (Array.isArray(data?.details)) allDetails.push(...data.details);
        const processedNow = data?.processed ?? 0;
        offset = data?.batch?.nextOffset ?? (offset + processedNow);

        const completed = Math.min(offset, lessonCount);
        setProgress(Math.round((completed / lessonCount) * 100));

        // Gentle pacing between batches
        await new Promise((r) => setTimeout(r, 300));

        // Safety to avoid infinite loops
        if (processedNow === 0) break;
      }

      const summary = {
        processed: Math.min(offset, lessonCount),
        successes: totalSuccesses,
        failures: totalFailures,
        details: allDetails,
      };

      setResult(summary);
      setProgress(100);
      
      toast({ 
        title: "Completed", 
        description: `Successfully generated exercises for ${summary.successes}/${summary.processed} lessons`,
        variant: summary.failures > 0 ? "default" : "default"
      });
    } catch (e: any) {
      console.error("Exercise generation error:", e);
      toast({ 
        title: "Error", 
        description: e.message || "Failed to generate exercises", 
        variant: "destructive" 
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={run} 
        disabled={isRunning} 
        className="w-full gap-2"
        variant="outline"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Exercises...
          </>
        ) : (
          <>
            <Dumbbell className="h-4 w-4" />
            Generate Exercises for All {lessonCount} Lessons
          </>
        )}
      </Button>

      {isRunning && (
        <Progress value={progress} className="h-2" />
      )}

      {result && (
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded border">
          <div className="font-medium mb-1">Generation Complete</div>
          <div className="space-y-1">
            <div>✓ Processed: {result.processed} lessons</div>
            <div>✓ Successful: {result.successes}</div>
            {result.failures > 0 && (
              <div className="text-destructive">✗ Failed: {result.failures}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
