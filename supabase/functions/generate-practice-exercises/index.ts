import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonContent, lessonTitle } = await req.json();

    if (!lessonContent || !lessonTitle) {
      throw new Error('Lesson content and title are required');
    }

    console.log('Generating practice exercises for:', lessonTitle);

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert English language teacher creating practice exercises. 
Generate 12-15 diverse, engaging exercises based on the lesson content provided.

CRITICAL REQUIREMENTS:
- Create EXACTLY 12-15 exercises minimum
- Mix exercise types: multiple choice, fill-in-the-blank, true/false, matching, sentence completion
- Exercises should progressively increase in difficulty
- Each exercise must test a different aspect of the lesson
- Provide clear, concise explanations for correct answers
- Make exercises practical and relevant to real-world usage

Return a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Why this is correct",
    "order_index": 0
  }
]`;

    const userPrompt = `Create 12-15 practice exercises for this lesson:

LESSON: ${lessonTitle}

CONTENT:
${lessonContent.substring(0, 8000)}

Remember:
- 12-15 exercises minimum
- Variety of question types
- Progressive difficulty
- Real-world applicability
- Clear explanations`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const result = await response.json();
    const contentRaw = result.choices?.[0]?.message?.content;

    let exercises;
    try {
      if (typeof contentRaw === 'string') {
        let str = contentRaw.trim();
        // Strip markdown fences if present
        if (str.startsWith('```')) {
          str = str.replace(/^```[a-zA-Z]*\s*/,'').replace(/```\s*$/,'');
        }
        // Try to isolate JSON portion
        const firstBrace = Math.min(
          ...[str.indexOf('{'), str.indexOf('[')].filter(i => i !== -1)
        );
        if (Number.isFinite(firstBrace) && firstBrace > 0) {
          str = str.slice(firstBrace);
        }
        const lastBrace = Math.max(str.lastIndexOf('}'), str.lastIndexOf(']'));
        if (lastBrace !== -1) {
          str = str.slice(0, lastBrace + 1);
        }
        const parsed = JSON.parse(str);
        exercises = parsed.exercises || parsed;
      } else if (contentRaw && typeof contentRaw === 'object') {
        exercises = (contentRaw as any).exercises || contentRaw;
      } else {
        throw new Error('No content received from AI');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', contentRaw);
      throw new Error('Invalid JSON response from AI');
    }

    if (!Array.isArray(exercises)) {
      throw new Error('Exercises must be an array');
    }

    // Ensure we have at least 12 exercises
    if (exercises.length < 12) {
      console.warn(`Only ${exercises.length} exercises generated, expected 12+`);
    }

    console.log(`Successfully generated ${exercises.length} exercises`);

    return new Response(
      JSON.stringify({ exercises }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating exercises:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate exercises',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
