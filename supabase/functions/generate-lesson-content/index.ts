import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonTitle, courseLevel } = await req.json();

    if (!openAIApiKey) {
      throw new Error('Missing OPENAI_API_KEY secret');
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error('OpenAI API error:', errTxt);
      return new Response(JSON.stringify({ success: false, error: 'OpenAI error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ success: true, content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-lesson-content:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});