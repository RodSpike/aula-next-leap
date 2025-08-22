import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    if (action === 'start') {
      // Generate initial question
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a Cambridge English placement test examiner. Generate the first question for a placement test that will determine the user's Cambridge level (A1, A2, B1, B2, C1, C2). 

Start with a basic A1 level question. Return ONLY a JSON object with this exact format:
{
  "question": "Your question here",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "level": "A1",
  "questionNumber": 1
}`
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const questionData = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify(questionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'next' && userAnswer && questionIndex !== undefined) {
      // Evaluate answer and generate next question
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a Cambridge English placement test examiner. The user just answered question ${questionIndex}. Their answer was: "${userAnswer}".

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
            }
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // If this is a final assessment, save to user profile
      if (result.finalAssessment && userId) {
        await supabase
          .from('profiles')
          .update({ cambridge_level: result.level })
          .eq('user_id', userId);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in cambridge-placement-test function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});