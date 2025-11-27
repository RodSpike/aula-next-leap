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
    console.log('Function called successfully');
    const { message, conversation_history, file_data, system_prompt } = await req.json();
    console.log('Request parsed successfully');
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';
    console.log('OpenRouter API key exists:', !!openRouterApiKey);
    console.log('OpenAI API key exists:', !!openaiApiKey);
    console.log('Lovable AI key exists:', !!LOVABLE_API_KEY);

    if (!openRouterApiKey && !openaiApiKey && !LOVABLE_API_KEY) {
      console.error('No AI provider API key configured');
      return new Response(JSON.stringify({
        error: 'AI service temporarily unavailable. Please try again later.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received message:', message);
    console.log('Conversation history length:', conversation_history?.length || 0);
    console.log('File data received:', !!file_data);
    console.log('Custom system prompt:', !!system_prompt);

    // Default system prompt for English tutor
    const defaultSystemPrompt = `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Seu papel é ajudar usuários a aprender e melhorar suas habilidades em inglês. Você deve:

1. Ser paciente, encorajador e solidário
2. Fornecer explicações claras sobre gramática, vocabulário e pronunciação
3. Corrigir erros gentilmente e explicar por que a correção é necessária
4. Oferecer exemplos práticos e exercícios de inglês
5. Ajudar com prática de conversação e discussões
6. Responder perguntas sobre regras gramaticais e conceitos do inglês
7. Sugerir melhorias para estudos e aprendizado de inglês
8. Ser envolvente e tornar o aprendizado divertido
9. Adaptar seu estilo de ensino ao nível do usuário
10. Fornecer contexto cultural quando relevante

ANÁLISE DE ARQUIVOS:
- Quando receber um arquivo de texto, analise completamente o conteúdo em inglês
- Corrija erros de gramática, ortografia e estrutura
- Explique as regras por trás das correções
- Sugira melhorias de vocabulário e estilo
            
FORMATAÇÃO (use Markdown limpo):
- Use títulos (#, ##, ###) curtos e claros
- Use **negrito** para destacar palavras-chave importantes
- Use listas com bullets para passos, dicas e exemplos
- Evite linhas muito longas; use quebras de linha frequentes
- Inclua emojis com moderação para motivação 🎯📚
            
Sempre responda de forma útil e educacional, com formatação bonita e legível em Markdown.`;

    // Build messages array for OpenAI-compatible format
    const messages = [
      {
        role: 'system',
        content: system_prompt || defaultSystemPrompt
      }
    ];

    // Add conversation history (last 10 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      conversation_history.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add file analysis if present
    let userMessage = message || 'Please analyze the uploaded file and provide feedback on the English content.';
    if (file_data) {
      userMessage += `\n\nFILE ANALYSIS REQUEST:\nFile name: ${file_data.name}\nFile type: ${file_data.type}`;
      if (!String(file_data.type || '').startsWith('image/')) {
        userMessage += `\nFile content to analyze:\n${file_data.content}`;
      }
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

    // Choose provider: prefer OpenRouter (DeepSeek), then OpenAI, then Lovable AI
    try {
      let aiResponse = '';
      const providerErrors: Array<{ provider: string; status?: number; message: string }> = [];

      // 1) OpenRouter (DeepSeek) primary
      if (openRouterApiKey && !aiResponse) {
        console.log('Using OpenRouter provider (deepseek) as primary');
        const makeOR = async (maxTokens: number) => {
          const req = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          return req;
        };

        try {
          let orRes = await makeOR(800);
          if (!orRes.ok) {
            const errTxt = await orRes.text();
            console.error('OpenRouter API error:', orRes.status, errTxt);
            if (orRes.status === 402 || errTxt.includes('402')) {
              console.log('Retrying OpenRouter with reduced max_tokens');
              orRes = await makeOR(400);
            }
          }
          if (!orRes.ok) {
            const finalErr = await orRes.text();
            providerErrors.push({ provider: 'OpenRouter/DeepSeek', status: orRes.status, message: finalErr });
          } else {
            const orData = await orRes.json();
            aiResponse = orData.choices?.[0]?.message?.content || '';
          }
        } catch (e: any) {
          providerErrors.push({ provider: 'OpenRouter/DeepSeek', message: e?.message ?? 'Unknown OpenRouter error' });
        }
      }

      // 2) OpenAI fallback
      if (!aiResponse && openaiApiKey) {
        console.log('Using OpenAI provider (gpt-4o-mini) fallback');
        try {
          const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages,
              temperature: 0.7,
              max_tokens: 600,
            }),
          });

          if (!oaiRes.ok) {
            const txt = await oaiRes.text();
            console.error('OpenAI API error:', oaiRes.status, txt);
            providerErrors.push({ provider: 'OpenAI', status: oaiRes.status, message: txt });
          } else {
            const oaiData = await oaiRes.json();
            aiResponse = oaiData.choices?.[0]?.message?.content || '';
          }
        } catch (e: any) {
          providerErrors.push({ provider: 'OpenAI', message: e?.message ?? 'Unknown OpenAI error' });
        }
      }

      // 3) Lovable AI fallback
      if (!aiResponse && LOVABLE_API_KEY) {
        console.log('Using Lovable AI Gateway (gemini-2.5-flash) as final fallback');
        try {
          const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages,
              stream: false,
            }),
          });

          if (!aiRes.ok) {
            const t = await aiRes.text();
            console.error('Lovable AI error:', aiRes.status, t);
            if (aiRes.status === 429) {
              providerErrors.push({ provider: 'Lovable AI', status: 429, message: 'Rate limits exceeded' });
            } else if (aiRes.status === 402) {
              providerErrors.push({ provider: 'Lovable AI', status: 402, message: 'Payment required' });
            } else {
              providerErrors.push({ provider: 'Lovable AI', status: aiRes.status, message: t });
            }
          } else {
            const data = await aiRes.json();
            aiResponse = data.choices?.[0]?.message?.content || '';
          }
        } catch (e: any) {
          providerErrors.push({ provider: 'Lovable AI', message: e?.message ?? 'Unknown Lovable AI error' });
        }
      }

      if (!aiResponse) {
        return new Response(JSON.stringify({ error: 'All AI providers failed', providers: providerErrors }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (providerError) {
      console.error('Provider error:', providerError);
      return new Response(JSON.stringify({ error: 'AI provider error. Please try again.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in english-tutor-chat function:', error);
    
    // Type-safe error logging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: `Chat function error: ${errorMessage}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});