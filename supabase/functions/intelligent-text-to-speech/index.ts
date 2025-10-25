import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface LanguageSegment {
  text: string;
  language: 'pt-BR' | 'en-US';
  start: number;
  end: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, options = {} } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    // Strip HTML if present
    const cleanText = stripHtml(text);
    console.log('Processing text:', cleanText.substring(0, 100) + '...');

    // Use Lovable AI to detect language segments
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Detecting language segments with Lovable AI...');
    const segmentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Analyze text and identify language segments. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: `Analyze this educational content and segment by language. Return ONLY a JSON object with this exact structure:
{
  "segments": [
    {"text": "original text", "language": "pt-BR" OR "en-US", "start": 0, "end": 10}
  ]
}

Rules:
- Detect Brazilian Portuguese (pt-BR) and American English (en-US) only
- Break text into logical segments by language
- Maintain original text exactly as provided
- If entire text is one language, return single segment
- If mixed, identify each language block

Text to analyze:
${cleanText}`
          }
        ],
      }),
    });

    if (!segmentResponse.ok) {
      const error = await segmentResponse.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Language detection failed: ${error}`);
    }

    const segmentData = await segmentResponse.json();
    console.log('Lovable AI response:', JSON.stringify(segmentData));
    
    let segments: LanguageSegment[];
    
    try {
      const content = segmentData.choices[0].message.content;
      const parsed = JSON.parse(content);
      segments = parsed.segments;
    } catch (parseError) {
      console.error('Failed to parse segments, using fallback:', parseError);
      // Fallback: treat entire text as one language (detect which one)
      const isProbablyPortuguese = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(cleanText) || 
                                   /\b(o|a|os|as|um|uma|de|da|do|para|com|em|que|não|sim|é|são)\b/i.test(cleanText);
      segments = [{
        text: cleanText,
        language: isProbablyPortuguese ? 'pt-BR' : 'en-US',
        start: 0,
        end: cleanText.length
      }];
    }

    console.log('Detected segments:', segments.length);

    // Return segments for browser-based TTS
    return new Response(
      JSON.stringify({
        segments: segments.map(s => ({ 
          text: s.text, 
          language: s.language 
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Intelligent TTS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
