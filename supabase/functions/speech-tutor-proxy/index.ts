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
    console.log('[Speech Tutor Proxy] Incoming connection request');
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[Speech Tutor Proxy] GEMINI_API_KEY not found in environment');
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    console.log('[Speech Tutor Proxy] GEMINI_API_KEY successfully loaded');

    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      console.error('[Speech Tutor Proxy] Not a WebSocket request');
      return new Response('Expected WebSocket', { status: 426 });
    }

    console.log('[Speech Tutor Proxy] WebSocket upgrade request detected');

    // Create WebSocket connection to Gemini
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
    
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    console.log('[Speech Tutor Proxy] Client WebSocket upgraded');
    
    // Connect to Gemini
    const geminiSocket = new WebSocket(geminiWsUrl);
    console.log('[Speech Tutor Proxy] Connecting to Gemini...');
    // Keepalive ping to avoid idle timeouts (cleared on close)
    let keepAlive: number | undefined;

    // Queue to buffer client messages until Gemini socket is open
    const pendingToGemini: any[] = [];
    const forwardToGemini = (data: any) => {
      if (geminiSocket.readyState === WebSocket.OPEN) {
        console.log('[Speech Tutor Proxy] Forwarding message from client to Gemini');
        geminiSocket.send(data);
      } else {
        console.warn('[Speech Tutor Proxy] Gemini socket not ready, queuing message. state:', geminiSocket.readyState);
        pendingToGemini.push(data);
      }
    };
    
    // Forward messages from client to Gemini (buffer if Gemini not ready)
    clientSocket.onmessage = (event) => {
      forwardToGemini(event.data);
    };
    
    // Forward messages from Gemini to client
    geminiSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        console.log('[Speech Tutor Proxy] Forwarding message from Gemini to client');
        clientSocket.send(event.data);
      } else {
        console.warn('[Speech Tutor Proxy] Client socket not ready, state:', clientSocket.readyState);
      }
    };
    
    // Handle Gemini connection open - notify client and flush any queued messages
    geminiSocket.onopen = () => {
      console.log('[Speech Tutor Proxy] ✓ Successfully connected to Gemini Live API');
      // Notify client that upstream is ready so it can safely send setup/start messages
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: 'proxy.ready' }));
        }
      } catch (_) { /* no-op */ }

      // Start keepalive pings to keep the upstream connection active
      try {
        keepAlive = setInterval(() => {
          if (geminiSocket.readyState === WebSocket.OPEN) {
            try { geminiSocket.send(JSON.stringify({ type: 'ping' })); } catch {}
          }
        }, 25000) as unknown as number;
      } catch (e) {
        console.warn('[Speech Tutor Proxy] Failed to start keepalive:', e);
      }

      try {
        while (pendingToGemini.length) {
          const msg = pendingToGemini.shift();
          if (msg !== undefined) {
            geminiSocket.send(msg);
          }
        }
      } catch (e) {
        console.error('[Speech Tutor Proxy] Error flushing queued messages:', e);
      }
    };
    // Handle errors
    geminiSocket.onerror = (error) => {
      console.error('[Speech Tutor Proxy] Gemini connection error:', error);
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: 'proxy.error', source: 'gemini', message: 'Gemini connection error' }));
        }
      } catch (_) { /* no-op */ }
      clientSocket.close(1011, 'Gemini connection error');
    };
    
    clientSocket.onerror = (error) => {
      console.error('[Speech Tutor Proxy] Client connection error:', error);
      try {
        if (geminiSocket.readyState === WebSocket.OPEN) {
          geminiSocket.close();
        }
      } catch (_) { /* no-op */ }
    };
    
    // Handle connection close
    geminiSocket.onclose = (event) => {
      console.log('[Speech Tutor Proxy] Gemini connection closed - Code:', event.code, 'Reason:', event.reason);
      try { if (keepAlive) clearInterval(keepAlive as unknown as number); } catch (_) {}
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: 'proxy.closed', source: 'gemini', code: event.code, reason: event.reason }));
          clientSocket.close(event.code, event.reason);
        }
      } catch (_) { /* no-op */ }
    };
    
    clientSocket.onclose = (event) => {
      console.log('[Speech Tutor Proxy] Client connection closed - Code:', event.code, 'Reason:', event.reason);
      try { if (keepAlive) clearInterval(keepAlive as unknown as number); } catch (_) {}
      try {
        if (geminiSocket.readyState === WebSocket.OPEN) {
          geminiSocket.close();
        }
      } catch (_) { /* no-op */ }
    };
    return response;
  } catch (error) {
    console.error('[Speech Tutor Proxy] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
