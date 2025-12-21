import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callLovableAI(prompt: string): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('Lovable API key not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to continue.');
    }
    
    throw new Error(`AI API failed with status ${response.status}`);
  }

  const data = await response.json();
  const textContent = data?.choices?.[0]?.message?.content;
  
  if (!textContent) {
    throw new Error('Invalid response structure from AI API');
  }

  // Strip markdown code blocks if present
  const cleanedContent = textContent.replace(/```json\n?|\n?```/g, '').trim();
  
  try {
    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Content:', textContent);
    throw new Error('Failed to parse AI response as JSON');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, userAnswer, questionIndex, askedQuestions, correctAnswer, currentLevel, answersHistory, startedAt } = await req.json();
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    if (action === 'start') {
      const prompt = `You are a Cambridge English placement test examiner. You must respond ONLY with valid JSON objects, no additional text.

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
}`;

      const questionData = await callLovableAI(prompt);
      
      // Add startedAt timestamp for tracking
      questionData.startedAt = new Date().toISOString();
      questionData.answersHistory = [];

      return new Response(JSON.stringify(questionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'next' && userAnswer && questionIndex !== undefined) {
      // Evaluate if the user's answer was correct
      const isCorrect = userAnswer === correctAnswer;
      
      // Build updated answers history
      const updatedAnswersHistory = [
        ...(answersHistory || []),
        {
          questionNumber: questionIndex,
          question: askedQuestions?.[askedQuestions.length - 1] || '',
          userAnswer,
          correctAnswer,
          isCorrect,
          level: currentLevel || 'A2'
        }
      ];
      
      const prompt = `You are a Cambridge English placement test examiner. You must respond ONLY with valid JSON objects, no additional text.

CURRENT SITUATION:
- Question ${questionIndex} just answered
- User's answer: "${userAnswer}" (${isCorrect ? 'CORRECT' : 'WRONG'})
- Correct answer was: "${correctAnswer}"
- Current assessed level: "${currentLevel || 'A2'}"
- Questions completed: ${questionIndex}

Previously asked questions to avoid repetition: ${JSON.stringify(askedQuestions || [])}

ADAPTIVE DIFFICULTY & EARLY TERMINATION LOGIC:
- Start at A2 level, progress based on performance
- Track consecutive correct/incorrect answers at each level
- EARLY TERMINATION CRITERIA (minimum 8 questions):
  * If user gets 3+ consecutive correct answers at B1+ level → confident at that level
  * If user gets 3+ consecutive wrong answers → drop to lower level and assess
  * If user gets 2+ consecutive correct at C1/C2 → confident at that level
  * Strong consistent performance = early termination
- Maximum 20 questions total
- MANDATORY: Question 20 = ALWAYS provide final assessment

QUESTION GENERATION RULES:
1. NEVER create questions requiring images, pictures, or visual content
2. Only sentence completion with multiple choice answers
3. NEVER repeat similar questions - check askedQuestions array carefully
4. Make each question unique in grammar points and vocabulary
5. Vary sentence structures (conditionals, tenses, prepositions, etc.)

LEVEL ASSESSMENT:
- A2: Basic grammar, simple tenses, common vocabulary
- B1: Mixed tenses, conditionals, phrasal verbs, prepositions
- B2: Complex grammar, advanced vocabulary, nuanced meanings
- C1: Sophisticated structures, academic vocabulary, subtle distinctions
- C2: Near-native proficiency, complex expressions, advanced collocations

If you can confidently determine the level (minimum 8 questions) OR reached question 20, return:
{
  "finalAssessment": true,
  "level": "[DETERMINED_LEVEL]", 
  "explanation": "Based on your ${questionIndex} answers, your Cambridge English level is [LEVEL]. You demonstrated [specific strengths and areas]. [Performance analysis]",
  "questionsAnswered": ${questionIndex}
}

Otherwise, return a completely new question with appropriate difficulty:
{
  "question": "Complete the sentence: [UNIQUE SENTENCE TESTING SPECIFIC GRAMMAR POINT]",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "level": "[APPROPRIATE_LEVEL_BASED_ON_PERFORMANCE]",
  "questionNumber": ${questionIndex + 1},
  "correctAnswer": "[A/B/C/D]",
  "askedQuestions": [all previous questions including this new one]
}`;

      const result = await callLovableAI(prompt);

      // Always include answers history in response
      result.answersHistory = updatedAnswersHistory;

      // If this is a final assessment, save to user profile, auto-join community group, and save test attempt
      if (result.finalAssessment && userId) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ cambridge_level: result.level })
            .eq('user_id', userId);
            
          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          // Save the test attempt with full answer history
          const correctAnswers = updatedAnswersHistory.filter((a: any) => a.isCorrect).length;
          const score = updatedAnswersHistory.length > 0 
            ? Math.round((correctAnswers / updatedAnswersHistory.length) * 100) 
            : 0;

          const { error: attemptError } = await supabase
            .from('placement_test_attempts')
            .insert({
              user_id: userId,
              final_level: result.level,
              score,
              total_questions: updatedAnswersHistory.length,
              correct_answers: correctAnswers,
              answers: updatedAnswersHistory,
              started_at: startedAt || new Date().toISOString(),
              completed_at: new Date().toISOString()
            });

          if (attemptError) {
            console.error('Test attempt save error:', attemptError);
          } else {
            console.log('Test attempt saved successfully');
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    let statusCode = 500;
    let displayMessage = 'Internal server error';
    
    if (errorMessage.includes('API key not configured')) {
      statusCode = 500;
      displayMessage = 'Service configuration error';
    } else if (errorMessage.includes('AI API failed') || errorMessage.includes('Rate limit') || errorMessage.includes('credits exhausted')) {
      statusCode = 502;
      displayMessage = errorMessage;
    } else if (errorMessage.includes('Failed to parse')) {
      statusCode = 502;
      displayMessage = 'Service response error';
    } else if (errorMessage.includes('Invalid action')) {
      statusCode = 400;
      displayMessage = 'Invalid request action';
    }
    
    return new Response(JSON.stringify({ 
      error: displayMessage,
      details: errorMessage
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
