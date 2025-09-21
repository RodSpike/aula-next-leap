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
    const { lessonTitle, courseLevel } = await req.json();

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      console.error('Missing OPENROUTER_API_KEY secret');
      return new Response(JSON.stringify({ success: false, error: 'Missing OPENROUTER_API_KEY secret' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Siga estas regras:
- Use texto simples (sem markdown), com quebras de linha para legibilidade
- Adapte ao nível informado e inclua traduções PT-BR
- Sempre inclua exercícios progressivos e um role-play final`;

    const userPrompt = `Crie uma AULA COMPLETA para o nível ${courseLevel} sobre "${lessonTitle}" seguindo este formato:

Aula: ${lessonTitle}

Objetivo:
- Liste objetivos específicos

Parte 1: [título]
- Vocabulário (com tradução)
- Explicações claras
- Exemplos práticos (com tradução)

Parte 2: [título]
- Regras/gramática (tabelas em texto simples se necessário)
- Exemplos afirmativos/negativos/interrogativos (com tradução)

Parte 3: [título]
- Conteúdo adicional relevante
- Mais exemplos contextualizados (com tradução)

Práticas e Exercícios:
1. Exercício 1 com instruções claras
2. Exercício 2
3. Role-play/diálogo com tradução

Requisitos:
- 15–20 palavras novas de vocabulário
- Traduções PT-BR em todos os exemplos
- Conteúdo detalhado porém claro para ${courseLevel}`;

    const payload = {
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1600,
      stream: false
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://frbmvljizolvxcxdkefa.supabase.co',
        'X-Title': 'Generate Lesson Content',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error('OpenRouter API error:', response.status, errTxt);
      return new Response(JSON.stringify({ success: false, error: `OpenRouter error ${response.status}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data?.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ success: true, content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-lesson-content:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});