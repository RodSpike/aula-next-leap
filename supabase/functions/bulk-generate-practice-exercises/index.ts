import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryItem {
  lesson_id: string;
  lesson_title: string;
  generated: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE) {
    return new Response(
      JSON.stringify({ error: "Supabase environment not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    // Client bound to caller's JWT for role check
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role
    const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: userRes.user.id,
      _role: "admin",
    });

    if (roleErr || isAdmin !== true) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { courseId, offset: bodyOffset, batchSize: bodyBatchSize } = await (async () => {
      try { return await req.json(); } catch { return {}; }
    })();

    const offset = Number.isFinite(bodyOffset) ? Math.max(0, Number(bodyOffset)) : 0;
    const batchSize = Number.isFinite(bodyBatchSize) ? Math.max(1, Math.min(10, Number(bodyBatchSize))) : 3;

    // Fetch lessons (optionally filter by course) in a bounded range to avoid timeouts
    let lessonsQuery = adminClient
      .from("lessons")
      .select("id, title, content")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (courseId) lessonsQuery = lessonsQuery.eq("course_id", courseId);

    const { data: lessons, error: lessonsErr } = await lessonsQuery;
    if (lessonsErr) throw lessonsErr;

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return new Response(
        JSON.stringify({ message: "No lessons found", processed: 0, successes: 0, failures: 0, details: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENROUTER_KEY && !LOVABLE_API_KEY && !OPENAI_KEY) {
      return new Response(
        JSON.stringify({ error: "No AI provider configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert English language teacher creating practice exercises. 
Generate 12-15 diverse, engaging exercises based on the lesson content provided.

CRITICAL REQUIREMENTS:
- Create EXACTLY 12-15 exercises minimum
- Mix exercise types: multiple choice, fill-in-the-blank, true/false, matching, sentence completion
- Exercises should progressively increase in difficulty
- Each exercise must test a different aspect of the lesson
- Provide clear, concise explanations for correct answers
- Make exercises practical and relevant to real-world usage

Return a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Why this is correct",
    "order_index": 0
  }
]`;

    const parseAIJson = (contentRaw: unknown): any[] => {
      if (typeof contentRaw === "string") {
        let str = contentRaw.trim();
        if (str.startsWith("```")) {
          str = str.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "");
        }
        const firstBrace = Math.min(...[str.indexOf("{"), str.indexOf("[")].filter(i => i !== -1));
        if (Number.isFinite(firstBrace) && (firstBrace as number) > 0) {
          str = str.slice(firstBrace as number);
        }
        const lastBrace = Math.max(str.lastIndexOf("}"), str.lastIndexOf("]"));
        if (lastBrace !== -1) {
          str = str.slice(0, lastBrace + 1);
        }
        const parsed = JSON.parse(str);
        return parsed.exercises || parsed;
      }
      if (contentRaw && typeof contentRaw === "object") {
        // @ts-ignore
        return contentRaw.exercises || contentRaw;
      }
      throw new Error("No content received from AI");
    };

    const details: SummaryItem[] = [];
    let successes = 0;
    let failures = 0;

    for (const lesson of lessons) {
      try {
        const userPrompt = `Create 12-15 practice exercises for this lesson:\n\nLESSON: ${lesson.title}\n\nCONTENT:\n${(lesson.content || "").slice(0, 8000)}\n\nRemember:\n- 12-15 exercises minimum\n- Variety of question types\n- Progressive difficulty\n- Real-world applicability\n- Clear explanations`;

        let raw: string | undefined;

        // Use Lovable AI
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY not configured");
        }

        console.log(`Lesson ${lesson.id}: Generating with Lovable AI (Gemini)`);
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const t = await response.text();
          console.error("Lovable AI error:", response.status, t);
          throw new Error(`Lovable AI failed: ${response.status} - ${t}`);
        }

        const result = await response.json();
        raw = result.choices?.[0]?.message?.content;

        if (!raw) {
          throw new Error("No response from Lovable AI");
        }

        const exercises = parseAIJson(raw);
        if (!Array.isArray(exercises)) throw new Error("Exercises must be an array");
        if (exercises.length === 0) throw new Error("AI returned empty exercises array");

        // Replace existing exercises for this lesson
        await adminClient.from("exercises").delete().eq("lesson_id", lesson.id);

        const toInsert = exercises.map((ex: any, index: number) => ({
          lesson_id: lesson.id,
          question: ex.question || "Question missing",
          options: ex.options || [],
          correct_answer: ex.correct_answer || "",
          explanation: ex.explanation || "",
          order_index: index,
        }));

        const { error: insertErr } = await adminClient.from("exercises").insert(toInsert);
        if (insertErr) throw insertErr;

        console.log(`✓ Lesson ${lesson.id} (${lesson.title}): Generated ${toInsert.length} exercises`);
        details.push({ lesson_id: lesson.id, lesson_title: lesson.title, generated: toInsert.length });
        successes += 1;
      } catch (e: any) {
        console.error(`✗ Lesson ${lesson.id} (${lesson.title}):`, e?.message || e);
        details.push({ lesson_id: lesson.id, lesson_title: lesson.title, generated: 0, error: e?.message || String(e) });
        failures += 1;
      }

      // Gentle pacing to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    return new Response(
      JSON.stringify({
        processed: lessons.length,
        successes,
        failures,
        details,
        batch: {
          offset,
          batchSize,
          nextOffset: offset + (lessons?.length || 0)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("bulk-generate-practice-exercises error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});