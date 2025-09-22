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

    const systemPrompt = `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Você deve criar conteúdo estruturado em HTML com formatação visual atrativa, usando cores azul e verde do tema do site, tabelas bem organizadas e exercícios interativos.`;

    const userPrompt = `Crie uma AULA COMPLETA em HTML para o nível ${courseLevel} sobre "${lessonTitle}" seguindo EXATAMENTE este formato estruturado:

<div class="lesson-content">
  <div class="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
    <h2 class="text-2xl font-bold text-blue-800 mb-4">Aula: ${lessonTitle}</h2>
    
    <div class="bg-blue-100 p-4 rounded-lg mb-4">
      <h3 class="text-lg font-semibold text-blue-700 mb-2">Introduction</h3>
      <p class="text-blue-600"><strong>15 min</strong></p>
      <p class="text-gray-700"><strong>Objetivo:</strong> [Descreva o objetivo principal]. Aprender [vocabulário específico]. Revisar e praticar [gramática específica]. Desenvolver [habilidades específicas].</p>
    </div>
  </div>

  <div class="mb-8">
    <div class="bg-green-100 p-4 rounded-lg mb-4">
      <h3 class="text-xl font-bold text-green-800 mb-3">Parte 1: Vocabulário - [Título da seção]</h3>
    </div>
    
    <div class="overflow-x-auto mb-4">
      <table class="min-w-full bg-white border border-gray-300 rounded-lg">
        <thead class="bg-blue-600 text-white">
          <tr>
            <th class="py-2 px-4 border-b text-left">English</th>
            <th class="py-2 px-4 border-b text-left">Português</th>
            <th class="py-2 px-4 border-b text-left">Pronunciation</th>
          </tr>
        </thead>
        <tbody>
          [Criar 15-20 linhas de vocabulário]
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Hello</td>
            <td class="py-2 px-4 border-b">Olá</td>
            <td class="py-2 px-4 border-b">(heh-low)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-gray-50 p-4 rounded-lg">
      <h4 class="font-semibold text-gray-800 mb-2">Exemplos de Frases:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700">
        <li>"[Frase em inglês]" ([Tradução em português])</li>
        [Adicionar 4-5 exemplos práticos]
      </ul>
    </div>
  </div>

  <div class="mb-8">
    <div class="bg-green-100 p-4 rounded-lg mb-4">
      <h3 class="text-xl font-bold text-green-800 mb-3">Parte 2: [Título da gramática - ex: "Revisão do Verbo 'to be'"]</h3>
    </div>
    
    <div class="grid md:grid-cols-3 gap-4 mb-4">
      <div class="bg-blue-50 p-4 rounded-lg">
        <h4 class="font-semibold text-blue-700 mb-2">Frases Afirmativas</h4>
        <ul class="space-y-1 text-sm">
          <li>I <strong>am</strong> Brazilian. (Eu sou brasileiro.)</li>
          [Adicionar mais exemplos]
        </ul>
      </div>
      <div class="bg-red-50 p-4 rounded-lg">
        <h4 class="font-semibold text-red-700 mb-2">Frases Negativas</h4>
        <ul class="space-y-1 text-sm">
          <li>I <strong>am not</strong> French. (Eu não sou francês.)</li>
          [Adicionar mais exemplos]
        </ul>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg">
        <h4 class="font-semibold text-yellow-700 mb-2">Perguntas</h4>
        <ul class="space-y-1 text-sm">
          <li><strong>Are</strong> you Chinese? → Yes, I <strong>am</strong>.</li>
          [Adicionar mais exemplos]
        </ul>
      </div>
    </div>
  </div>

  <div class="mb-8">
    <div class="bg-green-100 p-4 rounded-lg mb-4">
      <h3 class="text-xl font-bold text-green-800 mb-3">Parte 3: [Terceira seção - ex: "Perguntas 'Wh-' com 'to be'"]</h3>
    </div>
    
    <div class="overflow-x-auto mb-4">
      <table class="min-w-full bg-white border border-gray-300 rounded-lg">
        <thead class="bg-green-600 text-white">
          <tr>
            <th class="py-2 px-4 border-b text-left">Wh-Word</th>
            <th class="py-2 px-4 border-b text-left">Significado</th>
            <th class="py-2 px-4 border-b text-left">Exemplo com "to be"</th>
            <th class="py-2 px-4 border-b text-left">Tradução</th>
          </tr>
        </thead>
        <tbody>
          [Criar tabela com palavras Wh-]
        </tbody>
      </table>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
    <div class="bg-green-100 p-4 rounded-lg mb-4">
      <h3 class="text-xl font-bold text-green-800 mb-2">Práticas e Exercícios</h3>
      <p class="text-green-600"><strong>practice</strong></p>
      <p class="text-green-600"><strong>15 min</strong></p>
      <p class="text-gray-700"><em>Complete os exercícios abaixo para praticar o conteúdo aprendido.</em></p>
    </div>

    <div class="space-y-6">
      <div class="bg-white p-4 rounded-lg border">
        <h4 class="font-semibold text-gray-800 mb-3">1. [Título do exercício]:</h4>
        <ol class="list-decimal list-inside space-y-2">
          [Criar 4-5 questões progressivas]
        </ol>
      </div>

      <div class="bg-white p-4 rounded-lg border">
        <h4 class="font-semibold text-gray-800 mb-3">2. [Segundo exercício]:</h4>
        <ol class="list-decimal list-inside space-y-2">
          [Criar mais questões]
        </ol>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg border">
        <h4 class="font-semibold text-blue-800 mb-3">4. Role-Play: [Título do role-play]</h4>
        <p class="text-gray-700 mb-3">Pratique este diálogo com um colega, substituindo [instruções específicas].</p>
        
        <div class="bg-white p-4 rounded border-l-4 border-blue-500 mb-2">
          <p class="font-medium">Exemplo:</p>
          <div class="mt-2 space-y-1">
            <p>A: "[Frase em inglês]"</p>
            <p>B: "[Resposta em inglês]"</p>
            [Continuar diálogo]
          </div>
        </div>
        
        <div class="bg-gray-100 p-4 rounded">
          <p class="font-medium text-gray-700 mb-2">Tradução:</p>
          <div class="space-y-1 text-gray-600">
            <p>A: "[Tradução em português]"</p>
            <p>B: "[Tradução em português]"</p>
            [Continuar tradução]
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

REQUISITOS OBRIGATÓRIOS:
- Use HTML completo com classes Tailwind CSS para estilização
- Cores azul e verde predominantes como no exemplo
- Tabelas organizadas com headers coloridos
- Mínimo 15-20 palavras de vocabulário com tradução e pronúncia
- Todas as frases em inglês devem ter tradução em português
- Conteúdo apropriado para nível ${courseLevel}
- 4-5 exercícios progressivos do básico ao avançado
- Role-play final com diálogo e tradução completa
- Estrutura visual clara e atrativa para estudantes`;

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