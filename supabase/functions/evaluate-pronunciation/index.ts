import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, expectedText, context = 'practice', lessonId, userId } = await req.json();

    if (!audio) {
      throw new Error('Audio data is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    console.log('Starting pronunciation evaluation...');

    // Step 1: Transcribe audio with Whisper
    console.log('Transcribing audio with Whisper...');
    const binaryAudio = processBase64Chunks(audio);
    
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text || '';
    console.log('Transcription:', transcription);

    // Detect language
    const detectedLanguage = transcriptionResult.language === 'pt' ? 'pt-BR' : 'en-US';
    console.log('Detected language:', detectedLanguage);

    // Step 2: Evaluate with Lovable AI
    console.log('Evaluating pronunciation with Lovable AI...');
    const evaluationPrompt = `You are an expert English and Portuguese pronunciation teacher. Evaluate this student's speech.

Student said: "${transcription}"
${expectedText ? `Expected: "${expectedText}"` : ''}
Context: ${context}
Detected language: ${detectedLanguage}

Provide a detailed evaluation in VALID JSON format ONLY:
{
  "pronunciationScore": <0-100>,
  "grammarScore": <0-100>,
  "fluencyScore": <0-100>,
  "overallScore": <0-100>,
  "feedback": {
    "strengths": ["array", "of", "strengths"],
    "improvements": [
      {
        "issue": "specific issue",
        "example": "what they said vs what they meant",
        "tip": "how to improve"
      }
    ],
    "grammarIssues": [
      {
        "error": "what they said",
        "correction": "correct version",
        "explanation": "why it's wrong"
      }
    ]
  },
  "correctedText": "grammatically and pronunciation corrected version"
}

Be encouraging but honest. Focus on actionable improvements. Consider common pronunciation challenges for ${detectedLanguage === 'pt-BR' ? 'Portuguese speakers learning English' : 'English speakers learning Portuguese'}.`;

    const evaluationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a pronunciation and language teacher. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
      }),
    });

    if (!evaluationResponse.ok) {
      const error = await evaluationResponse.text();
      throw new Error(`Evaluation failed: ${error}`);
    }

    const evaluationData = await evaluationResponse.json();
    console.log('Evaluation response received');

    let evaluation;
    try {
      const content = evaluationData.choices[0].message.content;
      evaluation = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse evaluation, using fallback:', parseError);
      // Fallback evaluation
      evaluation = {
        pronunciationScore: 70,
        grammarScore: 70,
        fluencyScore: 70,
        overallScore: 70,
        feedback: {
          strengths: ["You spoke clearly"],
          improvements: [],
          grammarIssues: []
        },
        correctedText: transcription
      };
    }

    // Step 3: Generate corrected audio using intelligent TTS
    console.log('Generating corrected audio...');
    const ttsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/intelligent-text-to-speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: evaluation.correctedText,
        options: { speed: 0.9 }
      }),
    });

    let correctedAudio = '';
    if (ttsResponse.ok) {
      const ttsData = await ttsResponse.json();
      correctedAudio = ttsData.audioContent;
    } else {
      console.error('TTS generation failed, continuing without corrected audio');
    }

    // Step 4: Store evaluation in database if userId provided
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: dbError } = await supabase
        .from('pronunciation_evaluations')
        .insert({
          user_id: userId,
          lesson_id: lessonId || null,
          transcription: transcription,
          expected_text: expectedText || null,
          detected_language: detectedLanguage,
          pronunciation_score: evaluation.pronunciationScore,
          grammar_score: evaluation.grammarScore,
          fluency_score: evaluation.fluencyScore,
          overall_score: evaluation.overallScore,
          feedback: evaluation.feedback,
          corrected_text: evaluation.correctedText,
          context: context
        });

      if (dbError) {
        console.error('Failed to store evaluation:', dbError);
      } else {
        console.log('Evaluation stored in database');
      }
    }

    return new Response(
      JSON.stringify({
        transcription,
        detectedLanguage,
        evaluation: {
          pronunciationScore: evaluation.pronunciationScore,
          grammarScore: evaluation.grammarScore,
          fluencyScore: evaluation.fluencyScore,
          overallScore: evaluation.overallScore
        },
        feedback: evaluation.feedback,
        correctedAudio,
        correctedText: evaluation.correctedText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Pronunciation evaluation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to evaluate pronunciation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
