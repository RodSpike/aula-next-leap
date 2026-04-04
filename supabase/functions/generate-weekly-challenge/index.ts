import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate week dates (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    console.log(`Generating challenge for week: ${weekStart} to ${weekEnd}`);

    // Delete any existing challenges for this week (allows regeneration)
    const { data: existingChallenges } = await supabase
      .from('click_of_week_challenges')
      .select('id')
      .eq('week_start', weekStart);

    if (existingChallenges && existingChallenges.length > 0) {
      console.log("Removing existing challenges for this week:", existingChallenges.map(c => c.id));
      for (const ch of existingChallenges) {
        // Delete related data first
        await supabase.from('click_of_week_attempts').delete().eq('challenge_id', ch.id);
        await supabase.from('click_of_week_leaderboard').delete().eq('challenge_id', ch.id);
        await supabase.from('click_of_week_challenges').delete().eq('id', ch.id);
      }
    }

    // Determine previous week winner
    const lastWeekStart = new Date(monday);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(monday);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const { data: lastWeekChallenge } = await supabase
      .from('click_of_week_challenges')
      .select('id')
      .eq('week_start', lastWeekStart.toISOString().split('T')[0])
      .single();

    if (lastWeekChallenge) {
      // Get the winner of last week
      const { data: topPlayer } = await supabase
        .from('click_of_week_leaderboard')
        .select('user_id, best_score')
        .eq('challenge_id', lastWeekChallenge.id)
        .order('best_score', { ascending: false })
        .limit(1)
        .single();

      if (topPlayer) {
        // Check if winner already recorded
        const { data: existingWinner } = await supabase
          .from('click_of_week_winners')
          .select('id')
          .eq('challenge_id', lastWeekChallenge.id)
          .single();

        if (!existingWinner) {
          await supabase.from('click_of_week_winners').insert({
            user_id: topPlayer.user_id,
            challenge_id: lastWeekChallenge.id,
            week_start: lastWeekStart.toISOString().split('T')[0],
            week_end: lastWeekEnd.toISOString().split('T')[0],
            final_score: topPlayer.best_score
          });

          // Award achievement to winner
          await supabase.rpc('update_achievement_progress', {
            p_user_id: topPlayer.user_id,
            p_achievement_key: 'click_weekly_winner',
            p_increment: 1
          });

          console.log("Recorded last week winner:", topPlayer.user_id);
        }
      }
    }

    // Fetch previous weeks' questions to avoid repetition
    console.log("Fetching previous weeks' questions to avoid repetition...");
    const { data: previousChallenges } = await supabase
      .from('click_of_week_challenges')
      .select('questions')
      .order('created_at', { ascending: false })
      .limit(4);

    let previousQuestionsSummary = "";
    if (previousChallenges && previousChallenges.length > 0) {
      const pastQuestions: string[] = [];
      for (const ch of previousChallenges) {
        const qs = ch.questions as any[];
        if (Array.isArray(qs)) {
          for (const q of qs.slice(0, 15)) {
            pastQuestions.push(q.question);
          }
        }
      }
      if (pastQuestions.length > 0) {
        previousQuestionsSummary = `\n\nCRITICAL - DO NOT REPEAT THESE QUESTIONS OR SIMILAR PATTERNS from previous weeks:\n${pastQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nCreate completely NEW and DIFFERENT questions. Use different grammar topics, different vocabulary words, different sentence structures, and different scenarios. Be creative and varied!`;
      }
    }

    // Generate 50 questions using AI
    console.log("Generating 50 questions with AI...");

    const systemPrompt = `You are an expert English language teacher creating quiz questions for Brazilian students learning English.
Generate exactly 50 multiple-choice questions testing English knowledge across these categories:
- Grammar (verb tenses, articles, prepositions, conditionals, modal verbs, passive voice, reported speech, relative clauses)
- Vocabulary (synonyms, antonyms, word meanings, idioms, phrasal verbs, collocations, word formation)
- Reading comprehension (short passages with questions)
- Common mistakes Brazilians make in English (false cognates, preposition usage, word order)

VARIETY IS ESSENTIAL - Each week must feel completely fresh:
- Use different themes each time (travel, technology, food, sports, music, nature, work, health, etc.)
- Rotate grammar topics - don't repeat the same structures
- Use varied sentence contexts and scenarios
- Mix formal and informal English
- Include British and American English differences occasionally

CRITICAL GRAMMAR RULES - YOU MUST FOLLOW THESE EXACTLY:

1. ARTICLES (A vs AN):
   - Use "A" before words that START WITH A CONSONANT SOUND (not letter!)
   - Use "AN" before words that START WITH A VOWEL SOUND (not letter!)
   - CRITICAL: Look at the NEXT word in the phrase, not the noun!
   - Examples:
     * "A new umbrella" (correct - "new" starts with consonant sound /n/)
     * "AN umbrella" (correct - "umbrella" starts with vowel sound /ʌ/)
     * "A university" (correct - "university" starts with /juː/ consonant sound)
     * "AN hour" (correct - "hour" starts with vowel sound, H is silent)
   - NEVER ask "a or an" where the answer depends on a word NOT shown in the options!

2. For article questions, ALWAYS include the full phrase in the question and options.

3. Double-check every answer before including it. The correct_answer index MUST match the actually correct option.

4. Explanations must be accurate and educational.

Requirements:
1. Each question must have exactly 4 options
2. Questions should range from beginner to advanced (roughly 15 easy, 20 medium, 15 hard)
3. Include clear, accurate explanations for each correct answer
4. Make questions engaging and practical
5. Return ONLY valid JSON, no markdown
6. VERIFY each answer is grammatically correct before including
${previousQuestionsSummary}

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
          { role: "user", content: "Generate 50 completely NEW and UNIQUE English quiz questions with mixed difficulty. Do NOT reuse any question patterns from previous weeks. Use fresh themes, different grammar structures, and creative scenarios. Double-check every answer for accuracy. Return only the JSON." }
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || parsed;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(questions) || questions.length < 50) {
      console.error("Invalid questions array, got:", questions?.length);
      throw new Error(`Expected 50 questions, got ${questions?.length || 0}`);
    }

    // Create the challenge
    const { data: newChallenge, error: insertError } = await supabase
      .from('click_of_week_challenges')
      .insert({
        week_start: weekStart,
        week_end: weekEnd,
        questions: questions.slice(0, 50),
        difficulty: 'mixed',
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting challenge:", insertError);
      throw insertError;
    }

    console.log("Successfully created challenge:", newChallenge.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        challengeId: newChallenge.id,
        weekStart,
        weekEnd,
        questionsCount: 50
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating weekly challenge:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
