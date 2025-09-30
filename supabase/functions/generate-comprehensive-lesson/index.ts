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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI API key not found');
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

Create a complete lesson with the following structure. Return your response with clear HTML sections and a JSON activities block.

**CRITICAL: You MUST create AT LEAST 12 diverse exercises**, including:
- Multiple choice questions (at least 4)
- Fill in the blank exercises (at least 4)
- True/False questions (at least 2)
- Sentence completion (at least 2)

Each exercise should test different aspects of the grammar and vocabulary. Make them progressively harder.

<!-- LESSON CONTENT START -->
<section class="lesson-introduction">
<h2>Introdução da Lição</h2>
<!-- Include warm-up, objectives, context in ${languageSupport !== 'english_only' ? 'Portuguese and English' : 'English only'} -->
</section>

<section class="grammar-focus">
<h2>Gramática</h2>
<!-- Grammar rules, examples, usage patterns in ${languageSupport !== 'english_only' ? 'Portuguese and English' : 'English only'} -->
</section>

<section class="vocabulary-section">
<h2>Vocabulário</h2>
<!-- Word lists with definitions in ${languageSupport !== 'english_only' ? 'Portuguese and English' : 'English only'} -->
</section>

<section class="practice-activities">
<h2>Atividades Práticas</h2>
<!-- Speaking prompts, writing exercises, practical applications -->
</section>

<section class="cultural-notes">
<h2>Notas Culturais</h2>
<!-- Cultural context when relevant -->
</section>

<section class="lesson-summary">
<h2>Resumo da Lição</h2>
<!-- Key points review -->
</section>
<!-- LESSON CONTENT END -->

<activities>
[
  {
    "type": "multiple_choice",
    "question": "Complete: 'I ___ a student'",
    "options": ["am", "is", "are", "be"],
    "correct_answer": "am",
    "explanation": "Use 'am' with 'I' - Em português: Use 'am' com 'I' (eu sou/estou)"
  },
  {
    "type": "fill_blank",
    "question": "She ___ from Brazil",
    "options": ["is", "are", "am", "be"],
    "correct_answer": "is",
    "explanation": "Use 'is' with he/she/it - Em português: Use 'is' com he/she/it (ele/ela é/está)"
  },
  {
    "type": "true_false", 
    "question": "The sentence 'They are student' is correct",
    "options": ["True", "False"],
    "correct_answer": "False",
    "explanation": "Should be 'students' (plural) - Em português: Deve ser 'students' (plural)"
  },
  {
    "type": "multiple_choice",
    "question": "How do you say 'Good morning' in English?",
    "options": ["Good morning", "Good night", "Good afternoon", "Good evening"],
    "correct_answer": "Good morning",
    "explanation": "Good morning = Bom dia em português"
  },
  {
    "type": "fill_blank",
    "question": "Complete the greeting: 'Hello, ___ are you?'",
    "options": ["how", "what", "where", "who"],
    "correct_answer": "how",
    "explanation": "How are you? = Como você está? em português"
  }
]
</activities>

IMPORTANT: Create AT LEAST 12 exercises that specifically test the grammar and vocabulary for this lesson. Use ${languageSupport !== 'english_only' ? 'bilingual explanations (Portuguese + English)' : 'English explanations only'}.`;

    console.log('Sending request to Lovable AI Gateway (Gemini)...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
      })
    });

    console.log('Lovable AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      if (response.status === 429) {
        throw new Error('Rate limits exceeded, please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required for AI usage. Please add credits to Lovable AI workspace.');
      }
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received successfully');

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