import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Volume2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

export function BulkAudioGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    failed: 0,
    skipped: 0
  });

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .order("level")
        .order("order_index");

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    setStats({ total: 0, processed: 0, failed: 0, skipped: 0 });

    try {
      toast.info("Starting audio generation...", {
        description: "Processing lessons with server-side language detection"
      });

      // Count total lessons to process
      let countQuery = supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .is('audio_url', null);

      if (selectedCourse !== "all") {
        countQuery = countQuery.eq('course_id', selectedCourse);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      if (!count || count === 0) {
        toast.info("No lessons to process", {
          description: "All lessons already have audio"
        });
        setIsGenerating(false);
        return;
      }

      setStats(prev => ({ ...prev, total: count }));

      // Batch processing
      const batchSize = 5;
      let offset = 0;
      let totalProcessed = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('bulk-generate-lesson-audio', {
          body: { 
            courseId: selectedCourse !== "all" ? selectedCourse : undefined,
            offset,
            batchSize
          }
        });

        if (error) throw error;

        totalProcessed += data.results.processed;
        totalFailed += data.results.failed;
        totalSkipped += data.results.skipped;

        setStats({
          total: count,
          processed: totalProcessed,
          failed: totalFailed,
          skipped: totalSkipped
        });

        const progressPercent = Math.min(100, ((totalProcessed + totalFailed + totalSkipped) / count) * 100);
        setProgress(progressPercent);

        hasMore = data.hasMore;
        offset += batchSize;

        // Small delay between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.success("Audio generation complete!", {
        description: `Processed: ${totalProcessed}, Failed: ${totalFailed}, Skipped: ${totalSkipped}`
      });

    } catch (error: any) {
      console.error("Audio generation error:", error);
      toast.error("Audio generation failed", {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Bulk Audio Generator
        </CardTitle>
        <CardDescription>
          Generate audio for all lessons using browser-based text-to-speech with intelligent language detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isGenerating && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Target Course</label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                onOpenChange={(open) => {
                  if (open && courses.length === 0) {
                    loadCourses();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses (without audio)</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={startGeneration} 
              className="w-full"
              disabled={isGenerating}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Generate Audio
            </Button>
          </>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Generating audio...</span>
            </div>
            
            <Progress value={progress} className="h-2" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Processed</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950/30 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-sm font-medium">Skipped</span>
                </div>
                <p className="text-2xl font-bold">{stats.skipped}</p>
              </div>
            </div>
          </div>
        )}

        {stats.total > 0 && !isGenerating && (
          <div className="bg-primary/5 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Generation Summary</h4>
            <p className="text-sm text-muted-foreground">
              Successfully processed {stats.processed} out of {stats.total} lessons.
              {stats.failed > 0 && ` ${stats.failed} failed.`}
              {stats.skipped > 0 && ` ${stats.skipped} skipped.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
