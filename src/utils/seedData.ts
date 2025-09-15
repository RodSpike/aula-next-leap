import { supabase } from "@/integrations/supabase/client";

export const seedCourseData = async () => {
  try {
    // Check if data already exists
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (existingCourses && existingCourses.length > 0) {
      console.log('Course data already exists, skipping seed...');
      return;
    }

    // English courses data
    const coursesData = [
      {
        title: "A1 Elementary English",
        description: "Basic English for absolute beginners. Learn essential vocabulary, simple grammar, and everyday expressions.",
        level: "A1",
        order_index: 1
      },
      {
        title: "A2 Pre-Intermediate English", 
        description: "Build on basic English skills with more complex grammar structures and expanded vocabulary.",
        level: "A2",
        order_index: 2
      },
      {
        title: "B1 Intermediate English",
        description: "Develop confidence in English with practical communication skills for work and travel.",
        level: "B1", 
        order_index: 3
      },
      {
        title: "B2 Upper-Intermediate English",
        description: "Master advanced grammar and vocabulary for academic and professional contexts.",
        level: "B2",
        order_index: 4
      },
      {
        title: "C1 Advanced English",
        description: "Achieve fluency with sophisticated language skills for complex communication.",
        level: "C1",
        order_index: 5
      },
      {
        title: "C2 Proficiency English",
        description: "Master native-level English with advanced academic and professional language skills.",
        level: "C2",
        order_index: 6
      }
    ];

    // Insert courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .insert(coursesData)
      .select();

    if (coursesError) throw coursesError;

    // Lessons data for each level
    const lessonsData = [
      // A1 Lessons
      {
        course_id: courses.find(c => c.level === 'A1')?.id,
        title: "Greetings and Introductions",
        content: `<h2>Welcome to A1 English!</h2>
        <p>In this lesson, you'll learn the most basic and essential greetings and how to introduce yourself in English.</p>
        
        <h3>Basic Greetings</h3>
        <ul>
          <li><strong>Hello</strong> - General greeting for any time</li>
          <li><strong>Good morning</strong> - Used until 12:00 PM</li>
          <li><strong>Good afternoon</strong> - Used from 12:00 PM to 6:00 PM</li>
          <li><strong>Good evening</strong> - Used after 6:00 PM</li>
          <li><strong>Hi</strong> - Informal greeting</li>
        </ul>

        <h3>Introducing Yourself</h3>
        <p>When meeting someone new, use these phrases:</p>
        <ul>
          <li><strong>My name is...</strong> (formal)</li>
          <li><strong>I'm...</strong> (informal)</li>
          <li><strong>Nice to meet you</strong> - Response when meeting someone</li>
          <li><strong>Nice to meet you too</strong> - Reply to "Nice to meet you"</li>
        </ul>

        <h3>Asking About Names</h3>
        <ul>
          <li><strong>What's your name?</strong> (informal)</li>
          <li><strong>What is your name?</strong> (formal)</li>
          <li><strong>May I ask your name?</strong> (very formal)</li>
        </ul>

        <h3>Example Conversation</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Person A:</strong> Hello! My name is Sarah. What's your name?</p>
          <p><strong>Person B:</strong> Hi Sarah! I'm John. Nice to meet you.</p>
          <p><strong>Person A:</strong> Nice to meet you too, John!</p>
        </div>`,
        order_index: 1
      },
      {
        course_id: courses.find(c => c.level === 'A1')?.id,
        title: "Numbers and Basic Information",
        content: `<h2>Numbers and Personal Information</h2>
        <p>Learn essential numbers and how to share basic personal information.</p>
        
        <h3>Numbers 0-20</h3>
        <ul>
          <li>0 - zero</li>
          <li>1 - one</li>
          <li>2 - two</li>
          <li>3 - three</li>
          <li>4 - four</li>
          <li>5 - five</li>
          <li>6 - six</li>
          <li>7 - seven</li>
          <li>8 - eight</li>
          <li>9 - nine</li>
          <li>10 - ten</li>
          <li>11 - eleven</li>
          <li>12 - twelve</li>
          <li>13 - thirteen</li>
          <li>14 - fourteen</li>
          <li>15 - fifteen</li>
          <li>16 - sixteen</li>
          <li>17 - seventeen</li>
          <li>18 - eighteen</li>
          <li>19 - nineteen</li>
          <li>20 - twenty</li>
        </ul>

        <h3>Personal Information Questions</h3>
        <ul>
          <li><strong>How old are you?</strong> - I'm ... years old</li>
          <li><strong>Where are you from?</strong> - I'm from...</li>
          <li><strong>What's your phone number?</strong> - My phone number is...</li>
          <li><strong>What's your address?</strong> - I live at...</li>
        </ul>`,
        order_index: 2
      },
      // A2 Lessons
      {
        course_id: courses.find(c => c.level === 'A2')?.id,
        title: "Present Simple Tense",
        content: `<h2>Present Simple Tense</h2>
        <p>The Present Simple is one of the most important tenses in English. We use it to talk about habits, routines, and general facts.</p>
        
        <h3>Formation</h3>
        <p><strong>Positive:</strong> Subject + Verb (+ s/es for he/she/it)</p>
        <ul>
          <li>I work in an office.</li>
          <li>She works in a hospital.</li>
          <li>They play football every Sunday.</li>
        </ul>

        <p><strong>Negative:</strong> Subject + don't/doesn't + Verb</p>
        <ul>
          <li>I don't like coffee.</li>
          <li>He doesn't speak French.</li>
          <li>We don't watch TV much.</li>
        </ul>

        <p><strong>Questions:</strong> Do/Does + Subject + Verb?</p>
        <ul>
          <li>Do you live in London?</li>
          <li>Does she work here?</li>
          <li>Do they have children?</li>
        </ul>

        <h3>When to Use Present Simple</h3>
        <ul>
          <li><strong>Habits and routines:</strong> I brush my teeth every morning.</li>
          <li><strong>General facts:</strong> The sun rises in the east.</li>
          <li><strong>Permanent situations:</strong> She lives in Paris.</li>
          <li><strong>Scheduled events:</strong> The train leaves at 9:00 AM.</li>
        </ul>`,
        order_index: 1
      },
      {
        course_id: courses.find(c => c.level === 'A2')?.id,
        title: "Past Simple Tense",
        content: `<h2>Past Simple Tense</h2>
        <p>We use the Past Simple to talk about completed actions in the past.</p>
        
        <h3>Regular Verbs</h3>
        <p>Add -ed to the base form:</p>
        <ul>
          <li>work → worked</li>
          <li>play → played</li>
          <li>study → studied (change y to i + ed)</li>
          <li>stop → stopped (double the consonant + ed)</li>
        </ul>

        <h3>Irregular Verbs</h3>
        <p>These verbs change completely:</p>
        <ul>
          <li>go → went</li>
          <li>have → had</li>
          <li>see → saw</li>
          <li>eat → ate</li>
          <li>drink → drank</li>
          <li>come → came</li>
        </ul>

        <h3>Formation</h3>
        <p><strong>Positive:</strong> Subject + Past form of verb</p>
        <ul>
          <li>I visited London last year.</li>
          <li>She went to the cinema yesterday.</li>
        </ul>

        <p><strong>Negative:</strong> Subject + didn't + base form</p>
        <ul>
          <li>I didn't go to work yesterday.</li>
          <li>She didn't call me.</li>
        </ul>

        <p><strong>Questions:</strong> Did + Subject + base form?</p>
        <ul>
          <li>Did you see the movie?</li>
          <li>Did they arrive on time?</li>
        </ul>`,
        order_index: 2
      },
      // B1 Lessons  
      {
        course_id: courses.find(c => c.level === 'B1')?.id,
        title: "Present Perfect Tense",
        content: `<h2>Present Perfect Tense</h2>
        <p>The Present Perfect connects the past with the present. It shows that something happened in the past but is still relevant now.</p>
        
        <h3>Formation</h3>
        <p><strong>Positive:</strong> Subject + have/has + Past Participle</p>
        <ul>
          <li>I have lived here for five years.</li>
          <li>She has visited Paris three times.</li>
          <li>They have finished their homework.</li>
        </ul>

        <h3>When to Use Present Perfect</h3>
        <ul>
          <li><strong>Experience:</strong> I have been to Japan.</li>
          <li><strong>Change over time:</strong> My English has improved.</li>
          <li><strong>Accomplishments:</strong> She has written three books.</li>
          <li><strong>Unfinished time:</strong> I have read five books this year.</li>
          <li><strong>Multiple actions:</strong> We have had many tests this month.</li>
        </ul>

        <h3>Time Expressions</h3>
        <ul>
          <li><strong>For:</strong> duration (for two hours, for a week)</li>
          <li><strong>Since:</strong> starting point (since 2020, since I was young)</li>
          <li><strong>Already:</strong> sooner than expected</li>
          <li><strong>Yet:</strong> until now (in negatives and questions)</li>
          <li><strong>Just:</strong> very recently</li>
          <li><strong>Ever:</strong> at any time (in questions)</li>
          <li><strong>Never:</strong> at no time</li>
        </ul>`,
        order_index: 1
      },
      // B2 Lessons
      {
        course_id: courses.find(c => c.level === 'B2')?.id,
        title: "Conditional Sentences",
        content: `<h2>Conditional Sentences</h2>
        <p>Conditional sentences express possibilities, probabilities, and hypothetical situations.</p>
        
        <h3>Zero Conditional (General Facts)</h3>
        <p><strong>If + Present Simple, Present Simple</strong></p>
        <ul>
          <li>If you heat water to 100°C, it boils.</li>
          <li>If it rains, the ground gets wet.</li>
        </ul>

        <h3>First Conditional (Real Future Possibility)</h3>
        <p><strong>If + Present Simple, will + infinitive</strong></p>
        <ul>
          <li>If it rains tomorrow, I will stay home.</li>
          <li>If you study hard, you will pass the exam.</li>
        </ul>

        <h3>Second Conditional (Unreal Present)</h3>
        <p><strong>If + Past Simple, would + infinitive</strong></p>
        <ul>
          <li>If I had more money, I would travel the world.</li>
          <li>If she spoke English, she would get the job.</li>
        </ul>

        <h3>Third Conditional (Unreal Past)</h3>
        <p><strong>If + Past Perfect, would have + Past Participle</strong></p>
        <ul>
          <li>If I had studied harder, I would have passed the exam.</li>
          <li>If they had left earlier, they wouldn't have missed the train.</li>
        </ul>`,
        order_index: 1
      },
      // C1 Lessons
      {
        course_id: courses.find(c => c.level === 'C1')?.id,
        title: "Advanced Grammar Structures",
        content: `<h2>Advanced Grammar Structures</h2>
        <p>Master complex grammatical structures used in academic and professional contexts.</p>
        
        <h3>Inversion</h3>
        <p>Used for emphasis and in formal writing:</p>
        <ul>
          <li><strong>Never have I seen</strong> such a beautiful sunset.</li>
          <li><strong>Only when</strong> he arrived did we start the meeting.</li>
          <li><strong>Had I known</strong> about the traffic, I would have left earlier.</li>
        </ul>

        <h3>Cleft Sentences</h3>
        <p>Used to emphasize particular parts of a sentence:</p>
        <ul>
          <li><strong>It was John who</strong> broke the window. (not someone else)</li>
          <li><strong>What I need is</strong> a good night's sleep.</li>
          <li><strong>The thing that annoys me most is</strong> people being late.</li>
        </ul>

        <h3>Participle Clauses</h3>
        <p>Used to create more concise, sophisticated sentences:</p>
        <ul>
          <li><strong>Having finished</strong> his work, he went home.</li>
          <li><strong>Being tired</strong>, she decided to rest.</li>
          <li><strong>Built in 1920</strong>, the house is now a museum.</li>
        </ul>`,
        order_index: 1
      },
      // C2 Lessons
      {
        course_id: courses.find(c => c.level === 'C2')?.id,
        title: "Mastering Nuanced English",
        content: `<h2>Mastering Nuanced English</h2>
        <p>Develop native-like proficiency with subtle language distinctions and advanced stylistic features.</p>
        
        <h3>Subtle Distinctions in Meaning</h3>
        <ul>
          <li><strong>Childish vs. Childlike:</strong> Childish (negative) vs. Childlike (positive innocence)</li>
          <li><strong>Economic vs. Economical:</strong> Economic (relating to economy) vs. Economical (cost-effective)</li>
          <li><strong>Historic vs. Historical:</strong> Historic (significant) vs. Historical (from history)</li>
        </ul>

        <h3>Advanced Collocations</h3>
        <ul>
          <li><strong>Commit:</strong> commit a crime, commit to memory, commit resources</li>
          <li><strong>Draw:</strong> draw conclusions, draw attention, draw the line</li>
          <li><strong>Strike:</strong> strike a balance, strike a deal, strike while the iron is hot</li>
        </ul>

        <h3>Discourse Markers for Sophisticated Writing</h3>
        <ul>
          <li><strong>Notwithstanding:</strong> Despite this fact</li>
          <li><strong>Be that as it may:</strong> Nevertheless</li>
          <li><strong>To that end:</strong> For that purpose</li>
          <li><strong>In the final analysis:</strong> When everything is considered</li>
        </ul>`,
        order_index: 1
      }
    ];

    // Insert lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .insert(lessonsData)
      .select();

    if (lessonsError) throw lessonsError;

    // Exercises data
    const exercisesData = [
      // A1 Greetings exercises
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        question: "What is the correct response to 'Hello, my name is Sarah'?",
        options: ["Goodbye Sarah", "Hi Sarah, I'm John", "How are you?", "See you later"],
        correct_answer: "Hi Sarah, I'm John",
        explanation: "When someone introduces themselves, you should respond with a greeting and your own name.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        question: "Which greeting is most appropriate at 2:00 PM?",
        options: ["Good morning", "Good afternoon", "Good evening", "Good night"],
        correct_answer: "Good afternoon",
        explanation: "Good afternoon is used from 12:00 PM to 6:00 PM.",
        order_index: 2
      },
      {
        lesson_id: lessons.find(l => l.title === "Greetings and Introductions")?.id,
        question: "What's the formal way to ask someone's name?",
        options: ["What's your name?", "Who are you?", "What is your name?", "Tell me your name"],
        correct_answer: "What is your name?",
        explanation: "The full form 'What is your name?' is more formal than the contracted 'What's your name?'",
        order_index: 3
      },
      // A1 Numbers exercises
      {
        lesson_id: lessons.find(l => l.title === "Numbers and Basic Information")?.id,
        question: "How do you spell the number '8'?",
        options: ["ate", "eight", "eght", "eigth"],
        correct_answer: "eight",
        explanation: "The number 8 is spelled 'eight'.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Numbers and Basic Information")?.id,
        question: "What's the correct response to 'How old are you?'",
        options: ["I have 25 years", "I'm 25 years old", "I am 25 years", "My age is 25"],
        correct_answer: "I'm 25 years old",
        explanation: "The standard response is 'I'm [number] years old'.",
        order_index: 2
      },
      // A2 Present Simple exercises
      {
        lesson_id: lessons.find(l => l.title === "Present Simple Tense")?.id,
        question: "Complete: She _____ to work every day.",
        options: ["go", "goes", "going", "went"],
        correct_answer: "goes",
        explanation: "With 'she' (third person singular), we add 's' to the verb in Present Simple.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Present Simple Tense")?.id,
        question: "Make this negative: 'They play football.' → 'They _____ football.'",
        options: ["don't play", "doesn't play", "not play", "aren't play"],
        correct_answer: "don't play",
        explanation: "For 'they' (plural), we use 'don't' + base verb for negatives.",
        order_index: 2
      },
      // A2 Past Simple exercises
      {
        lesson_id: lessons.find(l => l.title === "Past Simple Tense")?.id,
        question: "What's the past form of 'go'?",
        options: ["goed", "went", "gone", "going"],
        correct_answer: "went",
        explanation: "'Go' is an irregular verb. Its past form is 'went'.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Past Simple Tense")?.id,
        question: "Complete the question: '_____ you see the movie yesterday?'",
        options: ["Do", "Did", "Have", "Are"],
        correct_answer: "Did",
        explanation: "Past Simple questions use 'did' + subject + base verb.",
        order_index: 2
      },
      // B1 Present Perfect exercises
      {
        lesson_id: lessons.find(l => l.title === "Present Perfect Tense")?.id,
        question: "Complete: I _____ here for five years.",
        options: ["live", "lived", "have lived", "am living"],
        correct_answer: "have lived",
        explanation: "Present Perfect is used with 'for' + period of time to show duration up to now.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Present Perfect Tense")?.id,
        question: "Which sentence is correct?",
        options: ["I have went to Paris", "I have been to Paris", "I have go to Paris", "I have going to Paris"],
        correct_answer: "I have been to Paris",
        explanation: "Present Perfect uses have/has + past participle. 'Been' is the past participle of 'be/go' for experience.",
        order_index: 2
      },
      // B2 Conditionals exercises
      {
        lesson_id: lessons.find(l => l.title === "Conditional Sentences")?.id,
        question: "Complete the Second Conditional: If I _____ rich, I would travel the world.",
        options: ["am", "was", "were", "will be"],
        correct_answer: "were",
        explanation: "Second Conditional uses 'were' for all persons in the if-clause, even with 'I'.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Conditional Sentences")?.id,
        question: "Which is a Third Conditional sentence?",
        options: ["If it rains, I stay home", "If it rained, I would stay home", "If it had rained, I would have stayed home", "If it will rain, I will stay home"],
        correct_answer: "If it had rained, I would have stayed home",
        explanation: "Third Conditional uses Past Perfect in the if-clause and would have + past participle in the main clause.",
        order_index: 2
      },
      // C1 Advanced Grammar exercises
      {
        lesson_id: lessons.find(l => l.title === "Advanced Grammar Structures")?.id,
        question: "Rewrite using inversion: 'I have never seen such a thing.' → '_____ such a thing.'",
        options: ["Never I have seen", "Never have I seen", "Never I seen", "Never did I see"],
        correct_answer: "Never have I seen",
        explanation: "With 'never' at the beginning, we invert the auxiliary verb and subject.",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Advanced Grammar Structures")?.id,
        question: "Complete the cleft sentence: '_____ annoys me is people being late.'",
        options: ["That", "What", "Which", "Who"],
        correct_answer: "What",
        explanation: "'What' is used in cleft sentences to emphasize the object or complement.",
        order_index: 2
      },
      // C2 Nuanced English exercises
      {
        lesson_id: lessons.find(l => l.title === "Mastering Nuanced English")?.id,
        question: "Choose the correct word: 'The painting showed her _____ innocence.'",
        options: ["childish", "childlike"],
        correct_answer: "childlike",
        explanation: "'Childlike' has positive connotations (innocent, pure), while 'childish' is negative (immature).",
        order_index: 1
      },
      {
        lesson_id: lessons.find(l => l.title === "Mastering Nuanced English")?.id,
        question: "Complete the collocation: 'strike a _____'",
        options: ["balance", "hit", "problem", "solution"],
        correct_answer: "balance",
        explanation: "'Strike a balance' is a common collocation meaning to find a middle ground between extremes.",
        order_index: 2
      }
    ];

    // Insert exercises
    const { error: exercisesError } = await supabase
      .from('exercises')
      .insert(exercisesData);

    if (exercisesError) throw exercisesError;

    // Level tests data
    const levelTestsData = [
      {
        from_level: "A1",
        to_level: "A2",
        questions: [
          {
            question: "Choose the correct present simple form: 'She _____ English every day.'",
            options: ["study", "studies", "studying", "studied"],
            correct_answer: "studies"
          },
          {
            question: "What's the plural of 'child'?",
            options: ["childs", "children", "childes", "child"],
            correct_answer: "children"
          },
          {
            question: "Complete: 'I _____ from Brazil.'",
            options: ["am", "is", "are", "be"],
            correct_answer: "am"
          },
          {
            question: "Which is correct? 'There _____ many books on the table.'",
            options: ["is", "are", "was", "been"],
            correct_answer: "are"
          },
          {
            question: "Choose the correct question: '_____?'",
            options: ["How old you are", "How old are you", "How you are old", "How are old you"],
            correct_answer: "How old are you"
          }
        ]
      },
      {
        from_level: "A2",
        to_level: "B1",
        questions: [
          {
            question: "Complete with Past Simple: 'Yesterday, I _____ to the cinema.'",
            options: ["go", "went", "gone", "going"],
            correct_answer: "went"
          },
          {
            question: "Which sentence is in Present Continuous?",
            options: ["I work here", "I worked here", "I am working here", "I have worked here"],
            correct_answer: "I am working here"
          },
          {
            question: "Complete: 'I _____ this book last week.'",
            options: ["read", "reads", "reading", "have read"],
            correct_answer: "read"
          },
          {
            question: "Choose the correct comparative: 'This book is _____ than that one.'",
            options: ["more interesting", "most interesting", "interestinger", "more interest"],
            correct_answer: "more interesting"
          },
          {
            question: "Complete: 'If it rains, I _____ home.'",
            options: ["stay", "will stay", "stayed", "staying"],
            correct_answer: "will stay"
          }
        ]
      },
      {
        from_level: "B1",
        to_level: "B2",
        questions: [
          {
            question: "Complete with Present Perfect: 'I _____ never _____ to Japan.'",
            options: ["have, been", "has, been", "have, go", "am, been"],
            correct_answer: "have, been"
          },
          {
            question: "Which sentence uses the passive voice correctly?",
            options: ["The book was written by her", "The book written by her", "The book was write by her", "The book is wrote by her"],
            correct_answer: "The book was written by her"
          },
          {
            question: "Complete: 'I wish I _____ speak French.'",
            options: ["can", "could", "will", "would"],
            correct_answer: "could"
          },
          {
            question: "Choose the correct relative pronoun: 'The man _____ lives next door is a doctor.'",
            options: ["which", "who", "where", "when"],
            correct_answer: "who"
          },
          {
            question: "Complete: 'She said she _____ come tomorrow.'",
            options: ["will", "would", "can", "could"],
            correct_answer: "would"
          }
        ]
      },
      {
        from_level: "B2",
        to_level: "C1",
        questions: [
          {
            question: "Complete the Third Conditional: 'If I _____ harder, I _____ the exam.'",
            options: ["studied, would pass", "had studied, would have passed", "study, will pass", "have studied, would pass"],
            correct_answer: "had studied, would have passed"
          },
          {
            question: "Choose the correct modal for deduction: 'She _____ be at home. Her car is in the driveway.'",
            options: ["can", "must", "might", "should"],
            correct_answer: "must"
          },
          {
            question: "Complete: 'I'd rather you _____ here tomorrow.'",
            options: ["come", "came", "will come", "coming"],
            correct_answer: "came"
          },
          {
            question: "Which sentence shows advanced grammar?",
            options: ["Having finished the work, he left", "He finished the work and left", "He finished the work, then he left", "After he finished the work, he left"],
            correct_answer: "Having finished the work, he left"
          },
          {
            question: "Complete: 'Not only _____ late, but he also forgot the documents.'",
            options: ["he was", "was he", "he is", "is he"],
            correct_answer: "was he"
          }
        ]
      },
      {
        from_level: "C1",
        to_level: "C2",
        questions: [
          {
            question: "Choose the most sophisticated expression: 'Despite the difficulties, _____'",
            options: ["we continued", "we carried on", "we persevered", "we kept going"],
            correct_answer: "we persevered"
          },
          {
            question: "Complete with the correct collocation: 'The new policy will _____ significant changes.'",
            options: ["bring about", "bring up", "bring in", "bring down"],
            correct_answer: "bring about"
          },
          {
            question: "Which sentence demonstrates native-like usage?",
            options: ["It's raining cats and dogs", "It's raining very heavily", "The rain is very strong", "There is much rain"],
            correct_answer: "It's raining cats and dogs"
          },
          {
            question: "Complete: '_____ the weather, the event will proceed as planned.'",
            options: ["Despite", "Although", "Notwithstanding", "Even though"],
            correct_answer: "Notwithstanding"
          },
          {
            question: "Choose the most precise word: 'The evidence _____ his involvement in the crime.'",
            options: ["shows", "proves", "suggests", "corroborates"],
            correct_answer: "corroborates"
          }
        ]
      }
    ];

    // Insert level tests
    const { error: testsError } = await supabase
      .from('level_tests')
      .insert(levelTestsData);

    if (testsError) throw testsError;

    console.log('Course data seeded successfully!');
    return { success: true, message: 'Course data seeded successfully!' };

  } catch (error) {
    console.error('Error seeding course data:', error);
    return { success: false, message: 'Failed to seed course data', error };
  }
};