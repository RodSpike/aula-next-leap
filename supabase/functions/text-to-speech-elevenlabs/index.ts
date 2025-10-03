import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voiceId = "Aria", model = "eleven_multilingual_v2", speed = 1.0 } = await req.json();
    if (!text) throw new Error("Text is required");

    const XI_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!XI_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map friendly names to fixed IDs when common names are passed
    const VOICE_MAP: Record<string, string> = {
      Aria: "9BWtsMINqrJLrRacOk9x",
      Sarah: "EXAVITQu4vr4xnSDxMaL",
      Laura: "FGY2WhTYpPnrIDTdsKH5",
      George: "JBFqnCBsd6RMkjVDRZzb",
      Callum: "N2lVS1w4EtoT3dr4eOWO",
      River: "SAz9YHcvj6GT2YYXdXww",
      Liam: "TX3LPaxmHKxFdv7VOQHJ",
      Charlotte: "XB0fDUnXU5powFXDhCwa",
      Alice: "Xb7hH8MSUJpSbSDYk0k2",
      Matilda: "XrExE9yKIg1WjnnlVkGX",
    };

    const resolvedVoiceId = VOICE_MAP[voiceId] || voiceId;

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": XI_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: model,
        // Simple control for tempo using "stability"/"style" plus let client set playbackRate
        voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("ElevenLabs error:", t);
      throw new Error(`ElevenLabs API error: ${resp.status}`);
    }

    const arrayBuffer = await resp.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ audioContent: base64Audio, contentType: "audio/mpeg" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("text-to-speech-elevenlabs error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate speech" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});