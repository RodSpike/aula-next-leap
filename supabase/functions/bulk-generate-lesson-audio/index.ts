import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const buildCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') ?? '*';
  const reqHeaders = req.headers.get('access-control-request-headers') ?? 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': reqHeaders,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Headers',
  };
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
    return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
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

    const { courseId, offset = 0, batchSize = 5, force = false } = await req.json();

    let query = supabase
      .from('lessons')
      .select('id, title, content, course_id, audio_url');
    
    if (!force) {
      query = query.is('audio_url', null);
    }

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

        // Get language segments for the FULL lesson by chunking the text and merging results
        const fullText = `${lesson.title}. ${lesson.content}`;

        // Helper: split into ~3500 char chunks on sentence boundaries
        const splitIntoChunks = (text: string, maxLen = 3500): string[] => {
          const sentences = text.split(/(?<=[.!?])\s+/);
          const chunks: string[] = [];
          let current = '';
          for (const s of sentences) {
            if ((current + (current ? ' ' : '') + s).length > maxLen) {
              if (current) chunks.push(current);
              current = s;
            } else {
              current = current ? `${current} ${s}` : s;
            }
          }
          if (current) chunks.push(current);
          return chunks;
        };

        // Helper: simple language detection using stopwords score
        const enWords = new Set(['the','and','to','of','in','is','you','that','it','for','on','with','as','this','are','be','or','by','from','at','have','an','was','not','but','they','we','can','your','will','if','do']);
        const ptWords = new Set(['de','que','o','a','e','do','da','em','um','para','com','não','uma','os','no','se','na','por','mais','as','dos','como','mas','foi','ao','ele','das','tem','à','seu','sua','ou','ser','quando','muito','há','nos','já','está']);
        const detectLang = (s: string): 'en-US' | 'pt-BR' => {
          const tokens = (s.toLowerCase().match(/[a-zà-úâêôãõáéíóúç']+/gi) || []);
          let en=0, pt=0;
          for (const t of tokens) {
            if (enWords.has(t)) en++;
            if (ptWords.has(t)) pt++;
          }
          // fallback heuristic: ASCII proportion
          if (en===pt) {
            const ascii = (s.match(/[A-Za-z]/g) || []).length;
            const nonAscii = (s.length - ascii);
            if (ascii > nonAscii) en++; else pt++;
          }
          return en>pt ? 'en-US' : 'pt-BR';
        };

        // Helper: split into sentences to allow intra-chunk language switching
        const splitIntoSentences = (t: string) => t.split(/(?<=[.!?;:])\s+/).filter(Boolean);

        // Call the segmentation function per chunk and merge
        const chunks = splitIntoChunks(fullText);
        let mergedSegments: { text: string; language: 'pt-BR' | 'en-US' }[] = [];
        for (const chunk of chunks) {
          const segmentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/intelligent-text-to-speech`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ text: chunk })
          });

          if (!segmentResponse.ok) {
            throw new Error(`Segment detection failed: ${segmentResponse.status}`);
          }
          const parsed = await segmentResponse.json();
          const chunkSegments = (parsed?.segments || []) as Array<{ text: string; language: 'pt-BR' | 'en-US' }>;

          if (!chunkSegments.length) continue;

          // Refine each returned segment into sentence-level segments with language detection
          for (const seg of chunkSegments) {
            const sentences = splitIntoSentences(seg.text);
            for (const sentence of sentences) {
              const lang = detectLang(sentence);
              mergedSegments.push({ text: sentence, language: lang });
            }
          }
        }

        if (!mergedSegments.length) {
          results.skipped++;
          results.details.push({
            lessonId: lesson.id,
            status: 'skipped',
            reason: 'No segments detected'
          });
          continue;
        }

        // Build enhanced segments with timestamps and markers covering the WHOLE lesson
        let currentTime = 0;
        const wpsByLang: Record<'pt-BR'|'en-US', number> = { 'pt-BR': 2.3, 'en-US': 2.7 };

        const enhancedSegments: LanguageSegment[] = mergedSegments.map((seg, index) => {
          const wordCount = (seg.text.match(/\S+/g) || []).length;
          const duration = Math.max(wordCount / (wpsByLang[seg.language] || 2.5), 0.6);
          const startTime = currentTime;
          const endTime = startTime + duration;
          currentTime = endTime;

          // Determine marker label
          const lower = seg.text.toLowerCase();
          let markerLabel = 'Content';
          if (index === 0) markerLabel = 'Introduction';
          else if (/(example|exemplo)/.test(lower)) markerLabel = 'Examples';
          else if (/(grammar|gramática)/.test(lower)) markerLabel = 'Grammar';
          else if (/(practice|prática)/.test(lower)) markerLabel = 'Practice';

          return {
            text: seg.text,
            language: seg.language,
            start_time: startTime,
            end_time: endTime,
            marker_label: markerLabel,
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
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    }
  );

} catch (error) {
  console.error('Bulk audio generation error:', error);
  return new Response(
    JSON.stringify({ error: (error as any)?.message ?? 'Unexpected error' }),
    {
      status: (error as any)?.message?.includes('Unauthorized') || (error as any)?.message?.includes('Admin') ? 403 : 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    }
  );
}
});
