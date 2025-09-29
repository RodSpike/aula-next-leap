import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean HTML content
function cleanHtmlContent(content: string): string {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Remove markdown code fences
  if (cleaned.startsWith('```html') || cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  
  // Extract content from body tags if present
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  }
  
  // Remove script and style tags for security
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  return cleaned.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, sectionType } = await req.json();

    console.log('Enhancing content:', { title, sectionType, contentLength: content?.length });

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    const orKey = Deno.env.get('OPENROUTER_API_KEY') ?? openRouterApiKey ?? '';

    if (!openaiApiKey && !orKey) {
      throw new Error('AI provider not configured');
    }

    const systemPrompt = `You are an expert educational content designer. Your task is to enhance the visual presentation of lesson content while preserving ALL educational material.

CRITICAL RULES:
- PRESERVE ALL original text, examples, and educational content
- ONLY improve visual presentation, structure, and formatting
- Use proper HTML structure with educational CSS classes
- Add visual elements like icons, highlights, and organized sections
- Make content more engaging and readable
- Maintain pedagogical value

Available CSS classes for styling:
- .lesson-container, .lesson-header, .lesson-title
- .grammar-section, .grammar-rule, .grammar-example
- .vocab-section, .vocab-word, .vocab-definition
- .cultural-section, .cultural-note
- .practice-section, .exercise-container
- .highlight, .important, .tip-box, .example-box
- Standard educational styling is available

Special handling for different content types:
- full_lesson: Create a complete lesson structure with proper sections, headings, and flow
- Individual sections: Focus on that specific section type (grammar, vocabulary, etc.)

Return ONLY the raw HTML content without any markdown fences, body tags, or additional text.`;

    let userPrompt;
    
    if (sectionType === 'full_lesson') {
      userPrompt = `Enhance the visual presentation of this complete lesson:

Title: ${title}
Content: ${content}

This is a full lesson, so create a comprehensive, well-structured educational experience with:
- Clear lesson introduction and objectives
- Properly organized sections with headings
- Visual elements and highlights
- Educational flow from introduction to practice
- Interactive elements where appropriate

Preserve ALL the original educational content while making it visually engaging.`;
    } else {
      userPrompt = `Enhance the visual presentation of this ${sectionType} content:

Title: ${title}
Content: ${content}

Make it visually appealing with proper structure, but preserve ALL the original educational content.`;
    }

    // Prefer OpenAI, fallback to OpenRouter with reduced tokens and a retry if needed
    let enhancedHtml = '';

    if (openaiApiKey) {
      console.log('Enhance: Using OpenAI (gpt-4o-mini)');
      const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 1200,
        }),
      });

      if (!oaiRes.ok) {
        const t = await oaiRes.text();
        console.error('OpenAI error:', oaiRes.status, t);
        throw new Error(`OpenAI API error: ${oaiRes.status}`);
      }
      const oaiData = await oaiRes.json();
      enhancedHtml = oaiData.choices?.[0]?.message?.content || '';
    } else {
      console.log('Enhance: Using OpenRouter (deepseek)');
      const makeOR = async (maxTokens: number) => fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://frbmvljizolvxcxdkefa.supabase.co',
          'X-Title': 'English Learning App'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.6,
        }),
      });

      let orRes = await makeOR(900);
      if (!orRes.ok) {
        const errTxt = await orRes.text();
        console.error('OpenRouter error:', orRes.status, errTxt);
        if (orRes.status === 402 || errTxt.includes('402')) {
          console.log('Retrying OpenRouter with fewer tokens');
          orRes = await makeOR(500);
        }
      }
      if (!orRes.ok) {
        const finalErr = await orRes.text();
        throw new Error(`OpenRouter API error: ${orRes.status} - ${finalErr}`);
      }
      const orData = await orRes.json();
      enhancedHtml = orData.choices?.[0]?.message?.content || '';
    }

    // Clean the enhanced content - remove markdown fences, body wrappers, scripts
    const cleanedContent = cleanHtmlContent(enhancedHtml);

    console.log('Content enhanced successfully');

    return new Response(JSON.stringify({ enhancedContent: cleanedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in enhance-lesson-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});