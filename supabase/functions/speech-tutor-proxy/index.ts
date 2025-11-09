import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Create WebSocket connection to Gemini
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
    
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to Gemini
    const geminiSocket = new WebSocket(geminiWsUrl);
    
    // Forward messages from client to Gemini
    clientSocket.onmessage = (event) => {
      if (geminiSocket.readyState === WebSocket.OPEN) {
        geminiSocket.send(event.data);
      }
    };
    
    // Forward messages from Gemini to client
    geminiSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
    };
    
    // Handle Gemini connection open
    geminiSocket.onopen = () => {
      console.log('[Speech Tutor Proxy] Connected to Gemini');
    };
    
    // Handle errors
    geminiSocket.onerror = (error) => {
      console.error('[Speech Tutor Proxy] Gemini error:', error);
      clientSocket.close(1011, 'Gemini connection error');
    };
    
    clientSocket.onerror = (error) => {
      console.error('[Speech Tutor Proxy] Client error:', error);
      geminiSocket.close();
    };
    
    // Handle connection close
    geminiSocket.onclose = (event) => {
      console.log('[Speech Tutor Proxy] Gemini closed:', event.code, event.reason);
      clientSocket.close(event.code, event.reason);
    };
    
    clientSocket.onclose = () => {
      console.log('[Speech Tutor Proxy] Client closed');
      geminiSocket.close();
    };
    
    return response;
  } catch (error) {
    console.error('[Speech Tutor Proxy] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
