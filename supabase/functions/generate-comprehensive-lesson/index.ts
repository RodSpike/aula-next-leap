import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonTitle, courseLevel, grammarFocus, vocabularySets, practicalApplications, activities, languageSupport } = await req.json();

    if (!lessonTitle || !courseLevel) {
      throw new Error('Lesson title and course level are required');
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not found');
    }

    // Create language support instruction
    let supportInstruction = "";
    let portuguesePercentage = "";
    
    switch (languageSupport) {
      case "portuguese_heavy":
        supportInstruction = "Use Portuguese extensively to explain concepts, grammar rules, and provide examples. Start explanations in Portuguese and then provide English equivalents.";
        portuguesePercentage = "60-70% Portuguese, 30-40% English";
        break;
      case "portuguese_moderate":
        supportInstruction = "Use moderate Portuguese support for explanations, especially for grammar rules and complex concepts.";
        portuguesePercentage = "40-50% Portuguese, 50-60% English";
        break;
      case "portuguese_light":
        supportInstruction = "Use light Portuguese support only for very complex concepts that might be difficult to understand.";
        portuguesePercentage = "20-30% Portuguese, 70-80% English";
        break;
      case "english_only":
        supportInstruction = "Use only English. Students at this level should not need Portuguese support.";
        portuguesePercentage = "100% English";
        break;
      default:
        supportInstruction = "Use primarily English with occasional Portuguese clarification.";
        portuguesePercentage = "90% English, 10% Portuguese";
    }

    const systemPrompt = `You are a specialized English teacher creating comprehensive lesson content for the Aula Click platform. You create engaging, educational content that follows modern ESL teaching methodologies.

IMPORTANT LANGUAGE SUPPORT GUIDELINES:
- ${supportInstruction}
- Language mix should be: ${portuguesePercentage}
- When using Portuguese, use it naturally to clarify difficult concepts
- Always provide clear, practical examples
- Make the content engaging and interactive

Create structured, professional lesson content that includes:
1. Clear explanations with examples
2. Interactive exercises
3. Practical applications
4. Cultural context when relevant
5. Progressive difficulty appropriate for the level

Format your response as clean, structured HTML with proper headings, tables, lists, and clear organization.`;

    const userPrompt = `Create a comprehensive English lesson for ${courseLevel} level: "${lessonTitle}"

GRAMMAR FOCUS:
${grammarFocus?.map((item: string) => `- ${item}`).join('\n') || 'No specific grammar focus provided'}

VOCABULARY SETS:
${vocabularySets?.map((item: string) => `- ${item}`).join('\n') || 'No specific vocabulary provided'}

PRACTICAL APPLICATIONS:
${practicalApplications?.map((item: string) => `- ${item}`).join('\n') || 'No specific applications provided'}

ACTIVITIES NEEDED:
${activities?.map((item: string) => `- ${item}`).join('\n') || 'No specific activities provided'}

Please create a complete lesson with:

1. **Lesson Introduction** (${languageSupport === 'english_only' ? 'in English' : 'with appropriate Portuguese support'})
   - Warm-up activity
   - Learning objectives
   - Context setting

2. **Grammar Section** (with clear explanations ${languageSupport !== 'english_only' ? 'in Portuguese and English' : 'in English'})
   - Grammar rules with examples
   - Usage patterns
   - Common mistakes to avoid
   - Practice sentences

3. **Vocabulary Section**
   - Word lists with definitions ${languageSupport !== 'english_only' ? '(in Portuguese and English)' : '(in English)'}
   - Example sentences
   - Pronunciation tips
   - Collocations and phrases

4. **Practice Activities**
   - Multiple choice questions (5-8 questions)
   - Fill-in-the-blank exercises (5-8 sentences)
   - True/False questions (3-5 questions)
   - Speaking practice prompts
   - Writing exercises

5. **Cultural Notes** (when relevant)
   - Cultural context
   - Real-world usage
   - Regional variations

6. **Lesson Summary**
   - Key points review
   - Next lesson preview

Format everything as clean HTML with proper tags, tables for grammar rules, and clear exercise instructions. Use colors sparingly - focus on blue (#3B82F6) and green (#10B981) for highlights and important information.

Make the content engaging, practical, and appropriate for ${courseLevel} level students.`;

    console.log('Sending request to OpenRouter API...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aula-click.lovable.app',
        'X-Title': 'Aula Click - English Learning Platform'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    console.log('OpenRouter API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter API response received successfully');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response structure from OpenRouter API');
    }

    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: generatedContent,
      lessonTitle,
      courseLevel,
      languageSupport,
      grammarFocus,
      vocabularySets
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-comprehensive-lesson function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Unknown error occurred',
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});