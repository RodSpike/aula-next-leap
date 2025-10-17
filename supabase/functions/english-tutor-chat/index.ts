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
    const { message, conversation_history, file_data } = await req.json();
    console.log('Request parsed successfully');
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    console.log('OpenRouter API key exists:', !!openRouterApiKey);
    console.log('OpenAI API key exists:', !!openaiApiKey);

    if (!openRouterApiKey && !openaiApiKey) {
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

    // Build messages array for OpenAI-compatible format
    const messages = [
      {
        role: 'system',
        content: `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Seu papel é ajudar usuários a aprender e melhorar suas habilidades em inglês. Você deve:

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
11. Criar exercícios interativos fazendo perguntas como "Agora vamos fazer um exercício. Qual é..." ou "Você pode me dizer..."
12. Guiar estudantes através de aprendizado passo a passo com perguntas de acompanhamento

ANÁLISE DE ARQUIVOS:
- Quando receber um arquivo de texto, analise completamente o conteúdo em inglês
- Corrija erros de gramática, ortografia e estrutura
- Explique as regras por trás das correções
- Sugira melhorias de vocabulário e estilo
- Para imagens com texto, extraia e analise qualquer texto em inglês visível
- Forneça feedback detalhado e educativo
- Sugira exercícios relacionados ao conteúdo do arquivo
- Identifique padrões de erro para foco de estudo
            
            FORMATAÇÃO (use Markdown limpo):
            - Use títulos (#, ##, ###) curtos e claros
            - Use **negrito** para destacar palavras-chave importantes
            - Use listas com bullets para passos, dicas e exemplos
            - Use blocos de código somente para trechos a repetir ou destaque
            - Evite linhas muito longas; use quebras de linha frequentes
            - Inclua emojis com moderação para motivação 🎯📚
            
            Sempre responda de forma útil e educacional, com formatação bonita e legível em Markdown.`
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

    // Choose provider: prefer OpenRouter (DeepSeek), fallback to Lovable AI, then OpenAI
    try {
      let aiResponse = '';

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

      if (openRouterApiKey) {
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
              max_tokens: maxTokens,
              stream: false,
            }),
          });
          return req;
        };

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
          return new Response(JSON.stringify({ error: `OpenRouter API error: ${orRes.status} - ${finalErr}` }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const orData = await orRes.json();
        aiResponse = orData.choices?.[0]?.message?.content || '';
      } else if (LOVABLE_API_KEY) {
        console.log('Using Lovable AI Gateway (gemini-2.5-flash) as fallback');
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
            return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (aiRes.status === 402) {
            return new Response(JSON.stringify({ error: 'Payment required for AI usage. Please add credits to Lovable AI workspace.' }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error(`Lovable AI gateway error: ${aiRes.status}`);
        }
        const data = await aiRes.json();
        aiResponse = data.choices?.[0]?.message?.content || '';
      } else if (openaiApiKey) {
        console.log('Using OpenAI provider (gpt-4o-mini) as last resort');
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
          throw new Error(`OpenAI API error: ${oaiRes.status}`);
        }
        const oaiData = await oaiRes.json();
        aiResponse = oaiData.choices?.[0]?.message?.content || '';
      }

      if (!aiResponse) {
        return new Response(JSON.stringify({ error: 'Empty AI response' }), {
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