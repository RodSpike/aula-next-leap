import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const subjects = [
  { id: 'portugues', name: 'Português e Literatura' },
  { id: 'redacao', name: 'Redação' },
  { id: 'matematica', name: 'Matemática' },
  { id: 'fisica', name: 'Física' },
  { id: 'quimica', name: 'Química' },
  { id: 'biologia', name: 'Biologia' },
  { id: 'historia', name: 'História' },
  { id: 'geografia', name: 'Geografia' },
  { id: 'filosofia', name: 'Filosofia' },
  { id: 'sociologia', name: 'Sociologia' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting ENEM content population...');
    const results = [];

    for (const subject of subjects) {
      console.log(`Generating content for ${subject.name}...`);
      
      try {
        // Generate lesson content
        const lessonResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: `Você é um especialista em preparação para o ENEM e vestibulares brasileiros. Crie conteúdo educacional COMPLETO e DETALHADO em português brasileiro.`
              },
              { 
                role: 'user', 
                content: `Crie uma aula COMPLETA sobre ${subject.name} para o ENEM. 

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
- Total: 1500-2000 palavras BEM DISTRIBUÍDAS`
              }
            ],
            temperature: 0.7,
            max_tokens: 8000,
          }),
        });

        const lessonData = await lessonResponse.json();
        const lessonContent = lessonData.choices[0].message.content;

        // Store lesson content
        const { error: lessonError } = await supabase
          .from('enem_lessons')
          .upsert({
            subject_id: subject.id,
            subject_name: subject.name,
            content: lessonContent
          }, { onConflict: 'subject_id' });

        if (lessonError) throw lessonError;

        console.log(`✓ Lesson content stored for ${subject.name}`);

        // Generate exam questions using tool calling for reliable JSON output
        const examRequestBody: any = {
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content:
                'Você é um especialista em criar questões de ENEM e vestibulares. Use a ferramenta create_exam_questions para retornar as questões em formato estruturado JSON.',
            },
            {
              role: 'user',
              content: `Crie 15 questões de múltipla escolha sobre ${subject.name} no estilo ENEM.

REQUISITOS PARA CADA QUESTÃO:
- Questões no estilo ENEM (contextualizadas, interdisciplinares)
- 5 alternativas cada (A, B, C, D, E)
- Textos de apoio quando relevante
- Explicação completa e didática
- Variar dificuldade (5 fáceis, 5 médias, 5 difíceis)

Preencha o campo \'questions\' da ferramenta create_exam_questions com exatamente 15 questões seguindo essas regras.`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'create_exam_questions',
                description: 'Gera questões de múltipla escolha no estilo ENEM.',
                parameters: {
                  type: 'object',
                  properties: {
                    questions: {
                      type: 'array',
                      minItems: 15,
                      maxItems: 15,
                      items: {
                        type: 'object',
                        properties: {
                          question: { type: 'string' },
                          options: {
                            type: 'array',
                            minItems: 5,
                            maxItems: 5,
                            items: { type: 'string' },
                          },
                          correct: { type: 'string' },
                          explanation: { type: 'string' },
                        },
                        required: ['question', 'options', 'correct', 'explanation'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['questions'],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'create_exam_questions' } },
          temperature: 0.7,
          max_tokens: 8000,
        };

        const examResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(examRequestBody),
        });

        const examData = await examResponse.json();
        const toolCalls = examData.choices?.[0]?.message?.tool_calls;

        if (!toolCalls || toolCalls.length === 0) {
          throw new Error(`Exam generation did not return tool calls for ${subject.name}`);
        }

        const toolCall = toolCalls[0];
        // Some providers nest arguments under function.arguments, others directly under arguments
        const rawArgs =
          (toolCall.function && 'arguments' in toolCall.function ? toolCall.function.arguments : undefined) ||
          toolCall.arguments;

        if (!rawArgs || typeof rawArgs !== 'string') {
          throw new Error(`Invalid tool call arguments for ${subject.name}`);
        }

        let parsedQuestions;
        try {
          const parsedArgs = JSON.parse(rawArgs);
          parsedQuestions = parsedArgs.questions;

          if (!Array.isArray(parsedQuestions)) {
            throw new Error('questions is not an array');
          }
        } catch (parseError) {
          console.error(`Failed to parse exam questions for ${subject.name}:`, parseError);
          throw new Error(`Failed to parse exam questions JSON for ${subject.name}`);
        }

        // Store exam questions
        const { error: examError } = await supabase
          .from('enem_exam_questions')
          .upsert({
            subject_id: subject.id,
            questions: parsedQuestions
          }, { onConflict: 'subject_id' });

        if (examError) throw examError;

        console.log(`✓ Exam questions stored for ${subject.name}`);

        results.push({
          subject: subject.name,
          success: true
        });

      } catch (error) {
        console.error(`Error generating content for ${subject.name}:`, error);
        results.push({
          subject: subject.name,
          success: false,
          error: error.message
        });
      }
    }

    console.log('ENEM content population completed!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'ENEM content populated successfully',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Populate ENEM content error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
