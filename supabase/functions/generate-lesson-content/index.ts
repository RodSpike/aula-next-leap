import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const deepSeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonTitle, courseLevel, lessonDescription } = await req.json();
    
    console.log(`Generating content for lesson: ${lessonTitle} (${courseLevel})`);

    // Your specialized AI prompt
    const systemPrompt = `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Seu papel é ajudar usuários a aprender e melhorar suas habilidades em inglês. Você deve:

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

REGRAS DE FORMATAÇÃO:
- Use texto simples sem formatação markdown
- NÃO use ** para texto em negrito
- NÃO use * para ênfase
- NÃO use # para cabeçalhos
- Use formatação de texto simples e limpa
- Use quebras de linha para melhor legibilidade
- Use letras maiúsculas para ênfase quando necessário
- Use aspas para exemplos`;

    const userPrompt = `Crie uma aula COMPLETA e DETALHADA de inglês para o nível ${courseLevel} sobre "${lessonTitle}". 

IMPORTANTE: Siga EXATAMENTE este formato estruturado (baseado no exemplo da Aula 1):

Aula X: [Título da Aula]

Objetivo:
- [Lista de objetivos específicos da aula]

Parte 1: [Nome da primeira parte]
[Conteúdo detalhado da primeira parte, incluindo:]
- Vocabulário com traduções em português
- Seções organizadas (como Formais/Informais quando aplicável)
- Exemplos práticos com traduções
- Atividades sugeridas

Parte 2: [Nome da segunda parte]
[Conteúdo gramatical ou estrutural, incluindo:]
- Tabelas com conjugações/regras quando aplicável
- Exemplos de frases (afirmativas, negativas, interrogativas)
- Traduções em português para todos os exemplos

Parte 3: [Nome da terceira parte]
[Conteúdo adicional relevante ao tópico]
- Mais vocabulário ou estruturas
- Tabelas de referência quando necessário
- Exemplos contextualizados

Práticas e Exercícios:
1. [Exercício 1 com instruções claras]
2. [Exercício 2 com exemplos]
3. [Exercício 3 - Role-Play ou prática oral com diálogo exemplo e tradução]

REQUISITOS OBRIGATÓRIOS:
- Inclua SEMPRE traduções em português
- Crie tabelas organizadas quando apropriado
- Forneça exemplos práticos e contextualizados
- Mantenha o nível ${courseLevel} apropriado
- Inclua pelo menos 15-20 palavras de vocabulário novo
- Crie exercícios progressivos (do mais simples ao mais complexo)
- Termine sempre com uma atividade de role-play ou diálogo

A aula deve ser TÃO DETALHADA quanto a Aula 1 de exemplo que já existe.`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepSeekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Generated lesson content successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      content: generatedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating lesson content:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});