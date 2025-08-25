import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all courses to create interactive content
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, level, description')
      .order('level', { ascending: true })
      .order('order_index', { ascending: true });

    // Create first community group post linking to courses
    const { data: englishGroup } = await supabase
      .from('community_groups')
      .select('id')
      .eq('name', 'English Learning')
      .eq('is_default', true)
      .single();

    if (englishGroup && courses) {
      // Group courses by level
      const coursesByLevel = courses.reduce((acc, course) => {
        if (!acc[course.level]) acc[course.level] = [];
        acc[course.level].push(course);
        return acc;
      }, {} as Record<string, any[]>);

      // Create course content for each level
      let courseContent = '';
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      for (const level of levels) {
        if (coursesByLevel[level]) {
          courseContent += `\n## 📖 ${level} Level Courses\n`;
          for (const course of coursesByLevel[level]) {
            courseContent += `• **[${course.title}](/course/${course.id})** - ${course.description}\n`;
          }
        }
      }

      // Create a welcome post with interactive course content
      const { error: postError } = await supabase
        .from('group_posts')
        .insert({
          group_id: englishGroup.id,
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          content: `🎓 **Welcome to Your English Learning Journey!**

Start your structured Cambridge-aligned courses below. Find your level and begin learning immediately:

${courseContent}

✨ **How It Works:**
- Click any course title to start learning
- Complete lessons with interactive content
- Take exercises after each lesson
- Score 70% or higher to advance
- Pass level tests to unlock certificates

🎯 **Your Progress Tracking:**
- Track your learning from the Dashboard
- See your completed lessons and scores  
- View earned certificates
- Join level-specific discussions

Ready to begin? Click any course title above to start your journey! 🚀`,
          attachments: []
        });

      if (postError) {
        throw postError;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating course content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});