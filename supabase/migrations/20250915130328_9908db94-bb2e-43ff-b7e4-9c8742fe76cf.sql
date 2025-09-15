-- Clear existing lesson content and exercises for comprehensive update
DELETE FROM lesson_content;
DELETE FROM exercises;

-- A1 Level Content - Lesson 1: Meet and Greet + Verb To Be
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'introduction', 'Meet and Greet + Verb To Be', 
'Learn essential greetings and introductions using the verb "to be" - the foundation of English communication.',
'{
  "sections": [
    {
      "title": "Greetings and Farewells",
      "content": "Different ways to say hello and goodbye in English"
    },
    {
      "title": "Personal Introductions", 
      "content": "How to introduce yourself and ask about others"
    },
    {
      "title": "The Verb To Be",
      "content": "Present tense forms: I am, you are, he/she/it is, we are, they are"
    },
    {
      "title": "Basic Wh-Questions",
      "content": "Who, what, where, how questions for getting information"
    }
  ],
  "vocabulary": [
    {"word": "hello", "definition": "a greeting", "example": "Hello, nice to meet you!"},
    {"word": "goodbye", "definition": "a farewell", "example": "Goodbye, see you tomorrow!"},
    {"word": "name", "definition": "what someone is called", "example": "My name is Maria."},
    {"word": "from", "definition": "place of origin", "example": "I am from Brazil."},
    {"word": "student", "definition": "person who studies", "example": "She is a student."},
    {"word": "teacher", "definition": "person who teaches", "example": "He is our teacher."},
    {"word": "happy", "definition": "feeling joy", "example": "I am happy today."},
    {"word": "fine", "definition": "feeling well", "example": "I am fine, thank you."}
  ]
}', 
'[
  {"type": "formal_greeting", "text": "Good morning", "usage": "Before 12 PM"},
  {"type": "informal_greeting", "text": "Hi there!", "usage": "Casual situations"},
  {"type": "introduction", "text": "My name is João", "usage": "Telling your name"},
  {"type": "question", "text": "Where are you from?", "usage": "Asking about origin"},
  {"type": "affirmative", "text": "I am a teacher", "usage": "Stating profession"},
  {"type": "negative", "text": "She is not happy", "usage": "Negative statement"},
  {"type": "interrogative", "text": "Are you a student?", "usage": "Yes/no question"}
]', 1);

