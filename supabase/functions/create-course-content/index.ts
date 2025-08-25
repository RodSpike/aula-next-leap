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

    // Create first community group post linking to courses
    const { data: englishGroup } = await supabase
      .from('community_groups')
      .select('id')
      .eq('name', 'English Learning')
      .eq('is_default', true)
      .single();

    if (englishGroup) {
      // Create a welcome post with link to structured courses
      const { error: postError } = await supabase
        .from('group_posts')
        .insert({
          group_id: englishGroup.id,
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          content: `🎓 **Welcome to Aula Click!**

Start your structured English learning journey with our comprehensive Cambridge-aligned courses:

📚 **Available Courses:**
• A1 Elementary English - Perfect for absolute beginners
• A2 Pre-Intermediate English - Build on your basics
• B1 Intermediate English - Gain confidence for work and travel  
• B2 Upper-Intermediate English - Master advanced grammar
• C1 Advanced English - Achieve fluency
• C2 Proficiency English - Master native-level skills

✨ **Progressive Learning System:**
- Interactive lessons with rich content
- Practice exercises after each lesson
- Must score 70% to advance to next lesson
- Level advancement tests to unlock new levels
- Earn certificates for completing levels

🚀 **Get Started:**
1. Take your Cambridge Placement Test to find your level
2. Browse our course catalog and start learning
3. Join your level group to connect with peers
4. Practice regularly and track your progress

Ready to begin? Click the courses link in the navigation to explore our full catalog!

Good luck on your learning journey! 🌟`,
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