import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, userAnswer, questionIndex } = await req.json();
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    if (action === 'start') {
      // Generate initial question
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Cambridge English placement test examiner. Generate the first question for a placement test that will determine the user's Cambridge level (A1, A2, B1, B2, C1, C2). 

Start with a basic A1 level question. Return ONLY a JSON object with this exact format:
{
  "question": "Your question here",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "level": "A1",
  "questionNumber": 1
}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          }
        }),
      });

      if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini response data:', data);

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const textContent = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', textContent);
      
      let questionData;
      try {
        questionData = JSON.parse(textContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', textContent);
        throw new Error('Failed to parse AI response as JSON');
      }

      return new Response(JSON.stringify(questionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'next' && userAnswer && questionIndex !== undefined) {
      // Evaluate answer and generate next question
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Cambridge English placement test examiner. The user just answered question ${questionIndex}. Their answer was: "${userAnswer}".

Based on their performance so far, generate the next appropriate question. If they're doing well, increase difficulty. If struggling, maintain or decrease difficulty.

After 10 questions total, instead of a question, provide a final assessment.

If this is question 10 or more, return a final assessment in this format:
{
  "finalAssessment": true,
  "level": "B1",
  "explanation": "Based on your answers, your Cambridge English level is B1 (Intermediate)..."
}

Otherwise, return a question in this format:
{
  "question": "Your question here",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "level": "B1",
  "questionNumber": ${questionIndex + 1}
}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 400,
          }
        }),
      });

      if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini response data:', data);

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const textContent = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', textContent);
      
      let result;
      try {
        result = JSON.parse(textContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', textContent);
        throw new Error('Failed to parse AI response as JSON');
      }

      // If this is a final assessment, save to user profile
      if (result.finalAssessment && userId) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ cambridge_level: result.level })
            .eq('user_id', userId);
            
          if (profileError) {
            console.error('Profile update error:', profileError);
          }
        } catch (profileError) {
          console.error('Profile update failed:', profileError);
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in cambridge-placement-test function:', error);
    
    // Return appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message?.includes('API key not configured')) {
      statusCode = 500;
      errorMessage = 'Service configuration error';
    } else if (error.message?.includes('Gemini API failed')) {
      statusCode = 502;
      errorMessage = 'External service error';
    } else if (error.message?.includes('Failed to parse')) {
      statusCode = 502;
      errorMessage = 'Service response error';
    } else if (error.message?.includes('Invalid action')) {
      statusCode = 400;
      errorMessage = 'Invalid request action';
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});