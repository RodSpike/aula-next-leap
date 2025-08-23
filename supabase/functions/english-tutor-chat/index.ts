import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Read OPENAI_API_KEY inside the handler to ensure the latest value is used

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history } = await req.json();
    const openAIApiKeyRaw = Deno.env.get('OPENAI_API_KEY') ?? '';
    const openAIApiKey = openAIApiKeyRaw.trim();
    console.log('OPENAI key present:', !!openAIApiKey, 'length:', openAIApiKey?.length || 0);

    if (!openAIApiKey || openAIApiKey.length < 20) {
      console.error('OpenAI API key not configured or invalid');
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received message:', message);
    console.log('Conversation history length:', conversation_history?.length || 0);

    // Prepare conversation context
    const messages = [
      {
        role: 'system',
        content: `You are an expert English tutor AI assistant. Your role is to help users learn and improve their English skills. You should:

1. Be patient, encouraging, and supportive
2. Provide clear explanations for grammar, vocabulary, and pronunciation
3. Correct mistakes gently and explain why the correction is needed
4. Offer practical examples and exercises
5. Help with conversation practice
6. Answer questions about English language rules
7. Suggest improvements for writing and speaking
8. Be engaging and make learning fun
9. Adapt your teaching style to the user's level
10. Provide cultural context when relevant

Always respond in a helpful, educational manner focused on English learning.`
      }
    ];

    // Add conversation history (last 10 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      conversation_history.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({
        error: `OpenAI API error: ${response.status} - ${errorText}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Received response from OpenAI');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenAI:', data);
      throw new Error('Invalid response from OpenAI');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in english-tutor-chat function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error)?.message || 'Unknown error'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});