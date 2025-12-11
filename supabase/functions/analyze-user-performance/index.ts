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
    const { userId, displayName, cambridgeLevel, testAnswers, questionResults } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build analysis prompt based on test performance
    const correctCount = questionResults?.filter((r: any) => r.isCorrect).length || 0;
    const incorrectCount = questionResults?.filter((r: any) => !r.isCorrect).length || 0;
    const totalQuestions = questionResults?.length || 0;
    
    // Group errors by grammar type/level
    const incorrectQuestions = questionResults?.filter((r: any) => !r.isCorrect) || [];
    const correctQuestions = questionResults?.filter((r: any) => r.isCorrect) || [];
    
    const prompt = `Você é um especialista em ensino de inglês e análise pedagógica. Analise o desempenho do aluno no teste de nível Cambridge e forneça um resumo detalhado.

DADOS DO ALUNO:
- Nome: ${displayName || 'Não informado'}
- Nível Cambridge atribuído: ${cambridgeLevel || 'Não determinado'}
- Total de questões: ${totalQuestions}
- Acertos: ${correctCount} (${totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%)
- Erros: ${incorrectCount}

${incorrectQuestions.length > 0 ? `
QUESTÕES ERRADAS:
${incorrectQuestions.map((q: any, i: number) => `
${i + 1}. Pergunta: "${q.question}"
   - Resposta do aluno: ${q.userAnswer}
   - Resposta correta: ${q.correctAnswer}
   - Nível da questão: ${q.level || 'N/A'}
`).join('')}` : 'O aluno não errou nenhuma questão.'}

${correctQuestions.length > 0 ? `
ALGUMAS QUESTÕES CORRETAS (amostra):
${correctQuestions.slice(0, 5).map((q: any, i: number) => `
${i + 1}. Pergunta: "${q.question}" - Nível: ${q.level || 'N/A'}
`).join('')}` : ''}

FORNEÇA UM RESUMO EM PORTUGUÊS BRASILEIRO contendo:
1. **Resumo Geral**: Uma avaliação geral do desempenho (2-3 frases)
2. **Pontos Fortes**: O que o aluno demonstrou dominar bem
3. **Pontos Fracos**: Áreas que precisam de atenção/estudo
4. **Recomendações Personalizadas**: 
   - Quais tópicos gramaticais focar
   - Que tipo de exercícios praticar
   - Sugestões de materiais ou abordagens de estudo
5. **Próximos Passos**: O que o admin pode indicar para este aluno

Seja específico e prático nas recomendações. Considere o nível Cambridge do aluno ao fazer sugestões.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em ensino de inglês com foco em preparação para exames Cambridge. Responda sempre em português brasileiro de forma clara e objetiva." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      stats: {
        totalQuestions,
        correctCount,
        incorrectCount,
        percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-user-performance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze performance',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
