import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clean text for TTS by removing HTML, markdown, emojis, and excessive punctuation
function cleanTextForTTS(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  
  // Remove markdown headers (# ## ###)
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  
  // Remove markdown bold/italic (**text**, *text*, __text__, _text_)
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove markdown links [text](url) -> keep only text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown code blocks (```code```)
  cleaned = cleaned.replace(/```[^`]*```/g, ' ');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove markdown horizontal rules (---, ___, ***)
  cleaned = cleaned.replace(/^[\-\_\*]{3,}$/gm, ' ');
  
  // Remove markdown list markers (-, *, 1., 2., etc.)
  cleaned = cleaned.replace(/^\s*[\-\*\+]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
  
  // Remove or simplify emojis
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ' '); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ' '); // Symbols & pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ' '); // Transport & map
  cleaned = cleaned.replace(/[\u{1F700}-\u{1F77F}]/gu, ' '); // Alchemical
  cleaned = cleaned.replace(/[\u{1F780}-\u{1F7FF}]/gu, ' '); // Geometric Shapes
  cleaned = cleaned.replace(/[\u{1F800}-\u{1F8FF}]/gu, ' '); // Supplemental Arrows
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ' '); // Supplemental Symbols
  cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ' '); // Chess Symbols
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ' '); // Symbols and Pictographs Extended-A
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ' ');   // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ' ');   // Dingbats
  
  // Remove blockquote markers (>)
  cleaned = cleaned.replace(/^\s*>\s+/gm, '');
  
  // Remove excessive punctuation (multiple !, ?, etc.)
  cleaned = cleaned.replace(/([!?.]){2,}/g, '$1');
  
  // Remove standalone special characters that TTS reads literally
  cleaned = cleaned.replace(/[\{\}\[\]\(\)<>]/g, ' ');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
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

    // Clean text for TTS
    const cleanText = cleanTextForTTS(text);
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
