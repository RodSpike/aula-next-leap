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
    console.log('[Speech Tutor Gemini] Incoming connection request');

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      console.error('[Speech Tutor Gemini] GEMINI_API_KEY not found in environment');
      throw new Error('GEMINI_API_KEY not configured');
    }
    console.log('[Speech Tutor Gemini] GEMINI_API_KEY successfully loaded');

    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      console.error('[Speech Tutor Gemini] Not a WebSocket request');
      return new Response('Expected WebSocket', { status: 426 });
    }

    console.log('[Speech Tutor Gemini] WebSocket upgrade request detected');

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    console.log('[Speech Tutor Gemini] Client WebSocket upgraded');

    // Connect to Gemini Live API
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${geminiKey}`;

    console.log('[Speech Tutor Gemini] Connecting to Gemini Live...');
    const geminiSocket = new WebSocket(geminiWsUrl);
    
    console.log('[Speech Tutor Gemini] Gemini WebSocket created, waiting for connection...');

    // Queue to buffer client messages until Gemini is open
    const pendingToGemini: any[] = [];
    let setupSent = false;

    const forwardToGemini = (data: any) => {
      if (geminiSocket.readyState === WebSocket.OPEN) {
        try {
          geminiSocket.send(data);
        } catch (e) {
          console.error('[Speech Tutor Gemini] Error sending to Gemini:', e);
        }
      } else {
        console.warn('[Speech Tutor Gemini] Gemini not ready, queuing message. state:', geminiSocket.readyState);
        pendingToGemini.push(data);
      }
    };

    // Forward messages from client to Gemini (translate format)
    clientSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Speech Tutor Gemini] Client message type:', message.type);

        // Translate OpenAI-style messages to Gemini format
        if (message.type === 'input_audio_buffer.append') {
          // Convert to Gemini audio chunk format
          const geminiMessage = {
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=24000',
                data: message.audio
              }]
            }
          };
          forwardToGemini(JSON.stringify(geminiMessage));
        } else if (message.type === 'session.update') {
          // Ignore - we handle setup separately
          console.log('[Speech Tutor Gemini] Ignoring session.update (handled in setup)');
        } else if (message.type === 'response.create') {
          // Ignore - Gemini doesn't need explicit response.create
          console.log('[Speech Tutor Gemini] Ignoring response.create (automatic in Gemini)');
        } else {
          // Forward other messages as-is for now
          forwardToGemini(event.data);
        }
      } catch (e) {
        console.error('[Speech Tutor Gemini] Error processing client message:', e);
        // If not JSON, forward as-is
        forwardToGemini(event.data);
      }
    };

    // Forward messages from Gemini to client (translate format)
    geminiSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Speech Tutor Gemini] Gemini message keys:', Object.keys(message));

        // Translate Gemini messages to OpenAI-style format
        if (message.setupComplete) {
          // Send proxy.ready to client
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({ type: 'proxy.ready' }));
            console.log('[Speech Tutor Gemini] Sent proxy.ready to client');
          }
        } else if (message.serverContent) {
          const content = message.serverContent;
          
          // Handle model turn (AI response)
          if (content.modelTurn) {
            const parts = content.modelTurn.parts || [];
            
            for (const part of parts) {
              // Audio response
              if (part.inlineData && part.inlineData.mimeType?.includes('audio')) {
                const audioMessage = {
                  type: 'response.audio.delta',
                  delta: part.inlineData.data
                };
                if (clientSocket.readyState === WebSocket.OPEN) {
                  clientSocket.send(JSON.stringify(audioMessage));
                }
              }
              
              // Text response (transcript)
              if (part.text) {
                const textMessage = {
                  type: 'response.audio_transcript.delta',
                  delta: part.text
                };
                if (clientSocket.readyState === WebSocket.OPEN) {
                  clientSocket.send(JSON.stringify(textMessage));
                }
              }
            }
            
            // Send done event after model turn
            if (clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify({ type: 'response.audio.done' }));
            }
          }
          
          // Handle turn complete
          if (content.turnComplete) {
            console.log('[Speech Tutor Gemini] Turn complete');
          }
        } else if (message.toolCall) {
          // Handle tool calls if needed
          console.log('[Speech Tutor Gemini] Tool call:', message.toolCall);
        }
      } catch (e) {
        console.error('[Speech Tutor Gemini] Error processing Gemini message:', e);
        // Forward as-is if we can't parse
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
        }
      }
    };

    // Handle Gemini connection open
    geminiSocket.onopen = () => {
      console.log('[Speech Tutor Gemini] ✓ Connected to Gemini Live');
      
      // Send setup message
      const setupMessage = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede"
                }
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: "You are a bilingual AI speech tutor. Users will speak to you mixing Portuguese and English. Your job is to listen carefully and repeat back what they said with perfect pronunciation in both languages. Be encouraging and natural. When repeating, maintain the same language mix they used."
            }]
          }
        }
      };

      try {
        geminiSocket.send(JSON.stringify(setupMessage));
        setupSent = true;
        console.log('[Speech Tutor Gemini] Setup message sent');
      } catch (e) {
        console.error('[Speech Tutor Gemini] Error sending setup:', e);
      }

      // Flush any queued messages
      try {
        const queueSize = pendingToGemini.length;
        if (queueSize > 0) {
          console.log(`[Speech Tutor Gemini] Flushing ${queueSize} queued messages`);
        }
        while (pendingToGemini.length) {
          const msg = pendingToGemini.shift();
          if (msg !== undefined) {
            geminiSocket.send(msg);
          }
        }
      } catch (e) {
        console.error('[Speech Tutor Gemini] Error flushing queued messages:', e);
      }
    };

    // Handle errors
    geminiSocket.onerror = (error) => {
      console.error('[Speech Tutor Gemini] Gemini connection error:', error);
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ 
            type: 'proxy.error', 
            source: 'gemini', 
            message: 'Gemini Live connection error' 
          }));
        }
      } catch (_) { /* no-op */ }
      try { clientSocket.close(1011, 'Gemini connection error'); } catch (_) {}
    };

    clientSocket.onerror = (error) => {
      console.error('[Speech Tutor Gemini] Client connection error:', error);
      try {
        if (geminiSocket.readyState === WebSocket.OPEN) {
          geminiSocket.close();
        }
      } catch (_) { /* no-op */ }
    };

    // Handle connection close
    geminiSocket.onclose = (event) => {
      console.log('[Speech Tutor Gemini] Gemini closed - Code:', event.code, 'Reason:', event.reason || 'No reason provided');
      
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          const closeMessage = {
            type: 'proxy.closed',
            source: 'gemini',
            code: event.code,
            reason: event.reason || 'Gemini connection closed',
            wasClean: event.wasClean
          };
          clientSocket.send(JSON.stringify(closeMessage));
          console.log('[Speech Tutor Gemini] Sent close notification to client');
          clientSocket.close(event.code, event.reason || 'Gemini closed');
        }
      } catch (e) {
        console.error('[Speech Tutor Gemini] Error notifying client of Gemini close:', e);
      }
    };

    clientSocket.onclose = (event) => {
      console.log('[Speech Tutor Gemini] Client closed - Code:', event.code, 'Reason:', event.reason || 'No reason provided');
      
      try {
        if (geminiSocket.readyState === WebSocket.OPEN) {
          console.log('[Speech Tutor Gemini] Closing Gemini due to client disconnect');
          geminiSocket.close();
        }
      } catch (e) {
        console.error('[Speech Tutor Gemini] Error closing Gemini:', e);
      }
    };

    return response;
  } catch (error) {
    console.error('[Speech Tutor Gemini] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
