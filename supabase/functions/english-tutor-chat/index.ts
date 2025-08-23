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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return new Response(JSON.stringify({
        error: 'Gemini API key not configured'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received message:', message);
    console.log('Conversation history length:', conversation_history?.length || 0);

    // Prepare conversation context for Gemini
    let conversationText = `You are an expert English tutor AI assistant. Your role is to help users learn and improve their English skills. You should:

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
11. Create interactive exercises by asking questions like "Now let's do an exercise. What is..." or "Can you tell me..."
12. Guide students through step-by-step learning with follow-up questions

FORMATTING RULES:
- Use plain text without markdown formatting
- Do NOT use ** for bold text
- Do NOT use * for emphasis
- Do NOT use # for headers
- Use simple, clean text formatting
- Use line breaks for better readability
- Use capital letters for emphasis when needed
- Use quotation marks for examples

Always respond in a helpful, educational manner focused on English learning with clean, readable formatting.

`;

    // Add conversation history (last 10 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      conversation_history.slice(-10).forEach((msg: any) => {
        conversationText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    // Add current message
    conversationText += `User: ${message}\nAssistant:`;

    console.log('Sending request to Gemini');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: conversationText
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(JSON.stringify({
        error: `Gemini API error: ${response.status} - ${errorText}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Received response from Gemini');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid response structure from Gemini:', data);
      throw new Error('Invalid response from Gemini');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

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