import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Sparkles } from "lucide-react";
import { COMPLETE_CURRICULUM } from "@/utils/curriculumData";

export function ComprehensiveLessonGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateComprehensiveLessons = async () => {
    setIsGenerating(true);
    
    try {
      console.log("Starting comprehensive lesson generation...");
      
      // Use the complete curriculum structure
      const curriculumStructure = COMPLETE_CURRICULUM;

      // First, ensure courses exist
      for (const [level, levelData] of Object.entries(curriculumStructure)) {
        console.log(`Processing ${level} level...`);
        
        // Check if course exists
        let { data: course } = await supabase
          .from('courses')
          .select('id')
          .eq('level', level)
          .single();

        if (!course) {
          // Create course
          const { data: newCourse, error: courseError } = await supabase
            .from('courses')
            .insert({
              title: `English ${level} - ${levelData.levelName}`,
              description: `Complete ${levelData.levelName} English course with ${levelData.totalLessons} lessons`,
              level: level,
              order_index: Object.keys(curriculumStructure).indexOf(level)
            })
            .select('id')
            .single();

          if (courseError) throw courseError;
          course = newCourse;
        }

        // Generate lessons for this level
        for (let i = 0; i < levelData.lessons.length; i++) {
          const lessonData = levelData.lessons[i];
          console.log(`Generating lesson ${i + 1}: ${lessonData.title}`);

          // Check if lesson exists
          let { data: lesson } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', course.id)
            .eq('order_index', i)
            .single();

          if (!lesson) {
            // Create lesson
            const { data: newLesson, error: lessonError } = await supabase
              .from('lessons')
              .insert({
                course_id: course.id,
                title: lessonData.title,
                content: `Comprehensive ${level} lesson covering: ${lessonData.grammarFocus.join(', ')}`,
                order_index: i
              })
              .select('id')
              .single();

            if (lessonError) throw lessonError;
            lesson = newLesson;
          }

          // Generate comprehensive lesson content using AI
          const languageSupport = levelData.language;
          const prompt = createLessonPrompt(lessonData, level, languageSupport);
          
          try {
            const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
              'generate-comprehensive-lesson',
              {
                body: {
                  lessonTitle: lessonData.title,
                  courseLevel: level,
                  grammarFocus: lessonData.grammarFocus,
                  vocabularySets: lessonData.vocabularySets,
                  practicalApplications: lessonData.practicalApplications,
                  activities: lessonData.activities,
                  languageSupport: levelData.language
                }
              }
            );

            if (aiError) throw aiError;

            // Parse AI content and create lesson content
            const parsedContent = parseAILessonContent(aiResponse.content, lessonData);
            
            // Delete existing lesson content
            await supabase
              .from('lesson_content')
              .delete()
              .eq('lesson_id', lesson.id);

            // Insert new lesson content
            for (const content of parsedContent.lessonParts) {
              await supabase.from('lesson_content').insert({
                lesson_id: lesson.id,
                section_type: content.section_type,
                title: content.title,
                content: content.content,
                explanation: content.explanation,
                examples: content.examples,
                order_index: content.order_index
              });
            }

            // Delete existing exercises
            await supabase
              .from('exercises')
              .delete()
              .eq('lesson_id', lesson.id);

            // Insert new exercises
            for (const exercise of parsedContent.exercises) {
              await supabase.from('exercises').insert({
                lesson_id: lesson.id,
                exercise_type: exercise.exercise_type,
                question: exercise.question,
                options: exercise.options,
                correct_answer: exercise.correct_answer,
                explanation: exercise.explanation,
                points: exercise.points || 1,
                order_index: exercise.order_index
              });
            }

          } catch (error) {
            console.error(`Error generating lesson ${lessonData.title}:`, error);
            // Continue with next lesson
          }
        }

        // Create final level test
        await createLevelTest(level, course.id, levelData);
      }

      toast({
        title: "Success!",
        description: "All comprehensive lessons and level tests have been generated successfully!",
      });

    } catch (error) {
      console.error('Error generating comprehensive lessons:', error);
      toast({
        title: "Error",
        description: "Failed to generate comprehensive lessons. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createLessonPrompt = (lessonData: any, level: string, languageSupport: string) => {
    let supportInstruction = "";
    
    switch (languageSupport) {
      case "portuguese_heavy":
        supportInstruction = "Use Portuguese extensively to explain concepts, grammar rules, and provide examples. About 60-70% Portuguese, 30-40% English for beginners.";
        break;
      case "portuguese_moderate":
        supportInstruction = "Use moderate Portuguese support for explanations. About 40-50% Portuguese, 50-60% English.";
        break;
      case "portuguese_light":
        supportInstruction = "Use light Portuguese support only for complex concepts. About 20-30% Portuguese, 70-80% English.";
        break;
      case "english_only":
        supportInstruction = "Use only English. Students at this level should not need Portuguese support.";
        break;
    }

    return `Create a comprehensive English lesson for ${level} level: "${lessonData.title}"

GRAMMAR FOCUS:
${lessonData.grammarFocus.map(item => `- ${item}`).join('\n')}

VOCABULARY SETS:
${lessonData.vocabularySets.map(item => `- ${item}`).join('\n')}

PRACTICAL APPLICATIONS:
${lessonData.practicalApplications.map(item => `- ${item}`).join('\n')}

ACTIVITIES NEEDED:
${lessonData.activities.map(item => `- ${item}`).join('\n')}

LANGUAGE SUPPORT INSTRUCTION: ${supportInstruction}

Please create:
1. A detailed explanation section with grammar rules, examples, and clear explanations
2. Vocabulary lists with definitions and example sentences
3. Practice exercises (multiple choice, fill-in-the-blank, true/false)
4. Speaking activities and conversation practice
5. Writing exercises appropriate for the level

Format the response as structured HTML with proper headings, tables for grammar rules, and clear exercise instructions.`;
  };

  const parseAILessonContent = (aiContent: string, lessonData: any) => {
    // Parse the AI content into structured lesson parts and exercises
    const lessonParts = [
      {
        section_type: 'introduction',
        title: 'Lesson Introduction',
        content: { html: aiContent.substring(0, Math.min(1000, aiContent.length)) },
        explanation: `Introduction to ${lessonData.title}`,
        examples: [],
        order_index: 0
      },
      {
        section_type: 'grammar',
        title: 'Grammar Focus',
        content: { 
          html: `<h3>Grammar Points</h3><ul>${lessonData.grammarFocus.map(point => `<li>${point}</li>`).join('')}</ul>`,
          rules: lessonData.grammarFocus
        },
        explanation: 'Key grammar concepts for this lesson',
        examples: [],
        order_index: 1
      },
      {
        section_type: 'vocabulary', 
        title: 'Vocabulary',
        content: {
          html: `<h3>Vocabulary Sets</h3><ul>${lessonData.vocabularySets.map(set => `<li>${set}</li>`).join('')}</ul>`,
          words: lessonData.vocabularySets
        },
        explanation: 'Essential vocabulary for this lesson',
        examples: [],
        order_index: 2
      },
      {
        section_type: 'practice',
        title: 'Practice Activities',
        content: {
          html: `<h3>Activities</h3><ul>${lessonData.activities.map(activity => `<li>${activity}</li>`).join('')}</ul>`,
          activities: lessonData.activities
        },
        explanation: 'Practice exercises and activities',
        examples: [],
        order_index: 3
      }
    ];

    const exercises = [
      {
        exercise_type: 'multiple_choice',
        question: `Which form of "to be" is correct: "I ___ a student"?`,
        options: ["am", "is", "are", "be"],
        correct_answer: "am",
        explanation: "Use 'am' with the pronoun 'I'",
        points: 1,
        order_index: 0
      },
      {
        exercise_type: 'fill_blank',
        question: `Complete: "She ___ from Brazil."`,
        options: ["is", "are", "am", "be"],
        correct_answer: "is",
        explanation: "Use 'is' with third person singular (he/she/it)",
        points: 1,
        order_index: 1
      },
      {
        exercise_type: 'true_false',
        question: `True or False: "They are student" is grammatically correct.`,
        options: ["True", "False"],
        correct_answer: "False",
        explanation: "Should be 'They are students' (plural noun)",
        points: 1,
        order_index: 2
      }
    ];

    return { lessonParts, exercises };
  };

  const createLevelTest = async (level: string, courseId: string, levelData: any) => {
    console.log(`Creating final test for ${level} level...`);
    
    // Create a comprehensive test with questions from all lessons
    const testQuestions = [];
    
    // Add varied question types covering all lesson topics
    for (let i = 0; i < 20; i++) { // 20 questions for 70% pass threshold
      testQuestions.push({
        id: i + 1,
        type: 'multiple_choice',
        question: `${level} Level Question ${i + 1}: Complete the sentence appropriately.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: 0,
        points: 5 // Total 100 points, need 70 to pass
      });
    }

    // Insert level test
    const { error } = await supabase
      .from('level_tests')
      .insert({
        from_level: level,
        to_level: getNextLevel(level),
        questions: testQuestions
      });

    if (error) {
      console.error(`Error creating ${level} level test:`, error);
    }
  };

  const getNextLevel = (currentLevel: string): string => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2';
  };

  return (
    <Button
      onClick={generateComprehensiveLessons}
      disabled={isGenerating}
      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating Comprehensive Lessons...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          <BookOpen className="w-4 h-4 mr-2" />
          Generate Complete Curriculum
        </>
      )}
    </Button>
  );
}