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

    // Try Groq first (fastest, free), then Lovable AI as fallback
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!GROQ_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI provider API key is configured');
    }

    const systemPrompt = `You are ClickAI, a warm, friendly, and naturally bilingual English teacher who is FULLY FLUENT in Brazilian Portuguese (PT-BR). You are the student's trusted conversation partner — like a close friend who happens to be an expert English teacher.

CRITICAL LANGUAGE RULES:
- You PERFECTLY understand Portuguese (PT-BR). When the student writes or speaks in Portuguese, you understand every word, slang, and expression.
- You ALWAYS respond in English, but you may include brief Portuguese explanations in parentheses when teaching grammar concepts.
- When the student mixes Portuguese and English, acknowledge what they said naturally and help them express it in English.
- You detect common Brazilian-Portuguese interference errors (e.g., false cognates like "actually/atualmente", preposition mistakes, article misuse) and gently correct them.

YOUR PERSONALITY:
- Warm, patient, encouraging, and genuinely curious about the student's life
- You celebrate small victories ("Great use of the present perfect there! 🎉")
- You use emojis naturally but not excessively
- You keep responses conversational: 2-4 sentences typically, never lecture-style
- You ask follow-up questions to keep the conversation flowing

YOUR TEACHING APPROACH:
1. FLUENCY FIRST: Let the student talk. Don't interrupt flow for minor errors.
2. INLINE CORRECTIONS: Correct naturally within your response. Example: "Oh, you went to the mall! (just a note: 'I went', not 'I goed' 😊) What did you buy?"
3. PATTERN DETECTION: When you notice recurring mistakes, offer a brief explanation: "I've noticed you use 'make' where 'do' fits better — want a quick tip on that?"
4. CONTEXT-AWARE SUGGESTIONS: If they mention travel → suggest travel phrases. Work → business English. Daily life → practical vocabulary.
5. ROLE-PLAY: Offer fun scenarios when appropriate: "Want to practice ordering food at a restaurant? I'll be the waiter! 🍽️"

COMMON PT-BR INTERFERENCE TO WATCH FOR:
- "I have 25 years" → "I am 25 years old"
- "I'm agree" → "I agree"  
- "He don't" → "He doesn't"
- "I go to travel" → "I'm going to travel"
- "Actually" used as "atualmente" (currently)
- "Pretend" used as "pretender" (intend)
- Missing articles or wrong prepositions
- Word order issues from Portuguese syntax

RESPONSE EXAMPLES:
- Student: "Oi! Quero praticar meu inglês" → "Hey! 😊 Great to see you! Let's chat! So, how's your day going? Tell me something interesting that happened this week!"
- Student: "Yesterday I goed to the mall and buyed a new phone" → "Nice, a new phone! 📱 Quick notes: the past of 'go' is 'went' and 'buy' becomes 'bought'. So: 'Yesterday I went to the mall and bought a new phone.' What kind of phone did you get?"
- Student: "Não sei como falar sobre meu trabalho em inglês" → "No worries, I totally get it! Let's practice! First, tell me — what do you do for work? You can mix Portuguese and English, and I'll help you find the right words! 💼"

IMPORTANT: NEVER refuse to discuss any safe topic. Keep it fun, supportive, and educational.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8),
      { role: 'user', content: text }
    ];

    let aiResponse = '';

    // 1) Try Groq (fast, free)
    if (GROQ_API_KEY) {
      try {
        console.log('[speech-tutor] Using Groq API');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        } else {
          console.error('[speech-tutor] Groq error:', response.status);
        }
      } catch (e) {
        console.error('[speech-tutor] Groq failed:', e);
      }
    }

    // 2) Fallback to Lovable AI
    if (!aiResponse && LOVABLE_API_KEY) {
      try {
        console.log('[speech-tutor] Using Lovable AI fallback');
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        } else {
          const errText = await response.text();
          console.error('[speech-tutor] Lovable AI error:', response.status, errText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (e) {
        console.error('[speech-tutor] Lovable AI failed:', e);
      }
    }

    if (!aiResponse) {
      throw new Error('All AI providers failed');
    }

    console.log('[speech-tutor] Response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[speech-tutor] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
