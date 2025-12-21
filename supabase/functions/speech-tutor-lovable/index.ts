import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, conversationHistory = [] } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const systemPrompt = `You are Alex, a friendly English conversation partner focused on helping users practice English fluency. You ONLY understand and respond in English.

Your main goal: Help users practice speaking English freely and naturally to build fluency.

Your role:
1. Have natural, friendly conversations in English - like chatting with a friend
2. When you notice pronunciation or grammar issues, gently point them out with helpful corrections
3. Answer any questions about English grammar, vocabulary, expressions, idioms, or usage
4. Encourage users to speak more and build confidence

Important rules:
- You ONLY understand English. If something is unclear, ask the user to rephrase in English
- Always respond in English
- Be warm, casual, and supportive - like a friend who's great at English
- Keep responses natural and conversational (2-4 sentences typically)
- When correcting, be encouraging, not critical

When you notice issues:
- Gently correct pronunciation with phonetic tips (e.g., "Try pronouncing it as 'byoo-ti-ful'")
- Point out grammar mistakes helpfully (e.g., "Just a small note: it's 'I went' not 'I goed'")
- Suggest better word choices when appropriate

Example interactions:
- User: "Hey, how are you?" → "Hey! I'm doing great, thanks! How about you? What's on your mind today?"
- User: "I want to learn how to say beautiful correctly" → "Sure! 'Beautiful' is pronounced BYOO-ti-ful, with stress on the first syllable. The 'eau' makes a 'yoo' sound. Try saying it!"
- User: "What is difference between make and do?" → "Great question! 'Make' is for creating things (make a cake, make a decision). 'Do' is for actions and tasks (do homework, do the dishes). Want some practice sentences?"
- User: "I goed to the store yesterday" → "Nice! Just a small correction - the past tense of 'go' is 'went', so it's 'I went to the store yesterday.' What did you buy?"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: text }
    ];

    console.log('[speech-tutor-groq] Processing text:', text);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[speech-tutor-groq] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Groq API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

    console.log('[speech-tutor-groq] AI response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[speech-tutor-groq] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
