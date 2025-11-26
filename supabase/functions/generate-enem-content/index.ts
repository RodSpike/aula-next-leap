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
<p>Introdução clara e motivadora (máximo 2 parágrafos)</p>

<h3>1. Conceitos Fundamentais</h3>
<p>Breve introdução (1 parágrafo)</p>
<ul>
<li><strong>Conceito 1:</strong> Explicação concisa (máximo 3 linhas)</li>
<li><strong>Conceito 2:</strong> Explicação concisa (máximo 3 linhas)</li>
<li><strong>Conceito 3:</strong> Explicação concisa (máximo 3 linhas)</li>
</ul>

<div class="tip">
<strong>💡 Dica de Memorização:</strong> Técnica específica e prática
</div>

<h3>2. Desenvolvimento do Conteúdo</h3>
<p>Parágrafo explicativo (máximo 4 linhas)</p>
<p>Outro parágrafo complementar (máximo 4 linhas)</p>

<div class="example">
<strong>📝 Exemplo Prático:</strong> Situação concreta do ENEM com resolução clara
</div>

<h3>3. Aplicações e Contexto ENEM</h3>
<p>Como este conteúdo aparece no ENEM (máximo 3 linhas)</p>

<div class="tip">
<strong>💡 Estratégia para Provas:</strong> Dica específica para resolver questões rapidamente
</div>

<h3>4. Pontos-Chave para Memorizar</h3>
<ul>
<li>Ponto essencial 1 - conciso e direto</li>
<li>Ponto essencial 2 - conciso e direto</li>
<li>Ponto essencial 3 - conciso e direto</li>
<li>Ponto essencial 4 - conciso e direto</li>
</ul>

<div class="warning">
<strong>⚠️ Pegadinhas Comuns:</strong> Lista de erros frequentes dos estudantes
</div>

<div class="example">
<strong>📝 Questão Modelo:</strong> Exemplo de questão ENEM com explicação detalhada da solução
</div>

REQUISITOS CRÍTICOS:
- Parágrafos CURTOS (máximo 4-5 linhas cada)
- Use QUEBRAS VISUAIS frequentes (divs tip/example/warning)
- Mínimo 5 dicas de memorização em boxes coloridos
- Mínimo 4 exemplos práticos em boxes
- Linguagem DIRETA e CLARA
- Evite "muros de texto" - use listas e boxes
- Total: 1500-2000 palavras BEM DISTRIBUÍDAS`;
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
