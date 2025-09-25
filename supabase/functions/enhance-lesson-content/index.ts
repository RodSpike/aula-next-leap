import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, sectionType } = await req.json();

    console.log('Enhancing content:', { title, sectionType, contentLength: content?.length });

    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
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

Return only the enhanced HTML content, no additional text or explanations.`;

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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
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
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const enhancedContent = data.choices[0].message.content;

    console.log('Content enhanced successfully');

    return new Response(JSON.stringify({ enhancedContent }), {
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