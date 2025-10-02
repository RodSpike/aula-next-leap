import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    let filename = '';
    let mimeType = '';
    let base64 = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const f = formData.get('file') as File | null;
      if (!f) throw new Error('No file provided');
      filename = f.name;
      mimeType = f.type;
      console.log('Processing document file (multipart):', filename, 'type:', mimeType);

      const arrayBuffer = await f.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Process in chunks to prevent stack overflow
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      base64 = btoa(binary);
    } else {
      // JSON body: { name, type, data } where data is base64 or data URL
      const body = await req.json();
      if (!body?.data || !body?.type || !body?.name) {
        throw new Error('Invalid JSON. Expected { name, type, data }');
      }
      filename = String(body.name);
      mimeType = String(body.type);
      console.log('Processing document file (json):', filename, 'type:', mimeType);
      base64 = String(body.data);
      if (base64.includes(',')) base64 = base64.split(',')[1];
    }

    // Prioritize Lovable AI Gateway, then OpenAI, then Gemini
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENAI') || Deno.env.get('OPENAI_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('Gemini') || Deno.env.get('GOOGLE_API_KEY');

    if (lovableKey) {
      console.log('Using Lovable AI Gateway (Gemini) for OCR');
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Extract all text from this document/image in its original language. Return only the extracted text with proper formatting. If multi-page, extract everything. For Word documents, maintain structure.' },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
              }
            ]
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const extractedText = data?.choices?.[0]?.message?.content ?? '';

          return new Response(
            JSON.stringify({ text: extractedText, filename }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const errorData = await response.json();
          console.error('Lovable AI error, trying fallback:', errorData);
        }
      } catch (lovableError) {
        console.error('Lovable AI Gateway failed, trying fallback:', lovableError);
      }
    }

    if (openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all text from this document/image in its original language. Return only the extracted text with proper formatting. If multi-page, extract everything. For Word documents, maintain structure.' },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const extractedText = data?.choices?.[0]?.message?.content ?? '';

      return new Response(
        JSON.stringify({ text: extractedText, filename }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!geminiApiKey) {
      throw new Error('No OCR provider configured (missing OPENAI_API_KEY and GEMINI_API_KEY)');
    }

    // Gemini Vision fallback using inline_data
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Extract all text from this document/image in its original language. Return only the extracted text with proper formatting and line breaks. If multi-page, include everything. For Word documents, maintain structure.' },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 4000 }
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errorText);
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const extractedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return new Response(
      JSON.stringify({ text: extractedText, filename }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in PDF OCR function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});