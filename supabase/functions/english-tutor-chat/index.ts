import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Read OPENAI_API_KEY inside the handler to ensure the latest value is used

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, file_data } = await req.json();
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    
    if (!openAiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received message:', message);
    console.log('Conversation history length:', conversation_history?.length || 0);
    console.log('File data received:', !!file_data);

    // Build messages array for OpenAI-compatible format
    const messages = [
      {
        role: 'system',
        content: `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Seu papel é ajudar usuários a aprender e melhorar suas habilidades em inglês. Você deve:

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

ANÁLISE DE ARQUIVOS:
- Quando receber um arquivo de texto, analise completamente o conteúdo em inglês
- Corrija erros de gramática, ortografia e estrutura
- Explique as regras por trás das correções
- Sugira melhorias de vocabulário e estilo
- Para imagens com texto, extraia e analise qualquer texto em inglês visível
- Forneça feedback detalhado e educativo
- Sugira exercícios relacionados ao conteúdo do arquivo
- Identifique padrões de erro para foco de estudo

REGRAS DE FORMATAÇÃO:
- Use texto simples sem formatação markdown
- NÃO use ** para texto em negrito
- NÃO use * para ênfase
- NÃO use # para cabeçalhos
- Use formatação de texto simples e limpa
- Use quebras de linha para melhor legibilidade
- Use letras maiúsculas para ênfase quando necessário
- Use aspas para exemplos

Sempre responda de forma útil e educacional, focado no ensino de inglês com formatação limpa e legível.`
      }
    ];

    // Add conversation history (last 10 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      conversation_history.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add file analysis if present
    let userMessage = message || 'Please analyze the uploaded file and provide feedback on the English content.';
    if (file_data) {
      userMessage += `\n\nFILE ANALYSIS REQUEST:\nFile name: ${file_data.name}\nFile type: ${file_data.type}`;
      if (!String(file_data.type || '').startsWith('image/')) {
        userMessage += `\nFile content to analyze:\n${file_data.content}`;
      }
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

console.log('Sending request to OpenAI');

    // Build request payload for OpenAI
    const requestPayload = {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({
        error: `OpenAI API error: ${response.status} - ${errorText}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Received response from OpenAI');
    console.log('Full OpenAI response:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenAI:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response structure from OpenAI API' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log('AI response extracted:', aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in english-tutor-chat function:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    return new Response(JSON.stringify({ 
      error: `Chat function error: ${(error as Error)?.message || 'Unknown error'}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});