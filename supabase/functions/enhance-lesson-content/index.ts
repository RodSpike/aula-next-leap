import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Restrict and echo allowed origins per request (preview + production)
const allowedOrigins = [
  'https://preview--aula-next-leap.lovable.app',
  'https://aula-click-production-domain.com'
] as const;

// Helper function to clean HTML content
function cleanHtmlContent(content: string): string {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Remove all markdown code fences (backticks)
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');
  cleaned = cleaned.replace(/^`+|`+$/g, '');
  
  // Remove "html" prefix if present
  cleaned = cleaned.replace(/^html\s*\n/i, '');
  
  // Extract content from body tags if present
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  }
  
  // Extract from html tags if present
  const htmlMatch = cleaned.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
  if (htmlMatch) {
    cleaned = htmlMatch[1].trim();
    // Try body again after removing html wrapper
    const bodyMatch2 = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch2) {
      cleaned = bodyMatch2[1].trim();
    }
  }
  
  // Remove script and style tags for security
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  return cleaned.trim();
}

// Fallback formatter when AI providers are unavailable
function fallbackFormatter(content: string, title: string, sectionType: string): string {
  if (!content) return '<article><p>No content available</p></article>';
  
  // Check if content already contains HTML tags (from previous enhancement)
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
  
  if (hasHtmlTags) {
    // Content already has HTML - just clean it and return
    let cleaned = content.trim();
    
    // Remove any wrapping divs/containers that might exist
    cleaned = cleaned.replace(/^<div[^>]*>/, '').replace(/<\/div>\s*$/, '');
    
    // Ensure it's wrapped in article tag
    if (!cleaned.startsWith('<article')) {
      cleaned = `<article>${cleaned}</article>`;
    }
    
    return cleaned;
  }
  
  // Content is plain text - convert to semantic HTML
  const escapeHtml = (text: string) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  let formattedHtml = '<article>';
  
  // Add title
  if (sectionType === 'full_lesson') {
    formattedHtml += `<h1>${escapeHtml(title)}</h1>`;
  } else {
    formattedHtml += `<h2>${escapeHtml(title)}</h2>`;
  }
  
  paragraphs.forEach(paragraph => {
    const trimmed = paragraph.trim();
    
    // Heading detection
    if (trimmed.length < 100 && (
      trimmed.toUpperCase() === trimmed || 
      trimmed.endsWith(':') ||
      /^[A-Z][^.!?]*$/.test(trimmed)
    )) {
      formattedHtml += `<h3>${escapeHtml(trimmed.replace(/:$/, ''))}</h3>`;
    } 
    // Bullet list detection
    else if (trimmed.match(/^[-•*]\s/)) {
      const items = trimmed.split('\n').filter(i => i.trim());
      formattedHtml += '<ul>';
      items.forEach(item => {
        const cleaned = item.replace(/^[-•*]\s/, '').trim();
        formattedHtml += `<li>${escapeHtml(cleaned)}</li>`;
      });
      formattedHtml += '</ul>';
    }
    // Numbered list detection
    else if (trimmed.match(/^\d+[\.)]\s/)) {
      const items = trimmed.split('\n').filter(i => i.trim());
      formattedHtml += '<ol>';
      items.forEach(item => {
        const cleaned = item.replace(/^\d+[\.)]\s/, '').trim();
        formattedHtml += `<li>${escapeHtml(cleaned)}</li>`;
      });
      formattedHtml += '</ol>';
    }
    // Bold emphasis patterns
    else if (trimmed.includes('**') || trimmed.includes('__')) {
      let processed = escapeHtml(trimmed);
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
      formattedHtml += `<p>${processed}</p>`;
    }
    // Regular paragraph
    else {
      formattedHtml += `<p>${escapeHtml(trimmed)}</p>`;
    }
  });
  
  formattedHtml += '</article>';
  
  return formattedHtml;
}

serve(async (req) => {
  // Determine allowed origin for this request
  const origin = req.headers.get('origin') || '';
  const allowOrigin = (allowedOrigins as readonly string[]).includes(origin) ? origin : '*';

  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: { ...corsHeaders, 'Access-Control-Allow-Origin': allowOrigin }
    });
  }

  try {
    const { content, title, sectionType } = await req.json();

    console.log('Enhancing content:', { title, sectionType, contentLength: content?.length });

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') ?? openRouterApiKey ?? '';
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') ?? '';
    
    if (!openaiApiKey && !openRouterKey && !lovableKey) {
      console.warn('No AI provider keys configured; will use non-AI fallback formatter.');
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
    const isFullLesson = sectionType === 'full_lesson';
    
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

    // Provider priority: OpenRouter (DeepSeek) -> OpenAI -> Lovable AI
    let enhancedHtml = '';
    const providerErrors: Array<{ provider: string; status?: number; message: string }> = [];
    let lastStatus: number | undefined;

    if (openRouterKey && !enhancedHtml) {
      try {
        console.log('Enhance: Trying OpenRouter (DeepSeek)');
        const makeOR = async (maxTokens: number) => fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
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
          lastStatus = orRes.status;
          providerErrors.push({ provider: 'OpenRouter/DeepSeek', status: orRes.status, message: finalErr });
        } else {
          const orData = await orRes.json();
          enhancedHtml = orData.choices?.[0]?.message?.content || '';
        }
      } catch (e: any) {
        providerErrors.push({ provider: 'OpenRouter/DeepSeek', message: e?.message ?? 'Unknown OpenRouter error' });
      }
    }

    if (!isFullLesson && openaiApiKey && !enhancedHtml) {
      try {
        console.log('Enhance: Trying OpenAI (gpt-4o-mini) fallback');
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
          lastStatus = oaiRes.status;
          providerErrors.push({ provider: 'OpenAI', status: oaiRes.status, message: t });
        } else {
          const oaiData = await oaiRes.json();
          enhancedHtml = oaiData.choices?.[0]?.message?.content || '';
        }
      } catch (e: any) {
        providerErrors.push({ provider: 'OpenAI', message: e?.message ?? 'Unknown OpenAI error' });
      }
    }

    if (!isFullLesson && lovableKey && !enhancedHtml) {
      try {
        console.log('Enhance: Trying Lovable AI Gateway (gemini-2.5-flash) fallback');
        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: false,
          }),
        });

        if (!aiRes.ok) {
          const t = await aiRes.text();
          console.error('Lovable AI error:', aiRes.status, t);
          lastStatus = aiRes.status;
          providerErrors.push({ provider: 'Lovable AI', status: aiRes.status, message: t });
        } else {
          const data = await aiRes.json();
          enhancedHtml = data.choices?.[0]?.message?.content || '';
        }
      } catch (e: any) {
        providerErrors.push({ provider: 'Lovable AI', message: e?.message ?? 'Unknown Lovable AI error' });
      }
    }

    if (!enhancedHtml) {
      console.log('All AI providers failed, using fallback formatter');
      enhancedHtml = fallbackFormatter(content, title, sectionType);
    }

    // Clean the enhanced content - remove markdown fences, body wrappers, scripts
    const cleanedContent = cleanHtmlContent(enhancedHtml);

    console.log('Content enhanced successfully');

return new Response(JSON.stringify({ enhancedContent: cleanedContent }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin },
});
} catch (error: any) {
  console.error('Error in enhance-lesson-content function:', error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin },
  });
}
});