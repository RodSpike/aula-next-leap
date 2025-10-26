import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPortuguese } from "@/utils/portugueseDetection";

interface Course {
  id: string;
  title: string;
  lessons?: Array<{
    id: string;
    title: string;
    content: string | null;
    order_index: number;
  }>;
}

interface AudioSegment {
  text: string;
  language: string;
  duration: number;
  order: number;
}

interface AudioResult {
  lessonId: string;
  segments: AudioSegment[];
  totalDuration: number;
  languagesUsed: string[];
}

export const BulkAudioGenerator = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, lessons(id, title, content, order_index)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    setCourses(data || []);
  };

  // Client-side TTS generation with enhanced language detection
  const generateAudioForLesson = async (lesson: NonNullable<Course['lessons']>[0]): Promise<AudioResult | null> => {
    if (!lesson.content) {
      console.log(`No content for lesson: ${lesson.title}`);
      return null;
    }

    try {
      // Split content into smaller segments for better language detection
      const splitIntoSegments = (text: string): Array<{ text: string; language: string }> => {
        const segments: Array<{ text: string; language: string }> = [];
        
        // Split by lines first
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          // Check for parenthetical content (often translations)
          const parentheticalRegex = /^(.*?)\s*\((.*?)\)\s*(.*)$/;
          const match = line.match(parentheticalRegex);
          
          if (match) {
            const [, before, inside, after] = match;
            
            // Add text before parentheses
            if (before.trim()) {
              const isPortuguese = detectPortuguese(before);
              segments.push({
                text: before.trim(),
                language: isPortuguese ? 'pt-BR' : 'en-US'
              });
            }
            
            // Add parenthetical content (usually opposite language)
            if (inside.trim()) {
              const isPortuguese = detectPortuguese(inside);
              segments.push({
                text: inside.trim(),
                language: isPortuguese ? 'pt-BR' : 'en-US'
              });
            }
            
            // Add text after parentheses
            if (after.trim()) {
              const isPortuguese = detectPortuguese(after);
              segments.push({
                text: after.trim(),
                language: isPortuguese ? 'pt-BR' : 'en-US'
              });
            }
          } else {
            // No parentheses - check for colon-separated content (like "Title: Explanation")
            const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
            
            if (colonMatch) {
              const [, title, content] = colonMatch;
              
              // Add title
              if (title.trim()) {
                const isPortuguese = detectPortuguese(title);
                segments.push({
                  text: title.trim() + ':',
                  language: isPortuguese ? 'pt-BR' : 'en-US'
                });
              }
              
              // Add content
              if (content.trim()) {
                const isPortuguese = detectPortuguese(content);
                segments.push({
                  text: content.trim(),
                  language: isPortuguese ? 'pt-BR' : 'en-US'
                });
              }
            } else {
              // Simple line - detect language and add
              const isPortuguese = detectPortuguese(line);
              segments.push({
                text: line.trim(),
                language: isPortuguese ? 'pt-BR' : 'en-US'
              });
            }
          }
        }
        
        return segments;
      };

      const segments = splitIntoSegments(lesson.content);
      const audioSegments: AudioSegment[] = segments.map((seg, index) => ({
        text: seg.text,
        language: seg.language,
        duration: Math.ceil(seg.text.length / 8),
        order: index
      }));

      return {
        lessonId: lesson.id,
        segments: audioSegments,
        totalDuration: audioSegments.reduce((total, seg) => total + seg.duration, 0),
        languagesUsed: [...new Set(audioSegments.map(seg => seg.language))]
      };

    } catch (error) {
      console.error(`Error processing lesson ${lesson.id}:`, error);
      return null;
    }
  };

  const generateBulkAudio = async () => {
    if (!selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course",
        variant: "destructive",
      });
      return;
    }

    const course = courses.find(c => c.id === selectedCourseId);
    if (!course || !course.lessons || course.lessons.length === 0) {
      toast({
        title: "Error",
        description: "Selected course has no lessons",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: course.lessons.length });

    const results: (AudioResult | null)[] = [];
    const sortedLessons = [...course.lessons].sort((a, b) => a.order_index - b.order_index);

    for (let i = 0; i < sortedLessons.length; i++) {
      const lesson = sortedLessons[i];
      setProgress({ current: i + 1, total: sortedLessons.length });

      console.log(`Generating audio for lesson: ${lesson.title}`);
      
      const audioResult = await generateAudioForLesson(lesson);
      
      if (audioResult) {
        results.push(audioResult);
        
        // Save to database
        const { error } = await supabase
          .from('lessons')
          .update({ 
            audio_segments: audioResult.segments as unknown as any,
            audio_duration: audioResult.totalDuration,
            updated_at: new Date().toISOString()
          })
          .eq('id', lesson.id);

        if (error) {
          console.error(`Failed to save audio for lesson ${lesson.id}:`, error);
        } else {
          console.log(`Saved audio segments for lesson ${lesson.id}`);
        }
      }

      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setGenerating(false);
    
    const successful = results.filter(r => r !== null).length;
    toast({
      title: "Audio Generation Complete",
      description: `Generated audio for ${successful}/${sortedLessons.length} lessons in "${course.title}"`,
    });

    fetchCourses(); // Refresh data
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Audio Generator</CardTitle>
        <CardDescription>
          Generate TTS audio segments for all lessons with automatic language detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={generating}
          >
            <option value="">Choose a course...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.lessons?.length || 0} lessons)
              </option>
            ))}
          </select>
        </div>

        {selectedCourseId && (
          <div className="text-sm text-muted-foreground">
            This will analyze all lessons and create audio segments with automatic English/Portuguese detection.
          </div>
        )}

        <Button 
          onClick={generateBulkAudio} 
          disabled={generating || !selectedCourseId}
          className="w-full"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              Generating Audio ({progress.current}/{progress.total})
            </span>
          ) : (
            'Generate Audio for All Lessons'
          )}
        </Button>

        {generating && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(progress.current / progress.total) * 100}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Processing lesson {progress.current} of {progress.total}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
