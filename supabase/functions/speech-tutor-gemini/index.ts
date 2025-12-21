import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// This function has been deprecated in favor of speech-tutor-lovable
// The Gemini Live WebSocket API is not supported through Lovable AI Gateway
// Users should use the speech-tutor-lovable function instead

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[Speech Tutor Gemini] DEPRECATED: This function has been deprecated.');
  console.log('[Speech Tutor Gemini] Please use speech-tutor-lovable instead.');

  return new Response(
    JSON.stringify({ 
      error: 'This function has been deprecated. Please use speech-tutor-lovable instead.',
      redirect: 'speech-tutor-lovable'
    }), 
    { 
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
