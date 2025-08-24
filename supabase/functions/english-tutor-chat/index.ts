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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return new Response(JSON.stringify({
        error: 'Gemini API key not configured'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received message:', message);
    console.log('Conversation history length:', conversation_history?.length || 0);
    console.log('File data received:', !!file_data);

    // Enhanced system prompt for file analysis
    let conversationText = `Você é um assistente de IA tutor especializado em ensino de inglês para estudantes brasileiros. Seu papel é ajudar usuários a aprender e melhorar suas habilidades em inglês. Você deve:

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

Sempre responda de forma útil e educacional, focado no ensino de inglês com formatação limpa e legível.

`;

    // Add conversation history (last 10 messages for context)
    if (conversation_history && Array.isArray(conversation_history)) {
      conversation_history.slice(-10).forEach((msg: any) => {
        conversationText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    // Add file analysis if present
    if (file_data) {
      conversationText += `\nFILE ANALYSIS REQUEST:\n`;
      conversationText += `File name: ${file_data.name}\n`;
      conversationText += `File type: ${file_data.type}\n`;
      
      if (file_data.type.startsWith('image/')) {
        conversationText += `Content: [Image file - analyze any English text visible in the image]\n`;
        // Note: For image analysis with Gemini, we'd need to use the multimodal API
        // For now, we'll handle it as a request to analyze image content
        conversationText += `User uploaded an image file. Please ask them to describe any English text they see in the image for analysis.\n`;
      } else {
        conversationText += `File content to analyze:\n${file_data.content}\n\n`;
      }
    }

    // Add current message
    conversationText += `User: ${message || 'Please analyze the uploaded file and provide feedback on the English content.'}\nAssistant:`;

    console.log('Sending request to Gemini');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: conversationText
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(JSON.stringify({
        error: `Gemini API error: ${response.status} - ${errorText}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Received response from Gemini');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid response structure from Gemini:', data);
      throw new Error('Invalid response from Gemini');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in english-tutor-chat function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error)?.message || 'Unknown error'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});