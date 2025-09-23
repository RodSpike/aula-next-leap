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

<div class="prose prose-slate max-w-none">
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
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Brazil</td>
            <td class="py-2 px-4 border-b">Brasil</td>
            <td class="py-2 px-4 border-b">(bra-zi-li-an)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">United States</td>
            <td class="py-2 px-4 border-b">Estados Unidos</td>
            <td class="py-2 px-4 border-b">(yu-nai-ted steits)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Japan</td>
            <td class="py-2 px-4 border-b">Japão</td>
            <td class="py-2 px-4 border-b">(ja-pan)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">France</td>
            <td class="py-2 px-4 border-b">França</td>
            <td class="py-2 px-4 border-b">(frans)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Germany</td>
            <td class="py-2 px-4 border-b">Alemanha</td>
            <td class="py-2 px-4 border-b">(jer-ma-ni)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Italy</td>
            <td class="py-2 px-4 border-b">Itália</td>
            <td class="py-2 px-4 border-b">(i-ta-li)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Spain</td>
            <td class="py-2 px-4 border-b">Espanha</td>
            <td class="py-2 px-4 border-b">(spain)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">China</td>
            <td class="py-2 px-4 border-b">China</td>
            <td class="py-2 px-4 border-b">(chai-na)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">United Kingdom</td>
            <td class="py-2 px-4 border-b">Reino Unido</td>
            <td class="py-2 px-4 border-b">(yu-nai-ted king-dom)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Mexico</td>
            <td class="py-2 px-4 border-b">México</td>
            <td class="py-2 px-4 border-b">(mek-si-ko)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Canada</td>
            <td class="py-2 px-4 border-b">Canadá</td>
            <td class="py-2 px-4 border-b">(ka-na-da)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Russia</td>
            <td class="py-2 px-4 border-b">Rússia</td>
            <td class="py-2 px-4 border-b">(rash-a)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">India</td>
            <td class="py-2 px-4 border-b">Índia</td>
            <td class="py-2 px-4 border-b">(in-di-a)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">Australia</td>
            <td class="py-2 px-4 border-b">Austrália</td>
            <td class="py-2 px-4 border-b">(os-trei-li-a)</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium">South Korea</td>
            <td class="py-2 px-4 border-b">Coreia do Sul</td>
            <td class="py-2 px-4 border-b">(sauth ko-ri-a)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-gray-50 p-4 rounded-lg">
      <h4 class="font-semibold text-gray-800 mb-2">Exemplos de Frases:</h4>
      <ul class="list-disc list-inside space-y-2 text-gray-700">
        <li>"I am from Brazil. I am Brazilian." (Eu sou do Brasil. Eu sou brasileiro.)</li>
        <li>"She is from Japan. She is Japanese." (Ela é do Japão. Ela é japonesa.)</li>
        <li>"They are from Italy. They are Italian." (Eles são da Itália. Eles são italianos.)</li>
        <li>"We are from Germany. We are German." (Nós somos da Alemanha. Nós somos alemães.)</li>
        <li>"He is from France. He is French." (Ele é da França. Ele é francês.)</li>
      </ul>
    </div>
  </div>

  <div class="mb-8">
    <div class="bg-green-100 p-4 rounded-lg mb-4">
      <h3 class="text-xl font-bold text-green-800 mb-3">Parte 2: Revisão do Verbo "to be" (Para origem e identidade)</h3>
    </div>
    
    <div class="grid md:grid-cols-3 gap-4 mb-4">
      <div class="bg-blue-50 p-4 rounded-lg">
        <h4 class="font-semibold text-blue-700 mb-2">Frases Afirmativas</h4>
        <ul class="space-y-1 text-sm">
          <li>I <strong>am</strong> Brazilian. (Eu sou brasileiro.)</li>
          <li>He <strong>is</strong> American. (Ele é americano.)</li>
          <li>We <strong>are</strong> from Spain. (Nós somos da Espanha.)</li>
          <li>They <strong>are</strong> Japanese. (Eles são japoneses.)</li>
        </ul>
      </div>
      <div class="bg-red-50 p-4 rounded-lg">
        <h4 class="font-semibold text-red-700 mb-2">Frases Negativas</h4>
        <ul class="space-y-1 text-sm">
          <li>I <strong>am not</strong> French. (Eu não sou francês.)</li>
          <li>She <strong>is not</strong> Italian. (Ela não é italiana.)</li>
          <li>They <strong>are not</strong> from Germany. (Eles não são da Alemanha.)</li>
          <li>We <strong>are not</strong> Chinese. (Nós não somos chineses.)</li>
        </ul>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg">
        <h4 class="font-semibold text-yellow-700 mb-2">Perguntas</h4>
        <ul class="space-y-1 text-sm">
          <li><strong>Are</strong> you Chinese? → Yes, I <strong>am</strong>.</li>
          <li><strong>Is</strong> he from Mexico? → Yes, he <strong>is</strong>.</li>
          <li><strong>Where are</strong> you from? → I <strong>am</strong> from Brazil.</li>
          <li><strong>What is</strong> your nationality? → I <strong>am</strong> Brazilian.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="mb-8">
    <div class="bg-green-100 p-4 rounded-lg mb-4">
      <h3 class="text-xl font-bold text-green-800 mb-3">Parte 3: Perguntas "Wh-" com "to be" (Expandindo)</h3>
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
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium"><strong>Where</strong></td>
            <td class="py-2 px-4 border-b">De onde</td>
            <td class="py-2 px-4 border-b"><strong>Where are</strong> you from?</td>
            <td class="py-2 px-4 border-b">De onde você é?</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium"><strong>What</strong></td>
            <td class="py-2 px-4 border-b">Qual</td>
            <td class="py-2 px-4 border-b"><strong>What is</strong> your nationality?</td>
            <td class="py-2 px-4 border-b">Qual é a sua nacionalidade?</td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="py-2 px-4 border-b font-medium"><strong>Who</strong></td>
            <td class="py-2 px-4 border-b">Quem</td>
            <td class="py-2 px-4 border-b"><strong>Who is</strong> American here?</td>
            <td class="py-2 px-4 border-b">Quem é americano aqui?</td>
          </tr>
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
        <h4 class="font-semibold text-gray-800 mb-3">1. Complete as Frases com a nacionalidade correta:</h4>
        <ol class="list-decimal list-inside space-y-2">
          <li>She is from France. She is _________. (Ela é francesa.)</li>
          <li>They are from China. They are _________. (Eles são chineses.)</li>
          <li>I am from Japan. I am _________. (Eu sou japonês.)</li>
          <li>He is from Mexico. He is _________. (Ele é mexicano.)</li>
          <li>We are from Canada. We are _________. (Nós somos canadenses.)</li>
        </ol>
      </div>

      <div class="bg-white p-4 rounded-lg border">
        <h4 class="font-semibold text-gray-800 mb-3">2. Complete as frases com a forma correta do verbo "to be" (am, is, are):</h4>
        <ol class="list-decimal list-inside space-y-2">
          <li>We _________ from the United States. We _________ American.</li>
          <li>He _________ not from Italy. He _________ Spanish.</li>
          <li>_________ you from Germany? What _________ your nationality?</li>
          <li>She _________ Brazilian. She _________ from Brazil.</li>
          <li>They _________ not Chinese. They _________ from Japan.</li>
        </ol>
      </div>

      <div class="bg-white p-4 rounded-lg border">
        <h4 class="font-semibold text-gray-800 mb-3">3. Traduza as perguntas e responda sobre VOCÊ:</h4>
        <ol class="list-decimal list-inside space-y-2">
          <li>Where are you from? _________________________<br><em>Answer: I am from...</em></li>
          <li>What is your nationality? _________________________<br><em>Answer: I am...</em></li>
          <li>Are you Brazilian? _________________________<br><em>Answer: Yes, I am / No, I am not</em></li>
        </ol>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg border">
        <h4 class="font-semibold text-blue-800 mb-3">4. Role-Play: Crie um diálogo como este:</h4>
        <p class="text-gray-700 mb-3">Pratique este diálogo com um colega, substituindo os países e nacionalidades.</p>
        
        <div class="bg-white p-4 rounded border-l-4 border-blue-500 mb-2">
          <p class="font-medium">Exemplo:</p>
          <div class="mt-2 space-y-1">
            <p>A: "Hello! <strong>Where are you from?</strong>"</p>
            <p>B: "Hi! <strong>I am from</strong> Italy. <strong>I am Italian</strong>. <strong>And you?</strong>"</p>
            <p>A: "<strong>I am from</strong> Mexico. <strong>I am Mexican</strong>. Nice to meet you!"</p>
            <p>B: "Nice to meet you too!"</p>
          </div>
        </div>
        
        <div class="bg-gray-100 p-4 rounded">
          <p class="font-medium text-gray-700 mb-2">Tradução:</p>
          <div class="space-y-1 text-gray-600">
            <p>A: "Olá! De onde você é?"</p>
            <p>B: "Oi! Eu sou da Itália. Eu sou italiano. E você?"</p>
            <p>A: "Eu sou do México. Eu sou mexicano. Prazer em te conhecer!"</p>
            <p>B: "Prazer em te conhecer também!"</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

