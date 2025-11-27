import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Robust JSON parser that handles common AI response issues
function safeParseJSON(jsonString: string): any {
  // Remove markdown code blocks
  let cleaned = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Initial JSON parse failed, attempting cleanup...');
  }
  
  // Remove control characters except newline and tab
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Fix common escape issues - replace invalid escapes
  cleaned = cleaned.replace(/\\([^"\\\/bfnrtu])/g, '$1');
  
  // Try again
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Second JSON parse failed, trying more aggressive cleanup...');
  }
  
  // More aggressive cleanup - extract just the array portion
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {
      console.log('Array extraction failed');
    }
  }
  
  // Last resort: try to fix trailing commas
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('All JSON parse attempts failed:', e);
    throw new Error('Failed to parse JSON response from AI');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, courseName, courseDescription, aiChatContext, courseLevel } = await req.json();

    if (!courseId || !courseName) {
      throw new Error('Course ID and name are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI API key not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Starting content generation for course: ${courseName}`);

    // Step 1: Generate course structure (lessons outline) - LIMITED TO 4 LESSONS FOR SPEED
    const structurePrompt = `You are an expert course designer. Create a course structure for: "${courseName}"

Course Description: ${courseDescription || 'No description provided'}
Level: ${courseLevel || 'General'}
${aiChatContext ? `Context: ${aiChatContext}` : ''}

Create exactly 4 lessons. Return ONLY a JSON array:
[{"title": "Lesson Title", "description": "Brief description", "keyTopics": ["topic1", "topic2"]}]

Return ONLY the JSON array. Use the same language as the course name.`;

    console.log('Generating course structure...');
    
    const structureResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a course structure designer. Always return valid JSON arrays only, no markdown formatting. Escape all special characters properly.' },
          { role: 'user', content: structurePrompt }
        ],
      })
    });

    if (!structureResponse.ok) {
      const errorText = await structureResponse.text();
      console.error('Structure generation error:', errorText);
      if (structureResponse.status === 429) {
        throw new Error('Rate limits exceeded, please try again later.');
      }
      if (structureResponse.status === 402) {
        throw new Error('Payment required for AI usage.');
      }
      throw new Error(`AI error: ${structureResponse.status}`);
    }

    const structureData = await structureResponse.json();
    let lessonsStructure;
    
    try {
      const content = structureData.choices[0].message.content;
      lessonsStructure = safeParseJSON(content);
    } catch (e) {
      console.error('Failed to parse lessons structure:', e);
      throw new Error('Failed to generate valid course structure');
    }

    console.log(`Generated ${lessonsStructure.length} lessons structure`);

    // Step 2: Generate content for each lesson
    const generatedLessons = [];
    
    for (let i = 0; i < lessonsStructure.length; i++) {
      const lesson = lessonsStructure[i];
      console.log(`Generating content for lesson ${i + 1}: ${lesson.title}`);

      const lessonPrompt = `Create lesson content for: "${lesson.title}"

Course: ${courseName}
Topics: ${lesson.keyTopics?.join(', ') || 'General'}

Return in this format:

<lesson_content>
<h2>Introduction</h2><p>Brief intro</p>
<h2>Main Content</h2><p>Explanation with examples</p>
<h2>Summary</h2><p>Key points</p>
</lesson_content>

<exercises>
[{"question":"Q1","options":["A","B","C","D"],"correct_answer":"A","explanation":"Why A"},{"question":"Q2","options":["A","B","C","D"],"correct_answer":"B","explanation":"Why B"},{"question":"Q3","options":["A","B","C","D"],"correct_answer":"C","explanation":"Why C"}]
</exercises>

Use simple JSON. Same language as course name.`;

      const lessonResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert educator creating detailed lesson content. Always follow the exact format requested. For JSON, use only simple strings without special escape sequences.' },
            { role: 'user', content: lessonPrompt }
          ],
        })
      });

      if (!lessonResponse.ok) {
        console.error(`Failed to generate lesson ${i + 1}`);
        continue;
      }

      const lessonData = await lessonResponse.json();
      const lessonContent = lessonData.choices[0].message.content;

      // Parse lesson content and exercises
      let htmlContent = '';
      let exercises: any[] = [];

      const contentMatch = lessonContent.match(/<lesson_content>([\s\S]*?)<\/lesson_content>/);
      if (contentMatch) {
        htmlContent = contentMatch[1].trim();
      } else {
        // Fallback: use the whole content as HTML
        htmlContent = lessonContent.replace(/<exercises>[\s\S]*<\/exercises>/g, '').trim();
      }

      const exercisesMatch = lessonContent.match(/<exercises>([\s\S]*?)<\/exercises>/);
      if (exercisesMatch) {
        try {
          exercises = safeParseJSON(exercisesMatch[1]);
          console.log(`Successfully parsed ${exercises.length} exercises for lesson ${i + 1}`);
        } catch (e) {
          console.error(`Failed to parse exercises for lesson ${i + 1}:`, e);
          // Create fallback exercises
          exercises = [
            {
              question: `Review question for ${lesson.title}`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correct_answer: "Option A",
              explanation: "This is a placeholder exercise. Please review the lesson content."
            }
          ];
          console.log('Using fallback exercise for lesson', i + 1);
        }
      }

      generatedLessons.push({
        title: lesson.title,
        content: htmlContent,
        exercises: exercises,
        order_index: i
      });

      // Small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Successfully generated ${generatedLessons.length} lessons with content`);

    // Step 3: Save lessons to database
    for (const lesson of generatedLessons) {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: lesson.title,
          content: lesson.content,
          order_index: lesson.order_index
        })
        .select()
        .single();

      if (lessonError) {
        console.error('Error saving lesson:', lessonError);
        continue;
      }

      console.log(`Saved lesson: ${lesson.title} with ID: ${lessonData.id}`);

      // Save exercises for this lesson
      if (lesson.exercises && lesson.exercises.length > 0) {
        const exercisesToInsert = lesson.exercises.map((ex: any, idx: number) => ({
          lesson_id: lessonData.id,
          question: ex.question || 'Question',
          options: ex.options || ["A", "B", "C", "D"],
          correct_answer: ex.correct_answer || ex.options?.[0] || "A",
          explanation: ex.explanation || '',
          exercise_type: 'multiple_choice',
          order_index: idx,
          points: 1
        }));

        const { error: exerciseError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert);

        if (exerciseError) {
          console.error('Error saving exercises:', exerciseError);
        } else {
          console.log(`Saved ${exercisesToInsert.length} exercises for lesson: ${lesson.title}`);
        }
      }
    }

    // Step 4: Update course with AI chat context stored properly
    const fullDescription = aiChatContext 
      ? `${courseDescription || ''}\n\n---AI_CHAT_CONTEXT---\n${aiChatContext}`
      : courseDescription;

    await supabase
      .from('courses')
      .update({ description: fullDescription })
      .eq('id', courseId);

    console.log('Course content generation completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      lessonsCreated: generatedLessons.length,
      totalExercises: generatedLessons.reduce((sum, l) => sum + (l.exercises?.length || 0), 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dynamic-course:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
