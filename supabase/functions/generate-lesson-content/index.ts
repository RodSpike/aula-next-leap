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

    const userPrompt = `Crie uma AULA COMPLETA para o nível ${courseLevel} sobre "${lessonTitle}" seguindo EXATAMENTE este formato estruturado:

Aula: ${lessonTitle}

Objetivo:
Aprender [descreva o objetivo principal da aula]. Entender [conceito gramatical específico]. Praticar [habilidades específicas].

Parte 1: [Título da primeira seção - ex: "Cumprimentos e Introduções"]
Vocabulário: [Categoria do vocabulário - ex: "Saudações (Greetings)"]
• Hello - Olá
• Good morning - Bom dia
• How are you? - Como vai você?
• Nice to meet you - Prazer em conhecê-lo
• Goodbye - Tchau

Exemplos práticos:
- Hello, my name is John. (Olá, meu nome é John.)
- Good morning, class! (Bom dia, turma!)
- How are you today? (Como você está hoje?)

Parte 2: [Título da segunda seção - ex: "Gramática: Verbo To Be"]
Regras principais:
Formas afirmativas:
- I am (I'm) - Eu sou/estou
- You are (You're) - Você é/está
- He/She/It is (He's/She's/It's) - Ele/Ela é/está

Formas negativas:
- I am not (I'm not) - Eu não sou/estou
- You are not (You aren't) - Você não é/está
- He/She/It is not (isn't) - Ele/Ela não é/está

Formas interrogativas:
- Are you...? - Você é/está...?
- Is he/she...? - Ele/ela é/está...?
- Am I...? - Eu sou/estou...?

Exemplos contextualizados:
Afirmativo: I am a student. (Eu sou um estudante.)
Negativo: She is not Brazilian. (Ela não é brasileira.)
Interrogativo: Are you hungry? (Você está com fome?)

Parte 3: [Título da terceira seção - ex: "Perguntas com Wh-"]
Lista de palavras interrogativas:
• What - O que/Qual
• Where - Onde
• When - Quando
• Who - Quem
• Why - Por que
• How - Como

Exemplos em contexto:
- What is your name? (Qual é o seu nome?)
- Where are you from? (De onde você é?)
- When is your birthday? (Quando é seu aniversário?)

Práticas e Exercícios:

Exercício 1: Complete com a forma correta do verbo "to be"
1. I _____ a teacher. (am/is/are)
2. She _____ from Brazil. (am/is/are)
3. They _____ students. (am/is/are)

Exercício 2: Traduza para o inglês
1. Eu sou médico.
2. Você não é brasileiro.
3. Ela está feliz?

Role-play: Apresentação pessoal
A: Hello! My name is Maria. What's your name?
B: Hi Maria! I'm Pedro. Nice to meet you.
A: Nice to meet you too. Where are you from?
B: I'm from São Paulo. And you?
A: I'm from Rio de Janeiro.

Tradução:
A: Olá! Meu nome é Maria. Qual é o seu nome?
B: Oi Maria! Eu sou Pedro. Prazer em conhecê-la.
A: Prazer em conhecê-lo também. De onde você é?
B: Eu sou de São Paulo. E você?
A: Eu sou do Rio de Janeiro.

REQUISITOS OBRIGATÓRIOS:
- Mínimo 15-20 palavras de vocabulário com tradução
- Todas as frases em inglês devem ter tradução em português
- Conteúdo apropriado para nível ${courseLevel}
- Estrutura clara e didática
- Exercícios progressivos do básico ao avançado`;

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