-- A1 Lesson 1 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Complete: "Hi! My name ___ Ana."', '["am", "is", "are", "be"]', 'is', 'Use "is" with "my name" (3rd person singular)', 1, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Which is a formal greeting?', '["Hey!", "What''s up?", "Good morning!", "Hi!"]', 'Good morning!', '"Good morning" is a formal way to greet someone', 2, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Complete: "I ___ a student."', '["am", "is", "are", "be"]', 'am', 'Use "am" with "I"', 3, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Make this negative: "She is happy." → "She ___ happy."', '["am not", "is not", "are not", "not is"]', 'is not', 'Use "is not" or "isn''t" to make negative sentences with "she"', 4, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Complete the question: "___ are you from?"', '["Who", "What", "Where", "When"]', 'Where', '"Where" is used to ask about location or origin', 5, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Complete: "They ___ my friends."', '["am", "is", "are", "be"]', 'are', 'Use "are" with "they"', 6, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Which response is correct for "How are you?"', '["I am from Brazil", "My name is João", "I am fine, thank you", "I am 25 years old"]', 'I am fine, thank you', '"How are you?" asks about your condition or feelings', 7, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Complete the question: "___ is your teacher?"', '["Who", "What", "Where", "How"]', 'Who', '"Who" is used to ask about people', 8, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Make this a question: "You are happy." → "___ you happy?"', '["Am", "Is", "Are", "Be"]', 'Are', 'Move "are" to the beginning to make a yes/no question', 9, 10, 'multiple_choice'),
('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'Which is an informal greeting?', '["Good evening!", "Good afternoon!", "Hey!", "How are you?"]', 'Hey!', '"Hey!" is an informal, casual way to greet someone', 10, 10, 'multiple_choice');

-- A1 Level - Lesson 2: Countries and Nationalities + Verb To Be Drills
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'introduction', 'Countries and Nationalities + Verb To Be Drills', 
'Learn about countries, nationalities, and practice the verb "to be" with different subjects.',
'{
  "sections": [
    {
      "title": "Countries Vocabulary",
      "content": "Major countries around the world"
    },
    {
      "title": "Nationalities",
      "content": "How to express where you are from using nationality adjectives"
    },
    {
      "title": "Verb To Be Practice",
      "content": "Intensive practice with all forms of the verb to be"
    },
    {
      "title": "Articles with Nationalities",
      "content": "When to use a/an with nationalities"
    }
  ],
  "vocabulary": [
    {"word": "Brazil", "definition": "South American country", "example": "I am from Brazil."},
    {"word": "Brazilian", "definition": "from Brazil", "example": "She is Brazilian."},
    {"word": "American", "definition": "from the USA", "example": "He is American."},
    {"word": "British", "definition": "from Britain/UK", "example": "They are British."},
    {"word": "French", "definition": "from France", "example": "Marie is French."},
    {"word": "Italian", "definition": "from Italy", "example": "Marco is Italian."},
    {"word": "Japanese", "definition": "from Japan", "example": "Yuki is Japanese."},
    {"word": "Mexican", "definition": "from Mexico", "example": "Carlos is Mexican."},
    {"word": "country", "definition": "a nation", "example": "Brazil is a big country."},
    {"word": "nationality", "definition": "belonging to a nation", "example": "What is your nationality?"}
  ]
}',
'[
  {"type": "nationality", "text": "I am Brazilian", "usage": "Stating nationality"},
  {"type": "origin", "text": "She is from Japan", "usage": "Saying country of origin"},
  {"type": "question", "text": "What nationality are you?", "usage": "Asking about nationality"},
  {"type": "article", "text": "He is a Brazilian student", "usage": "Using article with nationality + noun"},
  {"type": "plural", "text": "They are Americans", "usage": "Plural nationality"},
  {"type": "negative", "text": "I am not Italian", "usage": "Negative nationality"}
]', 1);

-- A1 Lesson 2 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Complete: "Maria is from Brazil. She is ___."', '["Brazil", "Brazilian", "Brazilia", "Brasil"]', 'Brazilian', 'Use the nationality adjective "Brazilian" for people from Brazil', 1, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Choose the correct form: "John ___ from the United States."', '["am", "is", "are", "be"]', 'is', 'Use "is" with third person singular (John)', 2, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Complete: "We ___ Italian. We are from Italy."', '["am", "is", "are", "be"]', 'are', 'Use "are" with "we"', 3, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Choose the nationality: "Pierre is from France. He is ___."', '["France", "Francais", "French", "Frenchy"]', 'French', '"French" is the nationality for people from France', 4, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Complete the question: "___ nationality are you?"', '["Who", "What", "Where", "How"]', 'What', '"What nationality" asks about someone''s nationality', 5, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Complete: "I ___ not American. I am Canadian."', '["am", "is", "are", "be"]', 'am', 'Use "am" with "I" in negative sentences', 6, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Choose the correct article: "He is ___ Japanese teacher."', '["a", "an", "the", "no article"]', 'a', 'Use "a" before consonant sounds (Japanese)', 7, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Complete: "Ana and Carlos ___ from Mexico."', '["am", "is", "are", "be"]', 'are', 'Use "are" with plural subjects', 8, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Choose the country: "Yuki is Japanese. She is from ___."', '["China", "Korea", "Japan", "Thailand"]', 'Japan', 'Japanese people are from Japan', 9, 10, 'multiple_choice'),
('d3f37d1f-5c4d-4b30-96da-3878fc0118c0', 'Make a question: "They are British." → "___ they British?"', '["Am", "Is", "Are", "Be"]', 'Are', 'Move "are" to the beginning for yes/no questions', 10, 10, 'multiple_choice');

