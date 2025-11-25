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
    const { messages, subject } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Determine specialized system prompt based on subject
    let systemPrompt = `Você é um tutor especializado em preparação para o ENEM e vestibulares brasileiros. 

INSTRUÇÕES CRÍTICAS:
- Responda SEMPRE em português brasileiro claro e objetivo
- Foque em técnicas comprovadas de memorização e aprendizado
- Use analogias práticas e exemplos do cotidiano brasileiro
- Forneça dicas específicas para cada matéria
- Mencione questões recorrentes do ENEM quando relevante
- Seja encorajador mas realista sobre desafios
- Ofereça métodos de estudo comprovados (mapas mentais, flashcards, Pomodoro, etc.)
- Relacione conteúdos entre disciplinas quando possível
- Cite exemplos de provas anteriores quando apropriado

FORMATO DE RESPOSTAS:
1. Resposta direta e clara ao questionamento
2. Explicação detalhada com exemplos práticos
3. Dicas de memorização específicas
4. Referências a questões típicas do ENEM
5. Sugestões de estudo adicional

MATÉRIAS COBERTAS:
- Linguagens: Português, Literatura, Inglês, Espanhol, Redação
- Matemática: Álgebra, Geometria, Estatística
- Ciências da Natureza: Física, Química, Biologia
- Ciências Humanas: História, Geografia, Filosofia, Sociologia

Você conhece profundamente:
- Estrutura das provas do ENEM
- Competências da redação
- Dicas para proposta de intervenção completa
- Temas recorrentes e interdisciplinares
- Estratégias de gestão de tempo na prova
- Técnicas de eliminação de alternativas
- Como identificar "pegadinhas" típicas`;

    // Add subject-specific context if provided
    if (subject) {
      systemPrompt += `\n\nCONTEXTO ATUAL: O estudante está estudando ${subject}. Foque suas respostas nesta matéria, mas sinta-se livre para fazer conexões interdisciplinares quando relevante.`;
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
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ENEM Tutor API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue using the ENEM tutor.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ENEM tutor error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});