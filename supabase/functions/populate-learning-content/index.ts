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

    console.log('Starting to populate learning content...');

    // First, populate courses
    const coursesData = [
      // A1 Level Courses
      { level: 'A1', title: 'Basic Greetings & Introductions', description: 'Learn how to introduce yourself and greet people in English', order_index: 1 },
      { level: 'A1', title: 'Numbers & Time', description: 'Master numbers, time telling, and basic calculations', order_index: 2 },
      { level: 'A1', title: 'Family & Friends', description: 'Vocabulary and conversations about family and relationships', order_index: 3 },
      { level: 'A1', title: 'Daily Routines', description: 'Describe your daily activities and schedules', order_index: 4 },
      { level: 'A1', title: 'Food & Shopping', description: 'Essential vocabulary for eating out and shopping', order_index: 5 },

      // A2 Level Courses
      { level: 'A2', title: 'Past Experiences', description: 'Talk about past events using past tense', order_index: 1 },
      { level: 'A2', title: 'Future Plans', description: 'Express plans and intentions for the future', order_index: 2 },
      { level: 'A2', title: 'Travel & Directions', description: 'Navigate and discuss travel experiences', order_index: 3 },
      { level: 'A2', title: 'Health & Lifestyle', description: 'Discuss health, fitness, and lifestyle choices', order_index: 4 },
      { level: 'A2', title: 'Work & Studies', description: 'Professional and academic vocabulary and situations', order_index: 5 },

      // B1 Level Courses
      { level: 'B1', title: 'Expressing Opinions', description: 'Learn to give and defend your opinions effectively', order_index: 1 },
      { level: 'B1', title: 'Problem Solving', description: 'Discuss problems and propose solutions', order_index: 2 },
      { level: 'B1', title: 'Media & Technology', description: 'Navigate modern media and technology discussions', order_index: 3 },
      { level: 'B1', title: 'Culture & Traditions', description: 'Explore cultural differences and traditions', order_index: 4 },
      { level: 'B1', title: 'Environment & Society', description: 'Discuss environmental and social issues', order_index: 5 },

      // B2 Level Courses
      { level: 'B2', title: 'Advanced Grammar Structures', description: 'Master complex grammatical constructions', order_index: 1 },
      { level: 'B2', title: 'Business English', description: 'Professional communication and business vocabulary', order_index: 2 },
      { level: 'B2', title: 'Academic Writing', description: 'Develop formal writing and essay skills', order_index: 3 },
      { level: 'B2', title: 'Critical Thinking', description: 'Analyze arguments and think critically in English', order_index: 4 },
      { level: 'B2', title: 'Presentations & Public Speaking', description: 'Deliver effective presentations and speeches', order_index: 5 },

      // C1 Level Courses
      { level: 'C1', title: 'Nuanced Communication', description: 'Express subtle meanings and implications', order_index: 1 },
      { level: 'C1', title: 'Professional Expertise', description: 'Communicate with authority in your field', order_index: 2 },
      { level: 'C1', title: 'Literary Analysis', description: 'Appreciate and analyze English literature', order_index: 3 },
      { level: 'C1', title: 'Advanced Debate Skills', description: 'Engage in sophisticated debates and discussions', order_index: 4 },
      { level: 'C1', title: 'Research & Documentation', description: 'Conduct research and write academic papers', order_index: 5 },

      // C2 Level Courses
      { level: 'C2', title: 'Native-Level Fluency', description: 'Achieve near-native speaker competence', order_index: 1 },
      { level: 'C2', title: 'Mastery of Idioms', description: 'Use idiomatic expressions naturally', order_index: 2 },
      { level: 'C2', title: 'Creative Writing', description: 'Write creatively with style and flair', order_index: 3 },
      { level: 'C2', title: 'Professional Translation', description: 'Translate complex texts accurately', order_index: 4 },
      { level: 'C2', title: 'Cultural Mastery', description: 'Navigate all cultural contexts with ease', order_index: 5 }
    ];

    console.log('Inserting courses...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .insert(coursesData)
      .select();

    if (coursesError) {
      console.error('Error inserting courses:', coursesError);
      throw coursesError;
    }

    console.log(`Inserted ${courses?.length || 0} courses`);

    // Now create lessons for each course
    for (const course of courses || []) {
      const lessonsData = [
        {
          course_id: course.id,
          title: `${course.title} - Introduction`,
          content: `Welcome to ${course.title}! This lesson introduces you to the key concepts and vocabulary you'll learn in this course. ${course.description}`,
          order_index: 1
        },
        {
          course_id: course.id,
          title: `${course.title} - Core Concepts`,
          content: `In this lesson, we'll dive deeper into the main ideas of ${course.title}. You'll learn essential vocabulary and practice key grammar structures.`,
          order_index: 2
        },
        {
          course_id: course.id,
          title: `${course.title} - Practice & Application`,
          content: `Now it's time to practice what you've learned! This lesson focuses on real-world application of ${course.title} concepts through exercises and examples.`,
          order_index: 3
        },
        {
          course_id: course.id,
          title: `${course.title} - Review & Assessment`,
          content: `Let's review everything you've learned in ${course.title}. This lesson includes comprehensive review exercises and prepares you for the final assessment.`,
          order_index: 4
        }
      ];

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsData);

      if (lessonsError) {
        console.error(`Error inserting lessons for course ${course.title}:`, lessonsError);
      }
    }

    console.log('Lessons created successfully');

    // Create level tests
    const levelTests = [
      { from_level: 'A1', to_level: 'A2', questions: [] },
      { from_level: 'A2', to_level: 'B1', questions: [] },
      { from_level: 'B1', to_level: 'B2', questions: [] },
      { from_level: 'B2', to_level: 'C1', questions: [] },
      { from_level: 'C1', to_level: 'C2', questions: [] }
    ];

    const { error: testsError } = await supabase
      .from('level_tests')
      .insert(levelTests);

    if (testsError) {
      console.error('Error inserting level tests:', testsError);
    }

    console.log('Level tests created successfully');

    // Now create the community post with course links
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

      // Create a function to get user's personal progress (placeholder - will be updated by frontend)
      const createProgressAwarePost = async (userId: string = '00000000-0000-0000-0000-000000000000') => {
        return `🎓 **Welcome to Your English Learning Journey!**

📊 **Your Personal Progress:**
[This section will show your individual progress when you visit]

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

🤖 **AI Tutor Available:**
- Click "AI Tutor" button on any course for instant help
- Get personalized explanations and extra practice
- Ask questions about specific topics anytime

Ready to begin? Click any course title above to start your journey! 🚀`;
      };

      // Create a welcome post with interactive course content
      const { error: postError } = await supabase
        .from('group_posts')
        .insert({
          group_id: englishGroup.id,
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          content: await createProgressAwarePost(),
          attachments: []
        });

      if (postError) {
        console.error('Error creating community post:', postError);
      } else {
        console.log('Community post created successfully');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Learning content populated successfully',
      coursesCreated: courses?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error populating learning content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});