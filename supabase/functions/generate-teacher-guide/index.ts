import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { decode as base64Decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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

async function generateImage(prompt: string, style: string): Promise<string | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return null;

  try {
    const textWarning = "CRITICAL: If the image contains any English text, words, or phrases, they MUST be spelled correctly with perfect grammar. Double-check every word. No typos allowed — this is for English language learners and errors cause confusion.";
    const fullPrompt = style === "realistic"
      ? `Photorealistic educational illustration: ${prompt}. Clean, clear, suitable for ESL teaching material. White background. DO NOT include any text or words in the image unless absolutely necessary. If text must appear, keep it to 1-3 simple words maximum. ${textWarning}`
      : `Simple, colorful cartoon illustration for language learning: ${prompt}. Clean lines, educational style, white background. DO NOT include any text or words in the image unless absolutely necessary. If text must appear, keep it to 1-3 simple words maximum. ${textWarning}`;

    console.log(`Generating image: ${prompt.substring(0, 60)}...`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error(`Image gen failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const imageData = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      console.error("No image in response");
      return null;
    }

    return imageData; // data:image/png;base64,...
  } catch (e) {
    console.error("Image generation error:", e);
    return null;
  }
}

async function uploadImageToStorage(
  supabaseClient: any,
  base64DataUrl: string,
  lessonId: string,
  index: number
): Promise<string | null> {
  try {
    // Extract base64 data
    const match = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return null;

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const base64Data = match[2];
    const bytes = base64Decode(base64Data);

    const fileName = `${lessonId}/${Date.now()}-${index}.${ext}`;

    const { error } = await supabaseClient.storage
      .from("teacher-guide-images")
      .upload(fileName, bytes, {
        contentType: `image/${match[1]}`,
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from("teacher-guide-images")
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || null;
  } catch (e) {
    console.error("Upload error:", e);
    return null;
  }
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

    // Step 1: Generate guide JSON with flashcards and image suggestions
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
    {"title": "Section title", "type": "explanation|example|exercise|vocabulary|dialogue", "content": "Rich content for screen sharing.", "teacher_notes": "Private notes for the teacher"}
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
    {"front": "English word, phrase, or question", "back": "Definition, translation hint, or answer", "category": "vocabulary|grammar|expression|comprehension"}
  ],
  "image_suggestions": [
    {"description": "A clear description of an educational illustration to generate", "style": "illustration|realistic", "placement": "section index number or flashcard index", "placement_type": "section|flashcard"}
  ]
}

IMPORTANT RULES:
- Return ONLY valid JSON. No markdown, no code blocks.
- Write in English. Be specific and practical.
- Include 3-5 objectives, 4-8 screen share content sections, 2-3 practice activities.
- Include 5-8 flashcards covering key vocabulary, grammar points, or expressions from the lesson. The "front" should be the term/question and "back" should be the definition/answer.
- Include 3-4 image_suggestions for illustrations that would help the student understand concepts visually. Keep descriptions simple and clear (e.g., "A person greeting someone at an office", "A clock showing different times of day"). Mix illustration and realistic styles.
- For image placement, use the index of the section or flashcard where the image belongs.`;

    const rawContent = await callAI(prompt);

    // Parse JSON
    let guideContent: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      guideContent = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw:", rawContent.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    // Step 2: Generate images from image_suggestions
    const imageSuggestions = guideContent.image_suggestions || [];
    const maxImages = Math.min(imageSuggestions.length, 4); // Limit to 4 images
    const screenShareContent = guideContent.screen_share_content || [];
    const flashcards = guideContent.flashcards || [];

    for (let i = 0; i < maxImages; i++) {
      const suggestion = imageSuggestions[i];
      if (!suggestion?.description) continue;

      try {
        const base64DataUrl = await generateImage(suggestion.description, suggestion.style || "illustration");
        if (!base64DataUrl) continue;

        // Upload to storage
        const publicUrl = await uploadImageToStorage(supabaseClient, base64DataUrl, lesson.id, i);
        if (!publicUrl) continue;

        // Place image in the correct location
        const placementIndex = parseInt(suggestion.placement, 10);
        if (suggestion.placement_type === "flashcard" && !isNaN(placementIndex) && flashcards[placementIndex]) {
          flashcards[placementIndex].image_url = publicUrl;
        } else if (suggestion.placement_type === "section" && !isNaN(placementIndex) && screenShareContent[placementIndex]) {
          screenShareContent[placementIndex].image_url = publicUrl;
        } else {
          // Default: add to a section if possible
          const targetIdx = Math.min(i, screenShareContent.length - 1);
          if (targetIdx >= 0 && screenShareContent[targetIdx]) {
            screenShareContent[targetIdx].image_url = publicUrl;
          }
        }

        console.log(`Image ${i + 1}/${maxImages} generated and uploaded`);
      } catch (imgErr) {
        console.error(`Image ${i} failed:`, imgErr);
        // Continue without image - guide still works
      }
    }

    // Step 3: Upsert guide with flashcards and images
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