IMPORTANTE: TAMBÉM CRIE EXERCÍCIOS INTERATIVOS PARA A TABELA exercises:
Depois de gerar o conteúdo da aula, TAMBÉM CRIE automaticamente 5-8 exercícios múltipla escolha sobre o conteúdo gerado. Os exercícios devem cobrir vocabulário, gramática e compreensão da aula.

Cada exercício deve ter:
- Pergunta clara em português com tradução se necessário
- 4 opções de resposta (A, B, C, D)
- Uma resposta correta
- Explicação da resposta correta
- Valor de 1 ponto cada

Exemplo de formato para os exercícios:
1. Qual é a nacionalidade de alguém que nasceu no Brasil?
   A) Brazilian
   B) Brazillian  
   C) Brasilian
   D) Brasiliam
   
Resposta correta: A) Brazilian
Explicação: A nacionalidade de alguém do Brasil é "Brazilian" (brasileiro/brasileira).

2. Complete: "She _____ from Germany. She _____ German."
   A) are / are
   B) is / is
   C) am / am  
   D) is / are
   
Resposta correta: B) is / is
Explicação: Usamos "is" para terceira pessoa singular (she/he/it).

CERTIFIQUE-SE de criar conteúdo completo, detalhado e bem estruturado seguindo EXATAMENTE o padrão mostrado com cores azuis e verdes, tabelas organizadas e exercícios práticos.

SEMPRE inclua pelo menos 15-20 palavras de vocabulário na primeira tabela.

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
      max_tokens: 4000,
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