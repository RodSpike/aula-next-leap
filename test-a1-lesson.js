// Test script to generate A1 Lesson 1 
import { supabase } from "@/integrations/supabase/client";
import { COMPLETE_CURRICULUM } from "@/utils/curriculumData";

async function testA1Lesson1() {
  const A1_DATA = COMPLETE_CURRICULUM.A1;
  const lesson1Data = A1_DATA.lessons[0];
  
  // Create A1 course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: `English A1 - ${A1_DATA.levelName}`,
      description: `Complete ${A1_DATA.levelName} English course`,
      level: 'A1',
      order_index: 0
    })
    .select('id')
    .single();

  if (courseError) throw courseError;

  // Create lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      course_id: course.id,
      title: lesson1Data.title,
      content: `${A1_DATA.levelName} lesson: ${lesson1Data.title}`,
      order_index: 0
    })
    .select('id')
    .single();

  if (lessonError) throw lessonError;

  // Generate AI content
  const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
    'generate-comprehensive-lesson',
    {
      body: {
        lessonTitle: lesson1Data.title,
        courseLevel: 'A1',
        grammarFocus: lesson1Data.grammarFocus,
        vocabularySets: lesson1Data.vocabularySets,
        practicalApplications: lesson1Data.practicalApplications,
        activities: lesson1Data.activities,
        languageSupport: A1_DATA.language
      }
    }
  );

  console.log('AI Response:', aiResponse);
  return { lesson, aiResponse };
}

// Run the test
testA1Lesson1().then(result => {
  console.log('Test completed:', result);
}).catch(error => {
  console.error('Test failed:', error);
});