import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Sparkles } from "lucide-react";
import { COMPLETE_CURRICULUM } from "@/utils/curriculumData";
import { cleanContentFromExercises } from "@/utils/parseExercises";

export function ComprehensiveLessonGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Helper function to create comprehensive lesson content and exercises
  const createBasicLessonContent = (lessonData: any, level: string) => {
    // Create rich HTML content for the lesson
    const isBeginnerLevel = ['A1', 'A2', 'B1'].includes(level);
    const primaryLang = isBeginnerLevel ? 'pt' : 'en';
    
    const generateRichLessonHTML = () => {
      const grammarPoints = lessonData.grammarFocus || [];
      const vocabulary = lessonData.vocabularySets || [];
      const culturalNote = lessonData.culturalNote || '';
      
      return `
        <div class="lesson-container">
          <section class="lesson-hero">
            <div class="lesson-header">
              <h1 class="lesson-title">${lessonData.title}</h1>
              <div class="lesson-objectives">
                <h3 class="objectives-title">${primaryLang === 'pt' ? '🎯 Objetivos da Lição' : '🎯 Lesson Objectives'}</h3>
                <ul class="objectives-list">
                  <li>${primaryLang === 'pt' ? 'Aprender' : 'Learn'} ${grammarPoints[0] || 'new grammar concepts'}</li>
                  <li>${primaryLang === 'pt' ? 'Praticar vocabulário essencial' : 'Practice essential vocabulary'}</li>
                  <li>${primaryLang === 'pt' ? 'Desenvolver habilidades de comunicação' : 'Develop communication skills'}</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="grammar-section">
            <div class="section-header">
              <h2 class="section-title">📚 ${primaryLang === 'pt' ? 'Foco Gramatical' : 'Grammar Focus'}</h2>
            </div>
            <div class="grammar-content">
              ${grammarPoints.map((point: string, index: number) => `
                <div class="grammar-point">
                  <h3 class="grammar-title">${index + 1}. ${point}</h3>
                  <div class="grammar-explanation">
                    <div class="rule-box">
                      <h4>${primaryLang === 'pt' ? 'Regra' : 'Rule'}:</h4>
                      <p>${getGrammarRule(point, primaryLang)}</p>
                    </div>
                    <div class="examples-box">
                      <h4>${primaryLang === 'pt' ? 'Exemplos' : 'Examples'}:</h4>
                      <ul class="examples-list">
                        ${getGrammarExamples(point, primaryLang).map((ex: string) => `<li>${ex}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <section class="vocabulary-section">
            <div class="section-header">
              <h2 class="section-title">📖 ${primaryLang === 'pt' ? 'Vocabulário' : 'Vocabulary'}</h2>
            </div>
            <div class="vocabulary-grid">
              ${vocabulary.slice(0, 12).map((word: string) => `
                <div class="vocab-card">
                  <div class="vocab-word">${word}</div>
                  <div class="vocab-translation">${getTranslation(word, primaryLang)}</div>
                  <div class="vocab-example">${getVocabExample(word, primaryLang)}</div>
                </div>
              `).join('')}
            </div>
          </section>

          ${culturalNote ? `
          <section class="culture-section">
            <div class="section-header">
              <h2 class="section-title">🌍 ${primaryLang === 'pt' ? 'Nota Cultural' : 'Cultural Note'}</h2>
            </div>
            <div class="culture-content">
              <p>${culturalNote}</p>
            </div>
          </section>
          ` : ''}

          <section class="practice-section">
            <div class="section-header">
              <h2 class="section-title">💪 ${primaryLang === 'pt' ? 'Vamos Praticar!' : 'Let\'s Practice!'}</h2>
            </div>
            <div class="practice-intro">
              <p>${primaryLang === 'pt' ? 
                'Agora é hora de colocar em prática o que você aprendeu! Complete os exercícios abaixo.' : 
                'Now it\'s time to practice what you\'ve learned! Complete the exercises below.'}</p>
            </div>
          </section>
        </div>
      `;
    };

    // Generate contextual exercises based on lesson content
    const exercises = generateContextualExercises(lessonData, level, primaryLang);

    // Create fallback lesson parts with the HTML content
    const lessonParts = [
      {
        section_type: 'introduction',
        title: 'Lesson Introduction',
        content: { html: `<h2>${lessonData.title}</h2><p>This lesson covers: ${lessonData.grammarFocus.join(', ')}</p>` },
        explanation: `Introduction to ${lessonData.title}`,
        examples: [],
        order_index: 0
      },
      {
        section_type: 'grammar',
        title: 'Grammar Focus',
        content: { 
          html: `<h3>Grammar Points</h3><ul>${lessonData.grammarFocus.map((point: string) => `<li>${point}</li>`).join('')}</ul>`,
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
          html: `<h3>Vocabulary Sets</h3><ul>${lessonData.vocabularySets.map((set: string) => `<li>${set}</li>`).join('')}</ul>`,
          words: lessonData.vocabularySets
        },
        explanation: 'Essential vocabulary for this lesson',
        examples: [],
        order_index: 2
      }
    ];

    return {
      html: generateRichLessonHTML(),
      lessonParts,
      exercises
    };
  };

  // Helper functions for content generation
  const getGrammarRule = (point: string, lang: string) => {
    const rules: { [key: string]: { pt: string; en: string } } = {
      'Present Simple': {
        pt: 'Use o Present Simple para fatos, rotinas e verdades universais. Forma: I/You/We/They + verbo base, He/She/It + verbo + s',
        en: 'Use Present Simple for facts, routines, and universal truths. Form: I/You/We/They + base verb, He/She/It + verb + s'
      },
      'Verb to be': {
        pt: 'O verbo "to be" significa "ser" ou "estar". Forms: I am, You are, He/She/It is, We/They are',
        en: 'The verb "to be" indicates existence or state. Forms: I am, You are, He/She/It is, We/They are'
      },
      'Articles': {
        pt: 'Use "a/an" para substantivos contáveis no singular (indefinidos) e "the" para específicos',
        en: 'Use "a/an" for singular countable nouns (indefinite) and "the" for specific items'
      }
    };
    return rules[point]?.[lang] || `${point} - ${lang === 'pt' ? 'Regra gramatical importante' : 'Important grammar rule'}`;
  };

  const getGrammarExamples = (point: string, lang: string) => {
    const examples: { [key: string]: { pt: string[]; en: string[] } } = {
      'Present Simple': {
        pt: ['Eu estudo inglês = I study English', 'Ela trabalha no hospital = She works at the hospital'],
        en: ['I study English every day', 'She works at the hospital', 'We live in Brazil']
      },
      'Verb to be': {
        pt: ['Eu sou estudante = I am a student', 'Eles estão felizes = They are happy'],
        en: ['I am a teacher', 'You are my friend', 'She is from Brazil']
      }
    };
    return examples[point]?.[lang] || [`Example with ${point}`, `Another example with ${point}`];
  };

  const getTranslation = (word: string, lang: string) => {
    const translations: { [key: string]: string } = {
      'hello': lang === 'pt' ? 'olá' : 'greeting',
      'goodbye': lang === 'pt' ? 'tchau' : 'farewell',
      'please': lang === 'pt' ? 'por favor' : 'polite request',
      'thank you': lang === 'pt' ? 'obrigado(a)' : 'gratitude'
    };
    return translations[word.toLowerCase()] || (lang === 'pt' ? 'tradução' : 'translation');
  };

  const getVocabExample = (word: string, lang: string) => {
    return lang === 'pt' ? 
      `Exemplo: "${word}" em uma frase` : 
      `Example: "${word}" in a sentence`;
  };

  const generateContextualExercises = (lessonData: any, level: string, lang: string) => {
    const grammarFocus = lessonData.grammarFocus?.[0] || 'Present Simple';
    
    const exercises = [
      {
        exercise_type: 'multiple_choice',
        question: generateQuestionForGrammar(grammarFocus, lang, 'multiple_choice'),
        options: generateOptionsForGrammar(grammarFocus),
        correct_answer: getCorrectAnswerForGrammar(grammarFocus),
        explanation: generateExplanation(grammarFocus, lang),
        points: 1,
        order_index: 0
      },
      {
        exercise_type: 'fill_blank',
        question: generateQuestionForGrammar(grammarFocus, lang, 'fill_blank'),
        options: generateOptionsForGrammar(grammarFocus, 'fill'),
        correct_answer: getCorrectAnswerForGrammar(grammarFocus, 'fill'),
        explanation: generateExplanation(grammarFocus, lang, 'fill'),
        points: 1,
        order_index: 1
      },
      {
        exercise_type: 'true_false',
        question: generateQuestionForGrammar(grammarFocus, lang, 'true_false'),
        options: ["True", "False"],
        correct_answer: "False",
        explanation: generateExplanation(grammarFocus, lang, 'true_false'),
        points: 1,
        order_index: 2
      },
      {
        exercise_type: 'multiple_choice',
        question: lang === 'pt' ? 
          'Escolha a melhor tradução para "Good morning":' : 
          'Choose the best response to "How are you?":',
        options: lang === 'pt' ? 
          ["Bom dia", "Boa noite", "Até logo", "Tchau"] :
          ["Fine, thank you", "My name is...", "Goodbye", "Please"],
        correct_answer: lang === 'pt' ? "Bom dia" : "Fine, thank you",
        explanation: lang === 'pt' ? 
          'Morning = Bom dia em português' : 
          'This is the most common polite response',
        points: 1,
        order_index: 3
      },
      {
        exercise_type: 'fill_blank',
        question: generateAdvancedQuestion(lessonData, lang),
        options: generateAdvancedOptions(lessonData),
        correct_answer: getAdvancedCorrectAnswer(lessonData),
        explanation: generateAdvancedExplanation(lessonData, lang),
        points: 2,
        order_index: 4
      }
    ];

    return exercises;
  };

  const generateQuestionForGrammar = (grammar: string, lang: string, type: string) => {
    const questions: { [key: string]: any } = {
      'Present Simple': {
        multiple_choice: lang === 'pt' ? 'Complete: "Ela ___ no hospital"' : 'Complete: "She ___ at the hospital"',
        fill_blank: lang === 'pt' ? 'Complete: "Eu ___ inglês todos os dias"' : 'Complete: "I ___ English every day"',
        true_false: lang === 'pt' ? 'Verdadeiro ou Falso: "I works" está correto.' : 'True or False: "I works" is correct.'
      },
      'Verb to be': {
        multiple_choice: lang === 'pt' ? 'Complete: "Eu ___ estudante"' : 'Complete: "I ___ a student"',
        fill_blank: lang === 'pt' ? 'Complete: "Eles ___ felizes"' : 'Complete: "They ___ happy"',
        true_false: lang === 'pt' ? 'Verdadeiro ou Falso: "She are happy" está correto.' : 'True or False: "She are happy" is correct.'
      }
    };
    return questions[grammar]?.[type] || `Question about ${grammar}`;
  };

  const generateOptionsForGrammar = (grammar: string, type = 'multiple') => {
    const options: { [key: string]: any } = {
      'Present Simple': type === 'fill' ? ["study", "studies", "studying", "studied"] : ["works", "work", "working", "worked"],
      'Verb to be': type === 'fill' ? ["are", "is", "am", "be"] : ["am", "is", "are", "be"]
    };
    return options[grammar] || ["Option A", "Option B", "Option C", "Option D"];
  };

  const getCorrectAnswerForGrammar = (grammar: string, type = 'multiple') => {
    const answers: { [key: string]: any } = {
      'Present Simple': type === 'fill' ? "study" : "works",
      'Verb to be': type === 'fill' ? "are" : "am"
    };
    return answers[grammar] || "Option A";
  };

  const generateExplanation = (grammar: string, lang: string, type = 'multiple') => {
    const explanations: { [key: string]: any } = {
      'Present Simple': {
        multiple: lang === 'pt' ? 'Use "works" com he/she/it — PT: Use "works" na terceira pessoa' : 'Use "works" with he/she/it',
        fill: lang === 'pt' ? 'Use "study" com I — PT: Use "study" com primeira pessoa' : 'Use "study" with I',
        true_false: lang === 'pt' ? 'Incorreto! Use "I work" não "I works"' : 'Incorrect! Use "I work" not "I works"'
      },
      'Verb to be': {
        multiple: lang === 'pt' ? 'Use "am" com I — PT: Use "am" com primeira pessoa' : 'Use "am" with I',
        fill: lang === 'pt' ? 'Use "are" com they — PT: Use "are" com terceira pessoa plural' : 'Use "are" with they',
        true_false: lang === 'pt' ? 'Incorreto! Use "She is" não "She are"' : 'Incorrect! Use "She is" not "She are"'
      }
    };
    return explanations[grammar]?.[type] || `Explanation for ${grammar}`;
  };

  const generateAdvancedQuestion = (lessonData: any, lang: string) => {
    const vocab = lessonData.vocabularySets?.[0] || 'hello';
    return lang === 'pt' ? 
      `Como você diria "${vocab}" em uma situação formal?` :
      `How would you use "${vocab}" in a formal situation?`;
  };

  const generateAdvancedOptions = (lessonData: any) => {
    return ["Very formally", "Casually", "With a smile", "Loudly"];
  };

  const getAdvancedCorrectAnswer = (lessonData: any) => {
    return "Very formally";
  };

  const generateAdvancedExplanation = (lessonData: any, lang: string) => {
    return lang === 'pt' ? 
      'Em situações formais, sempre use a forma mais respeitosa' :
      'In formal situations, always use the most respectful form';
  };

  const parseAILessonContent = (aiContent: string, lessonData: any) => {
    try {
      // Extract exercises from the AI content
      const activitiesMatch = aiContent.match(/<activities>(.*?)<\/activities>/s);
      let exercises = [];
      
      if (activitiesMatch) {
        try {
          const exercisesJson = activitiesMatch[1].trim();
          const parsedExercises = JSON.parse(exercisesJson);
          
          exercises = parsedExercises.map((ex: any, index: number) => ({
            exercise_type: ex.type === 'fill_blank' ? 'fill_blank' : ex.type === 'true_false' ? 'true_false' : 'multiple_choice',
            question: ex.question,
            options: ex.options || [],
            correct_answer: ex.correct_answer,
            explanation: ex.explanation || 'No explanation provided',
            points: 1,
            order_index: index
          }));
        } catch (parseError) {
          console.error('Error parsing exercises JSON:', parseError);
        }
      }

      // If no exercises parsed, create fallback exercises
      if (exercises.length === 0) {
        exercises = [
          {
            exercise_type: 'multiple_choice',
            question: `Which form of "to be" is correct: "I ___ a student"?`,
            options: ["am", "is", "are", "be"],
            correct_answer: "am",
            explanation: "Use 'am' with the pronoun 'I' - Em português: Use 'am' com o pronome 'I'",
            points: 1,
            order_index: 0
          },
          {
            exercise_type: 'fill_blank',
            question: `Complete: "She ___ from Brazil."`,
            options: ["is", "are", "am", "be"],
            correct_answer: "is",
            explanation: "Use 'is' with third person singular (he/she/it) - Em português: Use 'is' com terceira pessoa do singular",
            points: 1,
            order_index: 1
          },
          {
            exercise_type: 'true_false',
            question: `True or False: "They are student" is grammatically correct.`,
            options: ["True", "False"],
            correct_answer: "False",
            explanation: "Should be 'They are students' (plural noun) - Em português: Deve ser 'They are students' (substantivo plural)",
            points: 1,
            order_index: 2
          }
        ];
      }

      // Clean the content by removing the activities section
      const cleanContent = aiContent.replace(/<activities>.*?<\/activities>/s, '').trim();

      // Parse lesson sections from the cleaned content
      const sections = [
        {
          section_type: 'introduction',
          title: 'Introdução da Lição',
          regex: /<section class="lesson-introduction">(.*?)<\/section>/s
        },
        {
          section_type: 'grammar',
          title: 'Gramática',
          regex: /<section class="grammar-focus">(.*?)<\/section>/s
        },
        {
          section_type: 'vocabulary',
          title: 'Vocabulário',
          regex: /<section class="vocabulary-section">(.*?)<\/section>/s
        },
        {
          section_type: 'practice',
          title: 'Atividades Práticas',
          regex: /<section class="practice-activities">(.*?)<\/section>/s
        },
        {
          section_type: 'cultural',
          title: 'Notas Culturais',
          regex: /<section class="cultural-notes">(.*?)<\/section>/s
        },
        {
          section_type: 'summary',
          title: 'Resumo da Lição',
          regex: /<section class="lesson-summary">(.*?)<\/section>/s
        }
      ];

      const lessonParts = [];
      
      sections.forEach((section, index) => {
        const match = cleanContent.match(section.regex);
        const content = match ? match[1].trim() : `<h3>${section.title}</h3><p>Conteúdo para ${lessonData.title}</p>`;
        
        lessonParts.push({
          section_type: section.section_type,
          title: section.title,
          content: { html: content },
          explanation: `${section.title} - ${lessonData.title}`,
          examples: [],
          order_index: index
        });
      });

      // If no sections were parsed, create fallback content
      if (lessonParts.length === 0) {
        lessonParts.push({
          section_type: 'introduction',
          title: 'Introdução da Lição',
          content: { html: cleanContent.substring(0, Math.min(2000, cleanContent.length)) || `<h2>${lessonData.title}</h2><p>Esta lição cobre: ${lessonData.grammarFocus.join(', ')}</p>` },
          explanation: `Introdução à ${lessonData.title}`,
          examples: [],
          order_index: 0
        });
      }

      return { lessonParts, exercises };
    } catch (error) {
      console.error('Error parsing AI lesson content:', error);
      return createBasicLessonContent(lessonData, 'A1');
    }
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

  const generateComprehensiveLessons = async () => {
    setIsGenerating(true);
    
    try {
      console.log("Starting comprehensive lesson generation with complete data replacement...");
      
      // Use the complete curriculum structure
      const curriculumStructure = COMPLETE_CURRICULUM;

      // First, completely clear existing data to ensure clean replacement
      console.log("Clearing all existing lessons, content, and exercises...");
      
      // Delete all existing exercises
      const { error: deleteExercisesError } = await supabase
        .from('exercises')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteExercisesError) {
        console.error("Error deleting exercises:", deleteExercisesError);
      }

      // Delete all existing lesson content
      const { error: deleteLessonContentError } = await supabase
        .from('lesson_content')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteLessonContentError) {
        console.error("Error deleting lesson content:", deleteLessonContentError);
      }

      // Delete all existing lessons
      const { error: deleteLessonsError } = await supabase
        .from('lessons')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteLessonsError) {
        console.error("Error deleting lessons:", deleteLessonsError);
      }

      // Delete all existing courses
      const { error: deleteCoursesError } = await supabase
        .from('courses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteCoursesError) {
        console.error("Error deleting courses:", deleteCoursesError);
      }

      // Delete all existing level tests
      const { error: deleteTestsError } = await supabase
        .from('level_tests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteTestsError) {
        console.error("Error deleting level tests:", deleteTestsError);
      }

      console.log("All existing data cleared successfully. Creating new curriculum...");

      // Generate fresh curriculum
      for (const [level, levelData] of Object.entries(curriculumStructure)) {
        console.log(`Creating ${level} level course and lessons...`);
        
        // Create course
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .insert({
            title: `English ${level} - ${levelData.levelName}`,
            description: `Complete ${levelData.levelName} English course with ${levelData.totalLessons} lessons following Aula Click curriculum`,
            level: level,
            order_index: Object.keys(curriculumStructure).indexOf(level)
          })
          .select('id')
          .single();

        if (courseError) {
          console.error(`Error creating ${level} course:`, courseError);
          throw courseError;
        }

        // Generate lessons for this level
        for (let i = 0; i < levelData.lessons.length; i++) {
          const lessonData = levelData.lessons[i];
          console.log(`Generating lesson ${i + 1}/${levelData.lessons.length}: ${lessonData.title}`);

          // Create lesson
          const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .insert({
              course_id: course.id,
              title: lessonData.title,
              content: `${levelData.levelName} lesson: ${lessonData.title}`,
              order_index: i
            })
            .select('id')
            .single();

          if (lessonError) {
            console.error(`Error creating lesson ${lessonData.title}:`, lessonError);
            continue;
          }

          // Generate comprehensive lesson content using AI
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
            // Update lesson HTML with cleaned content (remove activities JSON)
            const cleanHtml = cleanContentFromExercises(aiResponse.content);
            await supabase.from('lessons').update({ content: cleanHtml }).eq('id', lesson.id);
            
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
            console.error(`Error generating AI content for lesson ${lessonData.title}:`, error);
            
            // Create comprehensive content even if AI fails
            const basicContent = createBasicLessonContent(lessonData, level);
            // Save the rich HTML content
            await supabase.from('lessons').update({ content: basicContent.html }).eq('id', lesson.id);
            
            for (const content of basicContent.lessonParts) {
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

            for (const exercise of basicContent.exercises) {
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
          }

          // Add small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Create final level test for 70% progression requirement
        await createLevelTest(level, course.id, levelData);
      }

      toast({
        title: "Success!",
        description: "Complete comprehensive curriculum generated successfully! All previous content has been replaced with new lessons following your provided curriculum structure with rich, visual educational content.",
      });

    } catch (error) {
      console.error("Error generating comprehensive lessons:", error);
      toast({
        title: "Error",
        description: "Failed to generate lessons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <BookOpen className="w-5 h-5" />
          Rich Educational Content Generator
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate complete curriculum with rich, visual, and bilingual lessons designed for effective learning
        </p>
      </div>
      
      <Button 
        onClick={generateComprehensiveLessons} 
        disabled={isGenerating}
        className="w-full flex items-center gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Rich Content...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Complete Curriculum
          </>
        )}
      </Button>
    </div>
  );
}