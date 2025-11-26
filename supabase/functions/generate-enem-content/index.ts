import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { subject, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'lesson') {
      systemPrompt = `Você é um especialista em preparação para o ENEM e vestibulares brasileiros. 
Crie conteúdo educacional COMPLETO e DETALHADO em português brasileiro.`;

      userPrompt = `Crie uma aula COMPLETA sobre ${subject} para o ENEM. 

FORMATO OBRIGATÓRIO em HTML:
<h2>Título Principal</h2>
<p>Introdução clara e motivadora</p>

<h3>1. Conceitos Fundamentais</h3>
<p>Explicação detalhada dos conceitos básicos</p>
<ul>
<li><strong>Conceito 1:</strong> Explicação completa com exemplos</li>
<li><strong>Conceito 2:</strong> Explicação completa com exemplos</li>
</ul>

<h3>2. Conteúdo Principal</h3>
<p>Desenvolvimento detalhado do conteúdo</p>

<div class="tip">
<strong>💡 Dica de Memorização:</strong> Técnica específica para memorizar este conteúdo
</div>

<h3>3. Aplicações e Exemplos</h3>
<p>Exemplos práticos de questões do ENEM</p>

<div class="example">
<strong>📝 Exemplo:</strong> Questão típica do ENEM com resolução passo a passo
</div>

<h3>4. Resumo e Pontos-Chave</h3>
<ul>
<li>Ponto essencial 1</li>
<li>Ponto essencial 2</li>
<li>Ponto essencial 3</li>
</ul>

<div class="warning">
<strong>⚠️ Atenção:</strong> Pegadinhas comuns e erros frequentes
</div>

REQUISITOS:
- Mínimo 2000 palavras de conteúdo substantivo
- Incluir 5+ dicas de memorização
- Incluir 3+ exemplos práticos
- Mencionar questões típicas do ENEM
- Linguagem clara e acessível
- Estrutura HTML bem formatada`;
    } else {
      systemPrompt = `Você é um especialista em criar questões de ENEM e vestibulares.
Retorne APENAS um array JSON válido, sem markdown, sem explicações adicionais.`;

      userPrompt = `Crie 15 questões de múltipla escolha sobre ${subject} no estilo ENEM.

Retorne APENAS este formato JSON (sem \`\`\`json ou qualquer outra marcação):
[
  {
    "question": "Texto completo da questão (pode incluir contexto longo, textos de apoio, etc)",
    "options": ["A) Alternativa A", "B) Alternativa B", "C) Alternativa C", "D) Alternativa D", "E) Alternativa E"],
    "correct": "A) Alternativa A",
    "explanation": "Explicação detalhada da resposta correta e por que as outras estão erradas"
  }
]

REQUISITOS PARA CADA QUESTÃO:
- Questões no estilo ENEM (contextualizadas, interdisciplinares)
- 5 alternativas cada (A, B, C, D, E)
- Textos de apoio quando relevante
- Explicação completa e didática
- Variar dificuldade (5 fáceis, 5 médias, 5 difíceis)`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate ENEM content error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
