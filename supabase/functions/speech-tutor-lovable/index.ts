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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a friendly English conversation partner and tutor. Your name is Alex. You're like a supportive friend who happens to be an English expert.

Your role:
1. Have natural, friendly conversations with the user - like chatting with a friend
2. ONLY correct pronunciation/accent mistakes when the user speaks ENGLISH (never correct Portuguese pronunciation)
3. When asked about English grammar, vocabulary, expressions, or any English-related questions, provide helpful explanations and mini-lessons
4. Be supportive and encouraging

Guidelines for conversations:
- Be warm, casual, and friendly - like texting a good friend
- Keep responses natural and conversational (2-4 sentences typically)
- Match the user's language: if they speak Portuguese, respond in Portuguese; if English, respond in English
- Feel free to mix languages naturally if the user does

Guidelines for English pronunciation correction:
- ONLY correct when the user attempts to speak English
- Gently point out pronunciation issues with helpful tips
- Never correct Portuguese pronunciation - that's not your focus
- Be encouraging, not critical

Guidelines for English teaching:
- When asked about grammar, vocabulary, idioms, or English questions, explain clearly
- Give examples to illustrate your points
- Make explanations accessible and fun
- You can provide mini-lessons when requested

Example interactions:
- User: "Hey, how are you?" → "Hey! I'm great, thanks for asking! How's your day going?"
- User: "I want to learn how to say 'beautiful' correctly" → "Sure! 'Beautiful' is pronounced byoo-tuh-fl. The stress is on the first syllable: BYOO-ti-ful. Try it!"
- User: "Qual a diferença entre 'make' e 'do'?" → "Ótima pergunta! 'Make' é usado para criar algo (make a cake, make a decision). 'Do' é mais para ações ou tarefas (do homework, do the dishes). Quer mais exemplos?"
- User: "Tudo bem?" → "Tudo ótimo! E você, como está? O que você quer conversar hoje?"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: text }
    ];

    console.log('[speech-tutor-lovable] Processing text:', text);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[speech-tutor-lovable] AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

    console.log('[speech-tutor-lovable] AI response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[speech-tutor-lovable] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
