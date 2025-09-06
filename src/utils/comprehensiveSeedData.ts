import { supabase } from "@/integrations/supabase/client";

export const seedComprehensiveCourseData = async () => {
  try {
    // Check if lesson_content data already exists
    const { data: existingContent } = await supabase
      .from('lesson_content')
      .select('id')
      .limit(1);

    if (existingContent && existingContent.length > 0) {
      console.log('Comprehensive course data already exists, skipping seed...');
      return;
    }

    // Get existing courses and lessons
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .order('order_index');

    const { data: lessons } = await supabase
      .from('lessons')
      .select('*');

    if (!courses || !lessons) {
      throw new Error('Base courses and lessons must exist first');
    }

    // Comprehensive lesson content data
    const lessonContentData = [
      // A1 Level - Greetings and Introductions
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        section_type: 'grammar',
        title: 'Basic Sentence Structure',
        explanation: 'Learn the fundamental structure of English sentences using the Subject + Verb + Object pattern.',
        examples: [
          { english: "I am John.", portuguese: "Eu sou John.", type: "statement" },
          { english: "You are nice.", portuguese: "Você é legal.", type: "statement" },
          { english: "She is my friend.", portuguese: "Ela é minha amiga.", type: "statement" }
        ],
        content: {
          rules: [
            "English sentences follow Subject + Verb + Object order",
            "The verb 'to be' changes form: I am, You are, He/She/It is",
            "Always use a subject pronoun in English sentences"
          ],
          common_mistakes: [
            "Don't say 'I John' - say 'I am John'",
            "Don't skip the verb 'to be'",
            "Remember 'I am' not 'I is'"
          ]
        },
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        section_type: 'vocabulary',
        title: 'Essential Greeting Words',
        explanation: 'Master the most important words for greeting people and basic politeness.',
        examples: [
          { word: "Hello", pronunciation: "/həˈloʊ/", definition: "A greeting used at any time", usage: "Hello! How are you?" },
          { word: "Please", pronunciation: "/pliːz/", definition: "Used to make polite requests", usage: "Please help me." },
          { word: "Thank you", pronunciation: "/θæŋk juː/", definition: "Expression of gratitude", usage: "Thank you for your help." },
          { word: "Excuse me", pronunciation: "/ɪkˈskjuːz miː/", definition: "Used to get attention politely", usage: "Excuse me, where is the bathroom?" }
        ],
        content: {
          categories: {
            greetings: ["Hello", "Hi", "Good morning", "Good afternoon", "Good evening"],
            politeness: ["Please", "Thank you", "Excuse me", "Sorry", "You're welcome"],
            introductions: ["My name is", "I am", "Nice to meet you", "How are you?"]
          },
          cultural_notes: "In English-speaking countries, eye contact and a smile are important when greeting someone."
        },
        order_index: 2
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        section_type: 'reading',
        title: 'A Simple Conversation',
        explanation: 'Read and understand a basic conversation between two people meeting for the first time.',
        content: {
          text: "Sarah walks into a coffee shop and sees a man sitting alone at a table. She wants to practice her English.\n\nSarah: Excuse me, is this seat taken?\nJohn: No, please sit down.\nSarah: Thank you. My name is Sarah.\nJohn: Nice to meet you, Sarah. I'm John.\nSarah: Nice to meet you too, John. Are you from here?\nJohn: Yes, I live here. What about you?\nSarah: I'm from Brazil. I'm here to study English.\nJohn: That's great! Welcome to our city.",
          questions: [
            { question: "Where does Sarah meet John?", answer: "In a coffee shop", type: "comprehension" },
            { question: "What is Sarah's nationality?", answer: "Brazilian", type: "detail" },
            { question: "Why is Sarah in the city?", answer: "To study English", type: "purpose" }
          ],
          vocabulary_in_context: [
            { word: "seat", definition: "a place to sit", sentence: "Is this seat taken?" },
            { word: "taken", definition: "occupied/not available", sentence: "Is this seat taken?" }
          ]
        },
        order_index: 3
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        section_type: 'speaking',
        title: 'Practice Introductions',
        explanation: 'Practice introducing yourself and others in different situations.',
        content: {
          exercises: [
            {
              type: "role_play",
              scenario: "Meeting a new classmate",
              your_role: "You are a student starting a new English class",
              prompt: "Introduce yourself to the person sitting next to you. Include your name, where you're from, and why you're learning English."
            },
            {
              type: "pronunciation",
              focus: "Question intonation",
              phrases: ["What's your name?", "Where are you from?", "How are you?"],
              tip: "Questions in English typically have rising intonation at the end."
            }
          ],
          conversation_starters: [
            "Hi, I don't think we've met. I'm...",
            "Excuse me, are you in the English class too?",
            "Hello! I'm new here. Could you tell me your name?"
          ]
        },
        order_index: 4
      },

      // A2 Level - Present Simple Tense
      {
        lesson_id: lessons.find(l => l.title === "Present Simple Tense")?.id,
        section_type: 'grammar',
        title: 'Present Simple: Formation and Uses',
        explanation: 'Master the Present Simple tense for habits, routines, facts, and permanent situations.',
        examples: [
          { english: "I work in an office.", portuguese: "Eu trabalho em um escritório.", type: "positive" },
          { english: "She doesn't like coffee.", portuguese: "Ela não gosta de café.", type: "negative" },
          { english: "Do you speak English?", portuguese: "Você fala inglês?", type: "question" }
        ],
        content: {
          formation: {
            positive: "Subject + Verb (+ s/es for he/she/it)",
            negative: "Subject + don't/doesn't + base verb",
            question: "Do/Does + Subject + base verb?"
          },
          third_person_rules: [
            "Add 's' to most verbs: work → works",
            "Add 'es' to verbs ending in s, x, ch, sh, o: watch → watches",
            "Change 'y' to 'ies': study → studies",
            "Irregular: have → has, go → goes"
          ],
          uses: [
            "Daily routines: I wake up at 7 AM",
            "General facts: Water boils at 100°C",
            "Permanent situations: She lives in London",
            "Habits: He drinks coffee every morning"
          ]
        },
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Present Simple Tense")?.id,
        section_type: 'vocabulary',
        title: 'Daily Routine Vocabulary',
        explanation: 'Learn essential verbs and expressions to describe your daily activities.',
        examples: [
          { word: "wake up", definition: "stop sleeping", usage: "I wake up at 6 AM every day." },
          { word: "brush teeth", definition: "clean teeth with a toothbrush", usage: "She brushes her teeth twice a day." },
          { word: "commute", definition: "travel to work", usage: "He commutes by train." },
          { word: "household chores", definition: "cleaning tasks at home", usage: "I do household chores on weekends." }
        ],
        content: {
          morning_routine: ["wake up", "get up", "shower", "brush teeth", "get dressed", "have breakfast"],
          work_activities: ["start work", "attend meetings", "check emails", "take a break", "finish work"],
          evening_routine: ["cook dinner", "watch TV", "do homework", "read a book", "go to bed"],
          frequency_adverbs: ["always", "usually", "often", "sometimes", "rarely", "never"]
        },
        order_index: 2
      },

      // B1 Level - Present Perfect
      {
        lesson_id: lessons.find(l => l.title === "Present Perfect Tense")?.id,
        section_type: 'grammar',
        title: 'Present Perfect: Connecting Past and Present',
        explanation: 'Understand how Present Perfect links past actions to the present moment.',
        examples: [
          { english: "I have lived here for five years.", portuguese: "Eu moro aqui há cinco anos.", type: "duration" },
          { english: "She has visited Paris three times.", portuguese: "Ela visitou Paris três vezes.", type: "experience" },
          { english: "Have you finished your homework?", portuguese: "Você terminou sua lição de casa?", type: "completion" }
        ],
        content: {
          formation: "have/has + past participle",
          past_participles: {
            regular: "worked, played, studied, lived",
            irregular: "been, done, seen, eaten, written, spoken"
          },
          time_expressions: {
            for: "duration (for 2 hours, for a week)",
            since: "starting point (since Monday, since 2020)",
            already: "sooner than expected",
            yet: "until now (negatives and questions)",
            just: "very recently",
            ever: "at any time in life",
            never: "at no time"
          },
          vs_past_simple: "Present Perfect = still relevant now; Past Simple = completed and finished"
        },
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Present Perfect Tense")?.id,
        section_type: 'reading',
        title: 'Life Experiences',
        explanation: 'Read about different people\'s life experiences using Present Perfect.',
        content: {
          text: "Maria is 25 years old and has had an interesting life so far. She has traveled to fifteen different countries and has learned to speak four languages fluently. She has never been to Australia, but she has always wanted to visit Sydney.\n\nLast year, she has started working for an international company. Since then, she has met people from all over the world. She has made many new friends and has improved her English significantly.\n\nMaria has also taken up new hobbies recently. She has joined a photography club and has taken hundreds of beautiful pictures. She has never shown her photos in an exhibition, but her friends have encouraged her to try.\n\nHer biggest achievement has been completing a marathon. She has trained for six months and has finally reached her goal. She has already signed up for another race next year.",
          error_correction: [
            {
              error: "Last year, she has started working",
              correction: "Last year, she started working",
              explanation: "Use Past Simple with specific past time (last year)"
            }
          ],
          questions: [
            { question: "How many countries has Maria visited?", answer: "Fifteen", type: "detail" },
            { question: "What new hobby has she taken up?", answer: "Photography", type: "comprehension" },
            { question: "Has she ever been to Australia?", answer: "No, she has never been to Australia", type: "experience" }
          ]
        },
        order_index: 2
      },

      // B2 Level - Conditionals
      {
        lesson_id: lessons.find(l => l.title === "Conditional Sentences")?.id,
        section_type: 'grammar',
        title: 'The Four Types of Conditionals',
        explanation: 'Master all conditional forms to express different degrees of possibility and time.',
        examples: [
          { type: "zero", example: "If you heat ice, it melts.", usage: "scientific facts" },
          { type: "first", example: "If it rains, I will stay home.", usage: "real future possibility" },
          { type: "second", example: "If I won the lottery, I would travel the world.", usage: "hypothetical present" },
          { type: "third", example: "If I had studied harder, I would have passed.", usage: "hypothetical past" }
        ],
        content: {
          structures: {
            zero: "If + present simple, present simple",
            first: "If + present simple, will + infinitive",
            second: "If + past simple, would + infinitive", 
            third: "If + past perfect, would have + past participle"
          },
          alternatives: {
            unless: "Unless = if not",
            provided_that: "Provided that = if (formal)",
            as_long_as: "As long as = if (condition)"
          },
          mixed_conditionals: "Combine different time periods: If I had studied medicine (past), I would be a doctor now (present)"
        },
        order_index: 1
      },

      // C1 Level - Advanced Grammar
      {
        lesson_id: lessons.find(l => l.title === "Advanced Grammar Structures")?.id,
        section_type: 'grammar',
        title: 'Inversion and Emphasis',
        explanation: 'Use advanced structures for emphasis and sophisticated writing.',
        examples: [
          { structure: "Negative inversion", example: "Never have I seen such beauty.", normal: "I have never seen such beauty." },
          { structure: "Only inversion", example: "Only when he arrived did we start.", normal: "We started only when he arrived." },
          { structure: "Conditional inversion", example: "Had I known, I would have helped.", normal: "If I had known, I would have helped." }
        ],
        content: {
          inversion_triggers: [
            "Negative adverbs: never, rarely, seldom, hardly",
            "Only expressions: only when, only if, only after",
            "So/Such: So beautiful was the sunset that...",
            "Conditional: Had/Were/Should at the beginning"
          ],
          cleft_sentences: {
            it_cleft: "It was John who broke the window (not Mary)",
            wh_cleft: "What I need is a vacation (not money)",
            pseudo_cleft: "The thing that annoys me is noise"
          },
          emphasis_techniques: [
            "Fronting: Beautiful though she was...",
            "Repetition for effect: Never, never again",
            "Ellipsis: Some people like tea, others coffee"
          ]
        },
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Advanced Grammar Structures")?.id,
        section_type: 'vocabulary',
        title: 'Academic and Formal Vocabulary',
        explanation: 'Build sophisticated vocabulary for academic and professional contexts.',
        examples: [
          { word: "substantial", definition: "large in amount or degree", usage: "There has been a substantial increase in sales." },
          { word: "inherent", definition: "existing as a basic quality", usage: "Risk is inherent in any investment." },
          { word: "analogous", definition: "similar in some way", usage: "The situation is analogous to what happened last year." }
        ],
        content: {
          academic_verbs: ["constitute", "demonstrate", "establish", "facilitate", "implement", "indicate"],
          formal_adjectives: ["substantial", "significant", "considerable", "predominant", "inherent", "concurrent"],
          discourse_markers: ["furthermore", "nevertheless", "consequently", "notwithstanding", "henceforth"],
          nominalizations: {
            "verb_to_noun": "analyze → analysis, conclude → conclusion, investigate → investigation"
          },
          collocations: {
            "strong": ["strong argument", "strong correlation", "strong evidence"],
            "deep": ["deep analysis", "deep understanding", "deep concern"]
          }
        },
        order_index: 2
      },

      // C2 Level - Nuanced English
      {
        lesson_id: lessons.find(l => l.title === "Mastering Nuanced English")?.id,
        section_type: 'vocabulary',
        title: 'Subtle Distinctions and Connotations',
        explanation: 'Master the fine distinctions that separate good English from exceptional English.',
        examples: [
          { distinction: "childish vs childlike", childish: "immature (negative)", childlike: "innocent wonder (positive)" },
          { distinction: "economic vs economical", economic: "relating to economy", economical: "cost-effective" },
          { distinction: "historic vs historical", historic: "significant in history", historical: "from the past" }
        ],
        content: {
          nuanced_pairs: {
            "affect_effect": "Affect (verb) influences; Effect (noun) is the result",
            "imply_infer": "Speaker implies; Listener infers", 
            "comprise_compose": "The whole comprises parts; Parts compose the whole"
          },
          register_differences: {
            formal: ["endeavor", "ascertain", "commence", "terminate"],
            neutral: ["try", "find out", "start", "end"],
            informal: ["give it a shot", "figure out", "get going", "wrap up"]
          },
          connotations: {
            positive: "slender, vintage, assertive, determined",
            negative: "skinny, old, aggressive, stubborn",
            neutral: "thin, aged, direct, persistent"
          },
          idiomatic_sophistication: [
            "cut to the chase → get to the point directly",
            "a double-edged sword → something with both advantages and disadvantages",
            "the elephant in the room → an obvious problem everyone ignores"
          ]
        },
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Mastering Nuanced English")?.id,
        section_type: 'writing',
        title: 'Advanced Writing Techniques',
        explanation: 'Develop sophisticated writing skills for academic and professional success.',
        content: {
          paragraph_structure: {
            topic_sentence: "Clear statement of main idea",
            supporting_sentences: "Evidence, examples, analysis", 
            concluding_sentence: "Summary or transition"
          },
          cohesion_devices: {
            reference: "this, that, these, those, such",
            substitution: "one, ones, so, not",
            ellipsis: "omitting repeated words",
            conjunction: "and, but, however, therefore"
          },
          academic_style: [
            "Use passive voice for objectivity: 'It was observed that...'",
            "Hedge claims: 'It appears that...', 'The evidence suggests...'",
            "Use nominalization: 'The implementation of the policy' vs 'implementing the policy'",
            "Avoid personal pronouns in formal writing"
          ],
          revision_checklist: [
            "Is the thesis clear and arguable?",
            "Does each paragraph support the thesis?",
            "Are transitions smooth and logical?",
            "Is the language precise and appropriate?",
            "Are sources properly cited?"
          ]
        },
        order_index: 2
      }
    ];

    // Insert lesson content
    const { error: contentError } = await supabase
      .from('lesson_content')
      .insert(lessonContentData);

    if (contentError) throw contentError;

    // Enhanced exercises data with multiple types
    const enhancedExercisesData = [
      // A1 Level exercises
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        exercise_type: 'multiple_choice',
        question: "What is the most appropriate response to 'Good morning!'?",
        options: ["Good night!", "Good morning!", "Goodbye!", "Good afternoon!"],
        correct_answer: "Good morning!",
        explanation: "You should respond with the same greeting when someone says 'Good morning' to you.",
        points: 1,
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        exercise_type: 'fill_blank',
        question: "Complete the introduction: 'Hello, my name _____ Sarah.'",
        options: ["is", "am", "are", "be"],
        correct_answer: "is",
        explanation: "Use 'is' with 'my name' because 'name' is third person singular.",
        points: 2,
        order_index: 2
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        exercise_type: 'speaking',
        question: "Record yourself introducing yourself to a new classmate. Include your name, where you're from, and one hobby.",
        options: [],
        correct_answer: "Sample: Hi! My name is Maria. I'm from Brazil, and I love reading books. What's your name?",
        explanation: "A good introduction should be friendly, include basic information, and end with a question to continue the conversation.",
        points: 5,
        order_index: 3
      },

      // A2 Level exercises
      {
        lesson_id: lessons.find(l => l.title === "Present Simple Tense")?.id,
        exercise_type: 'fill_blank',
        question: "She _____ (work) in a hospital.",
        options: ["work", "works", "working", "worked"],
        correct_answer: "works",
        explanation: "Add 's' to the verb with he/she/it in Present Simple positive sentences.",
        points: 2,
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Present Simple Tense")?.id,
        exercise_type: 'true_false',
        question: "We use Present Simple to talk about habits and routines. True or False?",
        options: ["True", "False"],
        correct_answer: "True",
        explanation: "Present Simple is commonly used for habits, routines, and regular activities.",
        points: 1,
        order_index: 2
      },
      {
        lesson_id: lessons.find(l => l.title === "Past Simple Tense")?.id,
        exercise_type: 'multiple_choice',
        question: "What is the past form of 'eat'?",
        options: ["eated", "ate", "eaten", "eating"],
        correct_answer: "ate",
        explanation: "'Eat' is an irregular verb. Its past form is 'ate' and past participle is 'eaten'.",
        points: 2,
        order_index: 1
      },

      // B1 Level exercises
      {
        lesson_id: lessons.find(l => l.title === "Present Perfect Tense")?.id,
        exercise_type: 'fill_blank',
        question: "I _____ (live) here _____ five years.",
        options: ["have lived, for", "lived, since", "have lived, since", "live, for"],
        correct_answer: "have lived, for",
        explanation: "Use Present Perfect for duration continuing to now, and 'for' with periods of time.",
        points: 3,
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Present Perfect Tense")?.id,
        exercise_type: 'essay',
        question: "Write a paragraph (80-100 words) about your life experiences using Present Perfect tense. Include at least 5 different Present Perfect sentences.",
        options: [],
        correct_answer: "Sample: I have had many interesting experiences in my life. I have traveled to several countries and have learned different cultures. I have studied English for three years and have made significant progress. I have never been to Europe, but I have always wanted to visit Paris. Recently, I have started a new hobby - photography. I have taken many beautiful pictures and have shared them with my friends.",
        explanation: "Good use of Present Perfect for experiences, duration, and recent activities.",
        points: 10,
        order_index: 2
      },

      // B2 Level exercises
      {
        lesson_id: lessons.find(l => l.title === "Conditional Sentences")?.id,
        exercise_type: 'multiple_choice',
        question: "If I _____ you, I _____ apologize immediately.",
        options: ["am, will", "was, will", "were, would", "am, would"],
        correct_answer: "were, would",
        explanation: "Second conditional uses past simple in the if-clause and would + infinitive in the main clause. Use 'were' for all persons with 'if I were...'",
        points: 3,
        order_index: 1
      },

      // C1 Level exercises
      {
        lesson_id: lessons.find(l => l.title === "Advanced Grammar Structures")?.id,
        exercise_type: 'fill_blank',
        question: "Rewrite with inversion: 'I have never seen such a beautiful sunset.' → '_____ have I seen such a beautiful sunset.'",
        options: ["Never", "Not", "Rarely", "Seldom"],
        correct_answer: "Never",
        explanation: "With negative inversion, move the negative adverb to the beginning and invert subject and auxiliary verb.",
        points: 4,
        order_index: 1
      },

      // C2 Level exercises  
      {
        lesson_id: lessons.find(l => l.title === "Mastering Nuanced English")?.id,
        exercise_type: 'multiple_choice',
        question: "Choose the correct word: The old building has great _____ value. (meaning: important in history)",
        options: ["historical", "historic", "history", "historian"],
        correct_answer: "historic",
        explanation: "'Historic' means important in history or having great significance. 'Historical' means relating to or from the past.",
        points: 3,
        order_index: 1
      }
    ];

    // Insert enhanced exercises
    const { error: exercisesError } = await supabase
      .from('exercises')
      .insert(enhancedExercisesData);

    if (exercisesError) throw exercisesError;

    console.log('Comprehensive course data seeded successfully!');
    return { success: true, message: 'Comprehensive course content created successfully!' };

  } catch (error) {
    console.error('Error seeding comprehensive course data:', error);
    throw error;
  }
};