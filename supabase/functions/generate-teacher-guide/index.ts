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
  "warm_up": "A conversational warm-up activity suitable for 1-on-1 online class (5-10 min).",
  "presentation_notes": "Step-by-step notes on how to present the material via screen sharing.",
  "screen_share_content": [
    {"title": "Section title", "type": "explanation|example|exercise|vocabulary|dialogue", "content": "THE ACTUAL TEACHING CONTENT (see rules below)", "teacher_notes": "Private notes for the teacher"}
  ],
  "practice_activities": [
    {"title": "Activity name", "description": "Detailed description for 1-on-1 online format", "duration": "10 min", "interaction_type": "conversation|role-play|screen-activity|writing"}
  ],
  "assessment_tips": "How to assess student understanding",
  "differentiation_notes": "How to adapt if too easy or difficult",
  "estimated_duration_minutes": 60,
  "homework_suggestions": ["Suggestion 1", "Suggestion 2"],
  "additional_resources": [
    {"title": "Resource name", "url": "", "type": "video/article/worksheet"}
  ],
  "flashcards": [
    {"front": "A clue, definition, or description in English", "back": "The English word, phrase, or correct answer", "category": "vocabulary|grammar|expression|comprehension"}
  ]
}

CRITICAL RULES FOR "screen_share_content" — THIS IS THE MOST IMPORTANT PART:

The "content" field in each screen_share_content section is what the teacher SHARES ON SCREEN with the student. It must contain ACTUAL TEACHING MATERIAL, NOT instructions for the teacher. The student will READ this content on the shared screen.

Each "content" field MUST include:
1. For "explanation" type: The actual grammar rule or concept explained clearly with examples. Write the full explanation as if it were a textbook page. Include the rule, when to use it, and 3-5 example sentences with translations in parentheses.
   Example: "The Past Simple is used to talk about completed actions in the past.\\n\\nRegular verbs: Add -ed to the base form.\\n- I walked to school. (Eu andei até a escola.)\\n- She played tennis yesterday. (Ela jogou tênis ontem.)\\n- They watched a movie last night. (Eles assistiram um filme onite.)\\n\\nSpelling rules:\\n- Verbs ending in -e: just add -d (live -> lived, dance -> danced)\\n- Verbs ending in consonant + y: change y to i and add -ed (study -> studied, carry -> carried)\\n- Short verbs ending in consonant-vowel-consonant: double the last consonant (stop -> stopped, plan -> planned)"

2. For "vocabulary" type: A list of 8-12 words/phrases with clear definitions, example sentences, and pronunciation tips. Format each entry on its own line.
   Example: "Key Vocabulary:\\n\\n- *appointment* - a scheduled meeting or visit (I have a doctor's appointment at 3 PM.)\\n- *available* - free, not busy (Are you available on Friday?)\\n- *cancel* - to decide not to do something planned (I need to cancel my reservation.)\\n..."

3. For "exercise" type: An actual interactive exercise with clear instructions and items the student must complete. Include 5-8 items.
   Example: "Complete the sentences with the correct form of the verb in parentheses:\\n\\n1. Yesterday, I ______ (go) to the supermarket.\\n2. She ______ (study) English for two hours last night.\\n3. They ______ (not/watch) TV yesterday.\\n...\\n\\nAnswers (teacher only - do not show yet):\\n1. went\\n2. studied\\n3. didn't watch"

4. For "example" type: Real-world dialogues or usage examples. Write complete dialogues (4-8 lines) with context.
   Example: "At a Restaurant - Ordering Food:\\n\\nWaiter: Good evening! Are you ready to order?\\nCustomer: Yes, I'd like the grilled chicken, please.\\nWaiter: Would you like a side dish with that?\\nCustomer: Yes, I'll have the salad, please.\\nWaiter: And to drink?\\nCustomer: Just water, please.\\nWaiter: Great choice! I'll be right back."

5. For "dialogue" type: A full role-play dialogue with stage directions. After the dialogue, include comprehension questions and pronunciation focus words.

DO NOT write vague instructions like "Explain the past tense to the student" or "Present vocabulary items". Write the ACTUAL content that appears on screen.

The "teacher_notes" field is where you put private instructions for the teacher (e.g., "Ask the student to read aloud", "Pause here to check understanding", "If the student struggles, simplify by...").

OTHER RULES:
- Return ONLY valid JSON. No markdown, no code blocks.
- CRITICAL: Do NOT include ANY HTML tags. No <p>, <h3>, <ul>, <li>, <b>, <strong>, <em>, <i>, <div>, or any other HTML tags. Write plain text only. Use line breaks (\\n) for formatting, dashes (-) for lists, and asterisks (*word*) for emphasis.
- Write in English. Be specific and practical.
- Include 3-5 objectives, 6-10 screen share content sections (mix of explanation, vocabulary, exercise, example, and dialogue types), 2-3 practice activities.
- Include 5-8 flashcards. Flashcards are a quiz tool — the "front" is a CLUE, DEFINITION, or DESCRIPTION (e.g., "A question used to ask someone's name"), and the "back" is the ANSWER the student must recall (e.g., "What is your name?").`;

    const rawContent = await callAI(prompt);

    let guideContent: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      guideContent = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw:", rawContent.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    const screenShareContent = guideContent.screen_share_content || [];
    const flashcards = guideContent.flashcards || [];

    // Preserve existing images if regenerating
    const { data: existingGuide } = await supabaseClient
      .from("teacher_guides")
      .select("screen_share_content, flashcards")
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    if (existingGuide) {
      const oldSections = (existingGuide.screen_share_content as any[] | null) || [];
      const oldFlashcards = (existingGuide.flashcards as any[] | null) || [];
      
      // Carry over admin-uploaded images by matching section index
      oldSections.forEach((oldSection: any, idx: number) => {
        if (oldSection?.image_url && idx < screenShareContent.length) {
          screenShareContent[idx].image_url = oldSection.image_url;
        }
      });
      oldFlashcards.forEach((oldCard: any, idx: number) => {
        if (oldCard?.image_url && idx < flashcards.length) {
          flashcards[idx].image_url = oldCard.image_url;
        }
      });
    }

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
        screen_share_content: screenShareContent,
        homework_suggestions: guideContent.homework_suggestions || [],
        flashcards: flashcards,
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