-- A1 Level - Lesson 3: Simple Present (I/you/we/they)
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'introduction', 'Simple Present (I/you/we/they)', 
'Learn to use Simple Present tense with first and second person pronouns and plural subjects.',
'{
  "sections": [
    {
      "title": "Simple Present Formation",
      "content": "Base form of verbs with I, you, we, they: I work, you study, we live, they play"
    },
    {
      "title": "Daily Activities",
      "content": "Common verbs for everyday actions"
    },
    {
      "title": "Negative Form",
      "content": "Using do not (don''t) with I, you, we, they"
    },
    {
      "title": "Question Form",
      "content": "Using Do with I, you, we, they in questions"
    }
  ],
  "vocabulary": [
    {"word": "work", "definition": "to have a job", "example": "I work in an office."},
    {"word": "study", "definition": "to learn", "example": "You study English."},
    {"word": "live", "definition": "to have a home", "example": "We live in São Paulo."},
    {"word": "play", "definition": "to have fun with games/sports", "example": "They play soccer."},
    {"word": "eat", "definition": "to consume food", "example": "I eat breakfast at 7 AM."},
    {"word": "drink", "definition": "to consume liquids", "example": "We drink coffee."},
    {"word": "speak", "definition": "to talk", "example": "You speak Portuguese."},
    {"word": "listen", "definition": "to hear with attention", "example": "They listen to music."},
    {"word": "watch", "definition": "to look at", "example": "We watch TV."},
    {"word": "read", "definition": "to look at written words", "example": "I read books."}
  ]
}',
'[
  {"type": "affirmative", "text": "I work every day", "usage": "Simple present with I"},
  {"type": "negative", "text": "You do not speak French", "usage": "Negative with you"},
  {"type": "question", "text": "Do we have class today?", "usage": "Question with we"},
  {"type": "routine", "text": "They eat lunch at noon", "usage": "Daily routine"},
  {"type": "habit", "text": "I drink coffee every morning", "usage": "Regular habit"},
  {"type": "general", "text": "We live in Brazil", "usage": "General fact"}
]', 1);

-- A1 Lesson 3 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Complete: "I ___ English every day."', '["study", "studies", "studying", "to study"]', 'study', 'Use base form with "I" in Simple Present', 1, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Choose the negative form: "We ___ coffee."', '["no drink", "not drink", "do not drink", "does not drink"]', 'do not drink', 'Use "do not" (don''t) with "we" for negatives', 2, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Complete: "You ___ in a big house."', '["live", "lives", "living", "to live"]', 'live', 'Use base form with "you" in Simple Present', 3, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Make a question: "They play soccer." → "___ they play soccer?"', '["Do", "Does", "Are", "Is"]', 'Do', 'Use "Do" with "they" in questions', 4, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Complete: "I ___ TV in the evening."', '["watch", "watches", "watching", "to watch"]', 'watch', 'Use base form with "I"', 5, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Choose the correct form: "We ___ not work on Sundays."', '["do", "does", "are", "is"]', 'do', 'Use "do not" with "we"', 6, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Complete: "You ___ Portuguese very well."', '["speak", "speaks", "speaking", "to speak"]', 'speak', 'Use base form with "you"', 7, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Make negative: "They eat breakfast." → "They ___ breakfast."', '["no eat", "not eat", "do not eat", "does not eat"]', 'do not eat', 'Use "do not" with "they"', 8, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Complete the question: "___ you like pizza?"', '["Do", "Does", "Are", "Is"]', 'Do', 'Use "Do" with "you" in questions', 9, 10, 'multiple_choice'),
('d5c99edf-3909-41c6-adb2-cc79ffe75811', 'Complete: "We ___ to music when we exercise."', '["listen", "listens", "listening", "to listen"]', 'listen', 'Use base form with "we"', 10, 10, 'multiple_choice');

