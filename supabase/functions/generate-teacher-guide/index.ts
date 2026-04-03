import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callAI(prompt: string): Promise<string> {
  const providers = [
    {
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: Deno.env.get("GROQ_API_KEY"),
      model: "llama-3.3-70b-versatile",
    },
    {
      name: "Lovable",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: Deno.env.get("LOVABLE_API_KEY"),
      model: "google/gemini-2.5-flash",
    },
    {
      name: "OpenAI",
      url: "https://api.openai.com/v1/chat/completions",
      key: Deno.env.get("OPENAI_API_KEY"),
      model: "gpt-4o-mini",
    },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      console.log(`Trying ${provider.name}...`);
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${provider.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          ...(provider.name !== "Lovable" ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`${provider.name} failed: ${err}`);
        continue;
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) {
        console.error(`${provider.name}: empty response`);
        continue;
      }
      console.log(`${provider.name} succeeded`);
      return content;
    } catch (e) {
      console.error(`${provider.name} error:`, e);
      continue;
    }
  }

  throw new Error("All AI providers failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) throw new Error("Not authorized");

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");

    const { course_id, lesson_id } = await req.json();
    if (!lesson_id) throw new Error("lesson_id required");

    const { data: lesson, error: lessonError } = await supabaseClient
      .from("lessons")
      .select("id, title, content, course_id")
      .eq("id", lesson_id)
      .single();
    if (lessonError || !lesson) throw new Error("Lesson not found");

    const { data: course } = await supabaseClient
      .from("courses")
      .select("title, level, course_type")
      .eq("id", lesson.course_id)
      .single();

    const prompt = `You are an experienced ESL/EFL curriculum designer specializing in private, 1-on-1 online English lessons. The teacher will be alone with the student via Google Meet, sharing their screen to present material.

Generate a comprehensive Teacher's Guide for this lesson that works for this online, private class format.

Course: ${course?.title || "Unknown"} (Level: ${course?.level || "Unknown"})
Lesson Title: ${lesson.title}
Lesson Content Summary: ${lesson.content.substring(0, 2000)}

Generate a Teacher's Guide in JSON format with the following structure:
{
  "objectives": ["objective 1", "objective 2", ...],
  "warm_up": "A conversational warm-up activity suitable for 1-on-1 online class (5-10 min). Suggest natural conversation starters the teacher can use to engage the student and introduce the topic.",
  "presentation_notes": "Step-by-step notes on how to present the material to the student via screen sharing. Include talking points, questions to ask the student, and moments to pause for student interaction.",
  "screen_share_content": [
    {"title": "Section title", "type": "explanation|example|exercise|vocabulary|dialogue", "content": "Rich content that the teacher will display on screen while teaching. Use clear formatting. For exercises, include blank spaces or prompts for the student to answer.", "teacher_notes": "Private notes for the teacher on how to guide this section"}
  ],
  "practice_activities": [
    {"title": "Activity name", "description": "Detailed description adapted for 1-on-1 online format via Google Meet", "duration": "10 min", "interaction_type": "conversation|role-play|screen-activity|writing"}
  ],
  "assessment_tips": "How to assess student understanding in a private online lesson context",
  "differentiation_notes": "How to adapt the lesson if the student finds it too easy or too difficult",
  "estimated_duration_minutes": 60,
  "homework_suggestions": ["Suggestion 1", "Suggestion 2"],
  "additional_resources": [
    {"title": "Resource name", "url": "", "type": "video/article/worksheet"}
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, just the JSON object.
Write in English. Be specific and practical. Include 3-5 objectives, a conversational warm-up, detailed presentation notes for screen sharing, 4-8 screen share content sections (mix of explanations, examples, vocabulary, and interactive exercises with blanks for student answers), 2-3 practice activities suitable for 1-on-1 online format, and practical assessment tips. The screen_share_content is the core teaching material that will be displayed on screen - make it visually clear, well-structured, and interactive.`;

    const rawContent = await callAI(prompt);
    
    // Parse JSON - handle potential markdown wrapping
    let guideContent;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      guideContent = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw:", rawContent.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }
    // Upsert guide
    const { error: upsertError } = await supabaseClient
      .from("teacher_guides")
      .upsert({
        lesson_id: lesson.id,
        course_id: lesson.course_id,
        objectives: guideContent.objectives || [],
        warm_up: guideContent.warm_up || null,
        presentation_notes: guideContent.presentation_notes || null,
        practice_activities: guideContent.practice_activities || [],
        assessment_tips: guideContent.assessment_tips || null,
        differentiation_notes: guideContent.differentiation_notes || null,
        estimated_duration_minutes: guideContent.estimated_duration_minutes || 60,
        additional_resources: guideContent.additional_resources || [],
        screen_share_content: guideContent.screen_share_content || [],
        homework_suggestions: guideContent.homework_suggestions || [],
        generated_at: new Date().toISOString(),
      }, {
        onConflict: "lesson_id",
      });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, guide: guideContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("generate-teacher-guide error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
