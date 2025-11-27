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
  { id: 'ingles', name: 'Inglês' },
  { id: 'espanhol', name: 'Espanhol' },
];

async function generateSubjectContent(
  subject: { id: string; name: string },
  supabase: any,
  LOVABLE_API_KEY: string
) {
  console.log(`Generating content for ${subject.name}...`);
  
  try {
    // Generate lesson content - SIMPLIFIED for speed
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
            content: `Você é um especialista em ENEM. Crie conteúdo educacional em português brasileiro.`
          },
          { 
            role: 'user', 
            content: `Crie uma aula sobre ${subject.name} para o ENEM em HTML.

Estrutura:
<h2>Título</h2>
<p>Introdução breve</p>
<h3>Conceitos</h3>
<ul><li>Conceito 1</li><li>Conceito 2</li></ul>
<div class="tip"><strong>💡 Dica:</strong> texto</div>
<h3>Conteúdo</h3>
<p>Explicação</p>
<div class="example"><strong>📝 Exemplo:</strong> texto</div>
<h3>Pontos-Chave</h3>
<ul><li>Ponto 1</li><li>Ponto 2</li></ul>

Máximo 800 palavras. Seja direto e prático.`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
    console.log(`✓ Lesson stored for ${subject.name}`);

    // Generate exam questions - REDUCED to 8 questions
    const examRequestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você cria questões ENEM. Use a ferramenta create_exam_questions.',
        },
        {
          role: 'user',
          content: `Crie 8 questões sobre ${subject.name} no estilo ENEM com 5 alternativas cada.`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'create_exam_questions',
            description: 'Gera questões ENEM.',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      options: { type: 'array', items: { type: 'string' } },
                      correct: { type: 'string' },
                      explanation: { type: 'string' },
                    },
                    required: ['question', 'options', 'correct', 'explanation'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'create_exam_questions' } },
      temperature: 0.7,
      max_tokens: 4000,
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
      throw new Error(`No tool calls for ${subject.name}`);
    }

    const toolCall = toolCalls[0];
    const rawArgs = toolCall.function?.arguments || toolCall.arguments;

    if (!rawArgs || typeof rawArgs !== 'string') {
      throw new Error(`Invalid args for ${subject.name}`);
    }

    let parsedQuestions;
    try {
      const parsedArgs = JSON.parse(rawArgs);
      parsedQuestions = parsedArgs.questions;
      if (!Array.isArray(parsedQuestions)) throw new Error('Not array');
    } catch (parseError) {
      console.error(`Parse error for ${subject.name}:`, parseError);
      throw new Error(`Parse failed for ${subject.name}`);
    }

    // Store exam questions
    const { error: examError } = await supabase
      .from('enem_exam_questions')
      .upsert({
        subject_id: subject.id,
        questions: parsedQuestions
      }, { onConflict: 'subject_id' });

    if (examError) throw examError;
    console.log(`✓ Exam stored for ${subject.name}`);

    return { subject: subject.name, success: true };
  } catch (error) {
    console.error(`Error for ${subject.name}:`, error);
    return { subject: subject.name, success: false, error: error.message };
  }
}

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

    // Parse request body for batch index
    let batchIndex = 0;
    try {
      const body = await req.json();
      batchIndex = body.batchIndex ?? 0;
    } catch {
      // No body or invalid JSON, use default
    }

    const batchSize = 2; // Process 2 subjects at a time for speed
    const totalBatches = Math.ceil(subjects.length / batchSize);
    
    if (batchIndex >= totalBatches) {
      return new Response(
        JSON.stringify({ success: true, message: 'All batches completed', done: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startIdx = batchIndex * batchSize;
    const batch = subjects.slice(startIdx, startIdx + batchSize);
    
    console.log(`Processing batch ${batchIndex + 1}/${totalBatches}: ${batch.map(s => s.name).join(', ')}`);

    // Process subjects sequentially to avoid rate limits
    const results = [];
    for (const subject of batch) {
      const result = await generateSubjectContent(subject, supabase, LOVABLE_API_KEY);
      results.push(result);
    }

    const hasMore = batchIndex + 1 < totalBatches;

    console.log(`Batch ${batchIndex + 1} completed. HasMore: ${hasMore}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        batchIndex,
        totalBatches,
        hasMore,
        nextBatch: hasMore ? batchIndex + 1 : null,
        processedSubjects: batch.map(s => s.name),
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Populate ENEM error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