-- A1 Level - Lesson 4: Simple Present (he/she/it)
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'introduction', 'Simple Present (he/she/it)', 
'Learn the third person singular forms of Simple Present tense with -s/-es endings.',
'{
  "sections": [
    {
      "title": "Third Person -s Rule",
      "content": "Adding -s or -es to verbs with he, she, it: works, studies, goes, watches"
    },
    {
      "title": "Spelling Rules",
      "content": "When to add -s, -es, or -ies to verbs"
    },
    {
      "title": "Negative Form",
      "content": "Using does not (doesn''t) with he, she, it"
    },
    {
      "title": "Question Form",
      "content": "Using Does with he, she, it in questions"
    }
  ],
  "vocabulary": [
    {"word": "goes", "definition": "third person form of go", "example": "She goes to work by bus."},
    {"word": "works", "definition": "third person form of work", "example": "He works in a bank."},
    {"word": "studies", "definition": "third person form of study", "example": "Maria studies medicine."},
    {"word": "watches", "definition": "third person form of watch", "example": "He watches TV every night."},
    {"word": "teaches", "definition": "third person form of teach", "example": "She teaches English."},
    {"word": "plays", "definition": "third person form of play", "example": "The dog plays in the garden."},
    {"word": "eats", "definition": "third person form of eat", "example": "He eats lunch at 12 PM."},
    {"word": "lives", "definition": "third person form of live", "example": "She lives in Rio."},
    {"word": "drives", "definition": "third person form of drive", "example": "He drives a red car."},
    {"word": "likes", "definition": "third person form of like", "example": "She likes chocolate."}
  ]
}',
'[
  {"type": "regular_s", "text": "He works in a hospital", "usage": "Regular verb + s"},
  {"type": "es_ending", "text": "She watches movies", "usage": "Verb ending in -ch + es"},
  {"type": "y_to_ies", "text": "He studies every night", "usage": "Consonant + y = ies"},
  {"type": "negative", "text": "It does not work", "usage": "Third person negative"},
  {"type": "question", "text": "Does she speak English?", "usage": "Third person question"},
  {"type": "irregular", "text": "She goes to school", "usage": "Irregular third person form"}
]', 1);

-- A1 Lesson 4 Exercises (continuing with the pattern for all lessons...)
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Complete: "She ___ in a hospital."', '["work", "works", "working", "to work"]', 'works', 'Add -s to the base form with third person singular', 1, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Choose the correct form: "He ___ English at the university."', '["teach", "teaches", "teaching", "to teach"]', 'teaches', 'Add -es to verbs ending in -ch', 2, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Complete: "Maria ___ medicine every day."', '["study", "studies", "studying", "to study"]', 'studies', 'Change -y to -ies after consonant', 3, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Make negative: "He plays soccer." → "He ___ soccer."', '["do not play", "does not play", "not plays", "not play"]', 'does not play', 'Use "does not" (doesn''t) with third person singular', 4, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Complete: "It ___ every morning at 6 AM."', '["rain", "rains", "raining", "to rain"]', 'rains', 'Add -s with third person singular (it)', 5, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Make a question: "She drives to work." → "___ she drive to work?"', '["Do", "Does", "Is", "Are"]', 'Does', 'Use "Does" with third person singular in questions', 6, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Complete: "João ___ to school by bus."', '["go", "goes", "going", "to go"]', 'goes', '"Go" becomes "goes" in third person singular', 7, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Choose the correct form: "The cat ___ fish every day."', '["eat", "eats", "eating", "to eat"]', 'eats', 'Add -s to the base form with third person singular', 8, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Complete: "___ he like pizza?"', '["Do", "Does", "Is", "Are"]', 'Does', 'Use "Does" in questions with third person singular', 9, 10, 'multiple_choice'),
('f0ef01a4-19fe-4921-9be5-2765bc53cc93', 'Complete: "My sister ___ not drink coffee."', '["do", "does", "is", "are"]', 'does', 'Use "does not" with third person singular', 10, 10, 'multiple_choice');