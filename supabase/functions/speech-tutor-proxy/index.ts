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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('[Speech Tutor Proxy] OPENAI_API_KEY not found in environment');
      throw new Error('OPENAI_API_KEY not configured');
    }
    console.log('[Speech Tutor Proxy] OPENAI_API_KEY successfully loaded');

    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      console.error('[Speech Tutor Proxy] Not a WebSocket request');
      return new Response('Expected WebSocket', { status: 426 });
    }

    console.log('[Speech Tutor Proxy] WebSocket upgrade request detected');

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    console.log('[Speech Tutor Proxy] Client WebSocket upgraded');

    // Connect to OpenAI Realtime API (exact endpoint required)
    const model = 'gpt-4o-realtime-preview-2024-10-01';
    const openaiWsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;

    // Use subprotocols to pass API key (works in environments where custom headers aren't supported)
    // See OpenAI Realtime docs for details
    const protocols = [
      'realtime',
      `openai-insecure-api-key.${openaiKey}`,
      'openai-beta.realtime-v1',
    ];

    console.log('[Speech Tutor Proxy] Connecting to OpenAI Realtime...');
    const upstreamSocket = new WebSocket(openaiWsUrl, protocols);

    // Keepalive ping to avoid idle timeouts (cleared on close)
    let keepAlive: number | undefined;

    // Queue to buffer client messages until upstream is open
    const pendingToUpstream: any[] = [];
    const forwardToUpstream = (data: any) => {
      // Filter out legacy/invalid events to prevent upstream closes
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          // Ignore obsolete setup messages (Gemini-only)
          if (parsed && parsed.setup) {
            console.warn('[Speech Tutor Proxy] Dropping legacy setup message');
            return;
          }
        } catch (_) {
          // non-JSON message, forward as-is below
        }
      }

      if (upstreamSocket.readyState === WebSocket.OPEN) {
        try {
          upstreamSocket.send(data);
        } catch (e) {
          console.error('[Speech Tutor Proxy] Error sending to upstream:', e);
        }
      } else {
        console.warn('[Speech Tutor Proxy] Upstream not ready, queuing message. state:', upstreamSocket.readyState);
        pendingToUpstream.push(data);
      }
    };

    // Forward messages from client to OpenAI
    clientSocket.onmessage = (event) => {
      forwardToUpstream(event.data);
    };

    // Forward messages from OpenAI to client
    upstreamSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        try {
          clientSocket.send(event.data);
        } catch (e) {
          console.error('[Speech Tutor Proxy] Error forwarding to client:', e);
        }
      } else {
        console.warn('[Speech Tutor Proxy] Client socket not ready, state:', clientSocket.readyState);
      }
    };

    // Handle upstream open - notify client and flush any queued messages
    upstreamSocket.onopen = () => {
      console.log('[Speech Tutor Proxy] ✓ Connected to OpenAI Realtime');
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: 'proxy.ready' }));
        }
      } catch (_) { /* no-op */ }

      // Start keepalive pings to keep the upstream connection active
      try {
        keepAlive = setInterval(() => {
          if (upstreamSocket.readyState === WebSocket.OPEN) {
            try { upstreamSocket.send(JSON.stringify({ type: 'ping' })); } catch {}
          }
        }, 25000) as unknown as number;
      } catch (e) {
        console.warn('[Speech Tutor Proxy] Failed to start keepalive:', e);
      }

      try {
        while (pendingToUpstream.length) {
          const msg = pendingToUpstream.shift();
          if (msg !== undefined) {
            upstreamSocket.send(msg);
          }
        }
      } catch (e) {
        console.error('[Speech Tutor Proxy] Error flushing queued messages:', e);
      }
    };

    // Handle errors
    upstreamSocket.onerror = (error) => {
      console.error('[Speech Tutor Proxy] Upstream connection error:', error);
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: 'proxy.error', source: 'upstream', message: 'Realtime connection error' }));
        }
      } catch (_) { /* no-op */ }
      try { clientSocket.close(1011, 'Realtime connection error'); } catch (_) {}
    };

    clientSocket.onerror = (error) => {
      console.error('[Speech Tutor Proxy] Client connection error:', error);
      try {
        if (upstreamSocket.readyState === WebSocket.OPEN) {
          upstreamSocket.close();
        }
      } catch (_) { /* no-op */ }
    };

    // Handle connection close
    upstreamSocket.onclose = (event) => {
      console.log('[Speech Tutor Proxy] Upstream closed - Code:', event.code, 'Reason:', event.reason);
      try { if (keepAlive) clearInterval(keepAlive as unknown as number); } catch (_) {}
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: 'proxy.closed', source: 'upstream', code: event.code, reason: event.reason }));
          clientSocket.close(event.code, event.reason);
        }
      } catch (_) { /* no-op */ }
    };

    clientSocket.onclose = (event) => {
      console.log('[Speech Tutor Proxy] Client closed - Code:', event.code, 'Reason:', event.reason);
      try { if (keepAlive) clearInterval(keepAlive as unknown as number); } catch (_) {}
      try {
        if (upstreamSocket.readyState === WebSocket.OPEN) {
          upstreamSocket.close();
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
