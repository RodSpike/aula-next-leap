import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LanguageSegment {
  text: string;
  language: 'pt-BR' | 'en-US';
  start_time: number;
  end_time: number;
  marker_label: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { courseId, offset = 0, batchSize = 5 } = await req.json();

    let query = supabase
      .from('lessons')
      .select('id, title, content, course_id, audio_url')
      .is('audio_url', null);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: lessons, error: lessonsError } = await query
      .range(offset, offset + batchSize - 1);

    if (lessonsError) throw lessonsError;

    console.log(`Processing ${lessons.length} lessons starting from offset ${offset}`);

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    for (const lesson of lessons) {
      try {
        console.log(`Generating audio for lesson: ${lesson.title}`);

        // Get language segments
        const segmentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/intelligent-text-to-speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            text: `${lesson.title}. ${lesson.content}`.substring(0, 4000)
          })
        });

        if (!segmentResponse.ok) {
          throw new Error(`Segment detection failed: ${segmentResponse.status}`);
        }

        const { segments } = await segmentResponse.json();

        if (!segments || segments.length === 0) {
          results.skipped++;
          results.details.push({
            lessonId: lesson.id,
            status: 'skipped',
            reason: 'No segments detected'
          });
          continue;
        }

        // Create enhanced segments with timestamps and markers
        let currentTime = 0;
        const avgWordsPerSecond = 2.5; // Average speech rate
        
        const enhancedSegments: LanguageSegment[] = segments.map((seg: any, index: number) => {
          const wordCount = seg.text.split(/\s+/).length;
          const duration = wordCount / avgWordsPerSecond;
          const startTime = currentTime;
          const endTime = currentTime + duration;
          currentTime = endTime;

          // Determine marker label based on content and position
          let markerLabel = 'Content';
          if (index === 0) {
            markerLabel = 'Introduction';
          } else if (seg.text.toLowerCase().includes('example') || seg.text.toLowerCase().includes('exemplo')) {
            markerLabel = 'Examples';
          } else if (seg.text.toLowerCase().includes('grammar') || seg.text.toLowerCase().includes('gramática')) {
            markerLabel = 'Grammar';
          } else if (seg.text.toLowerCase().includes('practice') || seg.text.toLowerCase().includes('prática')) {
            markerLabel = 'Practice';
          }

          return {
            text: seg.text,
            language: seg.language,
            start_time: startTime,
            end_time: endTime,
            marker_label: markerLabel
          };
        });

        const totalDuration = currentTime;

        // For browser-based TTS, we store metadata but don't generate the actual file
        // The file will be generated on-demand by the client using browser TTS
        // This approach is much simpler and doesn't require server-side audio processing

        // Update lesson with metadata
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            audio_segments: enhancedSegments,
            audio_duration: totalDuration,
            audio_generated_at: new Date().toISOString(),
            // audio_url will be set to a special marker indicating browser TTS should be used
            audio_url: 'browser-tts'
          })
          .eq('id', lesson.id);

        if (updateError) throw updateError;

        results.processed++;
        results.details.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          status: 'success',
          segmentCount: enhancedSegments.length,
          duration: totalDuration
        });

        console.log(`✓ Generated audio for: ${lesson.title} (${enhancedSegments.length} segments, ${totalDuration.toFixed(1)}s)`);

      } catch (error) {
        console.error(`✗ Failed to generate audio for lesson ${lesson.id}:`, error);
        results.failed++;
        results.details.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log(`Batch complete: ${results.processed} processed, ${results.failed} failed, ${results.skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        hasMore: lessons.length === batchSize
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Bulk audio generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes('Unauthorized') || error.message.includes('Admin') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
