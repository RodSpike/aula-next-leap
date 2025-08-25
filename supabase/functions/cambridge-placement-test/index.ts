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
    const { action, userId, userAnswer, questionIndex, askedQuestions, correctAnswer, currentLevel } = await req.json();
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    if (action === 'start') {
      // Generate initial question using Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Cambridge English placement test examiner. You must respond ONLY with valid JSON objects, no additional text.

Generate the first question for a Cambridge English placement test that will determine the user's level (A1, A2, B1, B2, C1, C2). 

IMPORTANT RULES:
1. Start with A2 level (not A1) - basic but not absolute beginner
2. NEVER create questions that require images, pictures, or visual content
3. Only create sentence completion questions with multiple choice answers
4. Focus on grammar, vocabulary, and sentence structure
5. Make questions unique and varied - avoid repetitive patterns

Return ONLY a JSON object with this exact format:
{
  "question": "Complete the sentence: I _____ to work every day.",
  "options": ["A) go", "B) goes", "C) going", "D) went"],
  "level": "A2",
  "questionNumber": 1,
  "correctAnswer": "A",
  "askedQuestions": ["I _____ to work every day."]
}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 300,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, response.statusText, errorText);
        throw new Error(`Gemini API failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini response data:', data);

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const textContent = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', textContent);
      
      let questionData;
      try {
        // Strip markdown code blocks if present
        const cleanedContent = textContent.replace(/```json\n?|\n?```/g, '').trim();
        questionData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', textContent);
        throw new Error('Failed to parse AI response as JSON');
      }

      return new Response(JSON.stringify(questionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'next' && userAnswer && questionIndex !== undefined) {
      // Evaluate answer and generate next question using Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Cambridge English placement test examiner. You must respond ONLY with valid JSON objects, no additional text.

The user just answered question ${questionIndex}. Their answer was: "${userAnswer}". The correct answer was: "${correctAnswer}". Current assessed level: "${currentLevel || 'A2'}".

Previously asked questions to avoid repetition: ${JSON.stringify(askedQuestions || [])}

ADAPTIVE DIFFICULTY RULES:
- Start at A2 level
- If answer is correct: increase difficulty (A2→B1→B2→C1→C2)
- If answer is wrong: maintain or decrease difficulty slightly
- Track confidence in level assessment

IMPORTANT RULES:
1. NEVER create questions that require images, pictures, or visual content
2. Only create sentence completion questions with multiple choice answers
3. NEVER repeat similar questions - check the askedQuestions array
4. Make each question unique in structure and content
5. Focus on different grammar points, vocabulary, and sentence structures
6. Maximum 20 questions total
7. If confidence is high after minimum 8 questions, provide final assessment

Early termination criteria:
- If user answers 3+ consecutive questions correctly at same level = confident at that level
- If user answers 3+ consecutive questions incorrectly = confirmed at lower level
- Minimum 8 questions, maximum 20 questions

If you determine the level with confidence OR reached 20 questions, return final assessment:
{
  "finalAssessment": true,
  "level": "B1", 
  "explanation": "Based on your ${questionIndex} answers, your Cambridge English level is B1 (Intermediate). You demonstrated solid understanding of...",
  "questionsAnswered": ${questionIndex}
}

Otherwise, return a question that is completely different from previous ones:
{
  "question": "Complete the sentence: [NEW UNIQUE SENTENCE]",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "level": "[APPROPRIATE_LEVEL]",
  "questionNumber": ${questionIndex + 1},
  "correctAnswer": "[A/B/C/D]",
  "askedQuestions": [previous questions + this new question]
}`
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 500,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, response.statusText, errorText);
        throw new Error(`Gemini API failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini response data:', data);

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const textContent = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', textContent);
      
      let result;
      try {
        // Strip markdown code blocks if present
        const cleanedContent = textContent.replace(/```json\n?|\n?```/g, '').trim();
        result = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', textContent);
        throw new Error('Failed to parse AI response as JSON');
      }

      // If this is a final assessment, save to user profile and auto-join community group
      if (result.finalAssessment && userId) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ cambridge_level: result.level })
            .eq('user_id', userId);
            
          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          // Auto-join appropriate community group based on level
          const { data: groups } = await supabase
            .from('community_groups')
            .select('id')
            .eq('level', result.level)
            .eq('is_default', true)
            .limit(1);

          if (groups && groups.length > 0) {
            const { error: memberError } = await supabase
              .from('group_members')
              .insert({
                group_id: groups[0].id,
                user_id: userId,
                status: 'accepted',
                can_post: true
              });
            
            if (memberError) {
              console.error('Group membership error:', memberError);
            } else {
              result.autoJoinedGroup = true;
              result.groupLevel = result.level;
            }
          }
        } catch (error) {
          console.error('Profile/group update failed:', error);
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