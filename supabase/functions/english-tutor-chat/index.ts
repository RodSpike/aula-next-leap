import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, file_data, system_prompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

    if (!LOVABLE_API_KEY && !openRouterApiKey && !GROQ_API_KEY) {
      return new Response(JSON.stringify({
        error: 'AI service temporarily unavailable. Please try again later.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default system prompt for English tutor
    const defaultSystemPrompt = `You are ClickAI, an expert English tutor for Brazilian students. You are warm, patient, encouraging, and bilingual (English + PT-BR).

YOUR CORE RULES:
- You UNDERSTAND Portuguese perfectly. Students may write in PT-BR, English, or mix both.
- You RESPOND primarily in Portuguese when explaining grammar concepts, but use English for examples and practice.
- Correct errors gently with explanations and alternatives.
- Use clean Markdown formatting: headings, bold, lists, emojis (moderately).
- NEVER use LaTeX formatting. Use Unicode symbols: → ← ↔ × ÷ ≠ ≤ ≥

YOUR CAPABILITIES:
1. Grammar explanations with clear examples
2. Vocabulary building with context
3. Conversation practice and role-play
4. Writing correction and improvement
5. File/text analysis and correction
6. Cultural context and idiomatic expressions
7. Study tips and learning strategies

FORMATTING:
- Use ## for section titles (short)
- Use **bold** for key terms
- Use bullet lists for steps and examples
- Include emojis for engagement 🎯📚✨
- Keep responses concise but complete`;

    // Build messages array
    const messages: Array<{role: string; content: string}> = [
      { role: 'system', content: system_prompt || defaultSystemPrompt }
    ];

    // Add conversation history (last 10)
    if (conversation_history && Array.isArray(conversation_history)) {
      conversation_history.slice(-10).forEach((msg: any) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Build user message
    let userMessage = message || 'Please analyze the uploaded file and provide feedback on the English content.';
    if (file_data) {
      userMessage += `\n\nFILE ANALYSIS REQUEST:\nFile name: ${file_data.name}\nFile type: ${file_data.type}`;
      if (!String(file_data.type || '').startsWith('image/')) {
        userMessage += `\nFile content:\n${file_data.content}`;
      }
    }
    messages.push({ role: 'user', content: userMessage });

    let aiResponse = '';
    const providerErrors: Array<{ provider: string; status?: number; message: string }> = [];

    // 1) Lovable AI (primary - reliable, good quality)
    if (!aiResponse && LOVABLE_API_KEY) {
      try {
        console.log('[tutor-chat] Using Lovable AI (primary)');
        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        } else {
          const errText = await res.text();
          console.error('[tutor-chat] Lovable AI error:', res.status, errText);
          providerErrors.push({ provider: 'Lovable AI', status: res.status, message: errText });
        }
      } catch (e: any) {
        providerErrors.push({ provider: 'Lovable AI', message: e?.message ?? 'Unknown error' });
      }
    }

    // 2) Groq fallback (fast, free)
    if (!aiResponse && GROQ_API_KEY) {
      try {
        console.log('[tutor-chat] Using Groq fallback');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        } else {
          const errText = await res.text();
          providerErrors.push({ provider: 'Groq', status: res.status, message: errText });
        }
      } catch (e: any) {
        providerErrors.push({ provider: 'Groq', message: e?.message ?? 'Unknown error' });
      }
    }

    // 3) OpenRouter fallback (DeepSeek)
    if (!aiResponse && openRouterApiKey) {
      try {
        console.log('[tutor-chat] Using OpenRouter fallback');
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': 'https://frbmvljizolvxcxdkefa.supabase.co',
            'X-Title': 'English Tutor Chat',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages,
            temperature: 0.7,
            max_tokens: 800,
            stream: false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        } else {
          const errText = await res.text();
          providerErrors.push({ provider: 'OpenRouter', status: res.status, message: errText });
        }
      } catch (e: any) {
        providerErrors.push({ provider: 'OpenRouter', message: e?.message ?? 'Unknown error' });
      }
    }

    if (!aiResponse) {
      console.error('[tutor-chat] All providers failed:', providerErrors);
      return new Response(JSON.stringify({ error: 'All AI providers failed', providers: providerErrors }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[tutor-chat] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: `Chat function error: ${errorMessage}` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
