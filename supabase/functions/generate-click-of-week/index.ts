import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { difficulty = "mixed" } = await req.json();

    const systemPrompt = `You are an English language expert creating quiz questions for Brazilian students learning English.
Generate exactly 50 multiple-choice questions testing English knowledge across these categories:
- Grammar (verb tenses, articles, prepositions, conditionals)
- Vocabulary (synonyms, antonyms, word meanings, idioms)
- Reading comprehension (short passages with questions)
- Common mistakes Brazilians make in English

Requirements:
1. Each question must have exactly 4 options (A, B, C, D)
2. Questions should range from beginner to advanced
3. Include clear explanations for each correct answer
4. Make questions engaging and practical
5. Return ONLY valid JSON, no markdown

Return a JSON array with exactly 50 objects in this format:
{
  "questions": [
    {
      "id": 1,
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Explanation of why this is correct",
      "category": "grammar|vocabulary|reading|common_mistakes",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

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
          { role: "user", content: `Generate 50 English quiz questions with difficulty level: ${difficulty}. Return only the JSON, no additional text.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    let questions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || parsed;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(questions) || questions.length < 50) {
      console.error("Invalid questions array:", questions?.length);
      throw new Error(`Expected 50 questions, got ${questions?.length || 0}`);
    }

    return new Response(JSON.stringify({ questions: questions.slice(0, 50) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
