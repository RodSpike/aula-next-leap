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
]', 1),

('7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 'practice', 'Speaking Practice', 
'Practice introducing yourself and asking basic questions using the verb to be.',
'{
  "exercises": [
    {
      "type": "role_play",
      "instruction": "Practice this conversation with a partner",
      "dialogue": [
        "A: Hello! My name is Ana. What is your name?",
        "B: Hi Ana! I am Carlos. Nice to meet you!",
        "A: Nice to meet you too! Where are you from?",
        "B: I am from São Paulo. How about you?",
        "A: I am from Rio de Janeiro. Are you a student?",
        "B: Yes, I am. I am studying English. Are you a teacher?",
        "A: No, I am not. I am a student too!"
      ]
    }
  ],
  "pronunciation_tips": [
    {"sound": "/aɪ æm/", "word": "I am", "tip": "Contract to I''m in informal speech"},
    {"sound": "/hi ɪz/", "word": "he is", "tip": "Contract to he''s"},
    {"sound": "/ʃi ɪz/", "word": "she is", "tip": "Contract to she''s"}
  ]
}',
'[]', 2);

-- A1 Level Exercises for Lesson 1
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

-- A1 Level - Lesson 2: Family and Present Simple
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'introduction', 'Family and Present Simple', 
'Learn family vocabulary and how to talk about daily routines using Present Simple tense.',
'{
  "sections": [
    {
      "title": "Family Members",
      "content": "Essential vocabulary for describing family relationships"
    },
    {
      "title": "Present Simple Tense",
      "content": "Regular verbs in present tense: I work, you work, he/she works, we work, they work"
    },
    {
      "title": "Daily Routines",
      "content": "Common activities we do every day"
    },
    {
      "title": "Time Expressions",
      "content": "Every day, always, usually, sometimes, never"
    }
  ],
  "vocabulary": [
    {"word": "family", "definition": "parents, children, relatives", "example": "I have a big family."},
    {"word": "mother", "definition": "female parent", "example": "My mother is kind."},
    {"word": "father", "definition": "male parent", "example": "My father works hard."},
    {"word": "sister", "definition": "female sibling", "example": "My sister is younger."},
    {"word": "brother", "definition": "male sibling", "example": "I have one brother."},
    {"word": "work", "definition": "to have a job", "example": "I work in an office."},
    {"word": "study", "definition": "to learn", "example": "She studies English."},
    {"word": "live", "definition": "to have a home", "example": "We live in São Paulo."},
    {"word": "wake up", "definition": "to stop sleeping", "example": "I wake up early."},
    {"word": "breakfast", "definition": "morning meal", "example": "I eat breakfast at 7 AM."}
  ]
}',
'[
  {"type": "family", "text": "My mother is a doctor", "usage": "Describing family profession"},
  {"type": "routine", "text": "I wake up at 6 AM every day", "usage": "Daily routine with time"},
  {"type": "frequency", "text": "She always drinks coffee", "usage": "Using frequency adverbs"},
  {"type": "negative", "text": "He does not work on Sundays", "usage": "Present simple negative"},
  {"type": "question", "text": "Do you have any brothers?", "usage": "Yes/no question about family"},
  {"type": "wh_question", "text": "What time do you go to bed?", "usage": "Asking about routines"}
]', 1);

-- A1 Lesson 2 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Complete: "My sister ___ in a hospital."', '["work", "works", "working", "to work"]', 'works', 'Use "works" with third person singular (he/she/it)', 1, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Choose the correct family member: "My father''s wife is my ___"', '["sister", "mother", "daughter", "aunt"]', 'mother', 'Your father''s wife is your mother', 2, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Complete: "I ___ breakfast at 7 AM every day."', '["eat", "eats", "eating", "to eat"]', 'eat', 'Use "eat" with "I" in present simple', 3, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Make negative: "She studies English." → "She ___ English."', '["do not study", "does not study", "not studies", "not study"]', 'does not study', 'Use "does not" (doesn''t) with third person singular', 4, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Choose the frequency adverb: "I ___ drink coffee in the morning."', '["always", "yesterday", "tomorrow", "now"]', 'always', '"Always" shows frequency (100% of the time)', 5, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Complete the question: "___ do you live?"', '["Who", "What", "Where", "When"]', 'Where', '"Where" asks about location', 6, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Complete: "We ___ TV in the evening."', '["watch", "watches", "watching", "to watch"]', 'watch', 'Use "watch" with "we" in present simple', 7, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Choose the correct time expression: "She goes to work ___ Monday to Friday."', '["in", "on", "at", "from"]', 'from', '"From...to" shows a time period', 8, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Complete: "___ your brother work in a bank?"', '["Do", "Does", "Is", "Are"]', 'Does', 'Use "Does" with third person singular in questions', 9, 10, 'multiple_choice'),
('8e3f626e-8aab-4dc9-ae03-b94d4e65c20b', 'Choose the opposite: "My grandfather is old. My baby sister is ___"', '["young", "new", "small", "little"]', 'young', '"Young" is the opposite of "old" for age', 10, 10, 'multiple_choice');

-- A2 Level - Lesson 1: Hobbies and Free Time
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'introduction', 'Hobbies and Free Time Activities', 
'Express your interests and talk about leisure activities using like/love/hate + gerund (-ing forms).',
'{
  "sections": [
    {
      "title": "Hobby Vocabulary",
      "content": "Common leisure activities and interests"
    },
    {
      "title": "Like/Love/Hate + Gerund",
      "content": "Using -ing forms after preference verbs: I like reading, She loves dancing"
    },
    {
      "title": "Frequency Adverbs",
      "content": "How often: always, usually, often, sometimes, rarely, never"
    },
    {
      "title": "Time Expressions",
      "content": "In my free time, on weekends, after work, during holidays"
    }
  ],
  "vocabulary": [
    {"word": "hobby", "definition": "activity done for pleasure", "example": "Reading is my favorite hobby."},
    {"word": "swimming", "definition": "moving through water", "example": "I love swimming in the ocean."},
    {"word": "cooking", "definition": "preparing food", "example": "She enjoys cooking Italian food."},
    {"word": "painting", "definition": "creating art with colors", "example": "He likes painting landscapes."},
    {"word": "gardening", "definition": "growing plants", "example": "My mother loves gardening."},
    {"word": "cycling", "definition": "riding a bicycle", "example": "We go cycling every Sunday."},
    {"word": "photography", "definition": "taking pictures", "example": "Photography is an expensive hobby."},
    {"word": "traveling", "definition": "visiting places", "example": "I love traveling to new countries."},
    {"word": "collecting", "definition": "gathering similar items", "example": "He enjoys collecting old coins."},
    {"word": "knitting", "definition": "making clothes with needles", "example": "My grandmother teaches knitting."}
  ]
}',
'[
  {"type": "preference", "text": "I love playing guitar", "usage": "Expressing strong positive feeling"},
  {"type": "frequency", "text": "I usually read before bed", "usage": "Showing how often"},
  {"type": "time", "text": "In my free time, I paint", "usage": "Talking about leisure time"},
  {"type": "negative", "text": "She hates doing housework", "usage": "Expressing dislike"},
  {"type": "question", "text": "What do you like doing on weekends?", "usage": "Asking about preferences"},
  {"type": "comparison", "text": "I prefer swimming to running", "usage": "Comparing activities"}
]', 1);

-- A2 Lesson 1 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Complete: "I love ___ books in my free time."', '["read", "reading", "to read", "reads"]', 'reading', 'Use gerund (-ing) after "love"', 1, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Choose the hobby: "She uses a camera for her ___"', '["cooking", "swimming", "photography", "gardening"]', 'photography', 'Photography uses a camera', 2, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Complete: "My brother ___ playing video games."', '["hate", "hates", "hating", "to hate"]', 'hates', 'Use "hates" with third person singular', 3, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Choose the frequency adverb: "I ___ go swimming - about 3 times a week."', '["never", "rarely", "often", "always"]', 'often', '"Often" means frequently, several times', 4, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Complete: "What do you like ___ on weekends?"', '["do", "doing", "to do", "does"]', 'doing', 'Use gerund after "like" in questions', 5, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Choose the correct hobby: "He grows flowers and vegetables. His hobby is ___"', '["painting", "cooking", "gardening", "collecting"]', 'gardening', 'Gardening involves growing plants', 6, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Complete: "She ___ cooking, but she loves eating!"', '["like", "likes", "hate", "hates"]', 'hates', 'Contrast: hates cooking but loves eating', 7, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Choose the time expression: "___, I prefer to relax at home."', '["Always", "Never", "On weekends", "Yesterday"]', 'On weekends', '"On weekends" is a time expression for leisure', 8, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Complete: "I prefer ___ to watching TV."', '["read", "reading", "to read", "reads"]', 'reading', 'Use gerund after "prefer"', 9, 10, 'multiple_choice'),
('9f4g737f-9bbc-4eda-bf14-c95e5f76d31c', 'Choose the correct response: "Do you enjoy traveling?" "Yes, ___"', '["I do", "I am", "I like", "I enjoy"]', 'I do', 'Short answer for "Do you enjoy...?" is "Yes, I do"', 10, 10, 'multiple_choice');

-- B1 Level - Lesson 1: Past Simple and Life Experiences
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'introduction', 'Past Simple and Life Experiences', 
'Learn to talk about completed actions in the past and share life experiences using Past Simple tense.',
'{
  "sections": [
    {
      "title": "Past Simple Formation",
      "content": "Regular verbs: worked, studied, traveled. Irregular verbs: went, saw, had, did"
    },
    {
      "title": "Time Expressions",
      "content": "Yesterday, last week/month/year, ago, in 2020, when I was young"
    },
    {
      "title": "Life Experiences",
      "content": "Talking about important events, achievements, and memorable moments"
    },
    {
      "title": "Storytelling",
      "content": "Sequencing events: First, then, after that, finally"
    }
  ],
  "vocabulary": [
    {"word": "childhood", "definition": "time when you were a child", "example": "I had a happy childhood."},
    {"word": "graduation", "definition": "completing studies", "example": "My graduation was in 2019."},
    {"word": "achievement", "definition": "something accomplished", "example": "Learning English was a big achievement."},
    {"word": "adventure", "definition": "exciting experience", "example": "We had an amazing adventure in the mountains."},
    {"word": "memory", "definition": "something remembered", "example": "That''s my favorite childhood memory."},
    {"word": "experience", "definition": "something that happened", "example": "Working abroad was a great experience."},
    {"word": "journey", "definition": "trip or process", "example": "The journey to success was difficult."},
    {"word": "challenge", "definition": "difficult task", "example": "Learning to drive was a challenge."},
    {"word": "milestone", "definition": "important event", "example": "Getting married was a major milestone."},
    {"word": "opportunity", "definition": "chance to do something", "example": "I had the opportunity to study abroad."}
  ]
}',
'[
  {"type": "past_event", "text": "I graduated from university in 2020", "usage": "Completed past action with time"},
  {"type": "sequence", "text": "First I studied, then I worked, finally I started my own business", "usage": "Ordering past events"},
  {"type": "experience", "text": "I traveled to Europe when I was 25", "usage": "Life experience with age"},
  {"type": "negative", "text": "I didn''t have a car until I was 30", "usage": "Past simple negative"},
  {"type": "question", "text": "Where did you live as a child?", "usage": "Past simple question"},
  {"type": "irregular", "text": "She went to Japan and saw Mount Fuji", "usage": "Irregular past verbs"}
]', 1);

-- B1 Lesson 1 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Complete: "I ___ from university in 2019."', '["graduate", "graduated", "graduation", "graduating"]', 'graduated', 'Use past simple "graduated" for completed past action', 1, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Choose the correct past form: "She ___ to Paris last summer."', '["go", "goes", "went", "going"]', 'went', '"Went" is the irregular past form of "go"', 2, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Complete: "When I was young, I ___ have a smartphone."', '["don''t", "doesn''t", "didn''t", "not"]', 'didn''t', 'Use "didn''t" for past simple negative', 3, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Choose the time expression: "I learned to drive ___ ago."', '["tomorrow", "next week", "five years", "always"]', 'five years', '"Ago" is used with past time expressions', 4, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Complete the question: "Where ___ you born?"', '["are", "were", "did", "do"]', 'were', 'Use "were" with "you" in past simple of "be"', 5, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Choose the correct sequence word: "___ I studied, then I got a job."', '["Finally", "After", "First", "Later"]', 'First', '"First" introduces the beginning of a sequence', 6, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Complete: "My childhood ___ very happy."', '["is", "was", "are", "were"]', 'was', 'Use "was" for singular past of "be"', 7, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Choose the irregular past verb: "I ___ an interesting book yesterday."', '["readed", "read", "reading", "reads"]', 'read', '"Read" (past) looks the same as "read" (present) but sounds different', 8, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Complete: "___ you enjoy your vacation in Brazil?"', '["Do", "Does", "Did", "Are"]', 'Did', 'Use "Did" for past simple questions', 9, 10, 'multiple_choice'),
('a05h848g-accd-4feb-bg25-d06f6g87e42d', 'Choose the life experience: "Getting my first job was a major ___"', '["memory", "milestone", "childhood", "opportunity"]', 'milestone', 'A milestone is an important life event', 10, 10, 'multiple_choice');

-- B2 Level - Lesson 1: Present Perfect and Experiences
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'introduction', 'Present Perfect and Life Experiences', 
'Master the Present Perfect tense to connect past experiences with the present moment.',
'{
  "sections": [
    {
      "title": "Present Perfect Formation",
      "content": "Have/has + past participle: I have lived, she has worked, they have traveled"
    },
    {
      "title": "Experience vs. Past Simple",
      "content": "Present Perfect for experiences without specific time vs Past Simple for specific past times"
    },
    {
      "title": "Already, Yet, Just, Ever, Never",
      "content": "Time markers that commonly accompany Present Perfect tense"
    },
    {
      "title": "Since and For",
      "content": "Duration expressions: since 2020 (starting point) vs for 3 years (duration)"
    }
  ],
  "vocabulary": [
    {"word": "accomplish", "definition": "to achieve successfully", "example": "I have accomplished many goals this year."},
    {"word": "encounter", "definition": "to meet or experience", "example": "Have you ever encountered difficulties abroad?"},
    {"word": "pursue", "definition": "to follow or chase", "example": "She has pursued her dreams relentlessly."},
    {"word": "overcome", "definition": "to defeat or solve", "example": "They have overcome many obstacles."},
    {"word": "influence", "definition": "to affect or change", "example": "This experience has influenced my perspective."},
    {"word": "transform", "definition": "to change completely", "example": "Technology has transformed our lives."},
    {"word": "establish", "definition": "to create or set up", "example": "We have established a successful business."},
    {"word": "contribute", "definition": "to give or add to", "example": "I have contributed to various charities."},
    {"word": "acquire", "definition": "to gain or obtain", "example": "He has acquired valuable skills."},
    {"word": "maintain", "definition": "to keep or preserve", "example": "She has maintained good relationships."}
  ]
}',
'[
  {"type": "experience", "text": "I have lived in three different countries", "usage": "Life experience without specific time"},
  {"type": "recent", "text": "She has just finished her presentation", "usage": "Recent completion with ''just''"},
  {"type": "duration", "text": "We have been friends for over 10 years", "usage": "Duration with ''for''"},
  {"type": "since", "text": "He has worked here since 2018", "usage": "Starting point with ''since''"},
  {"type": "never", "text": "I have never been to Australia", "usage": "Negative experience"},
  {"type": "question", "text": "Have you ever tried Japanese food?", "usage": "Experience question with ''ever''"}
]', 1);

-- B2 Lesson 1 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Complete: "I ___ to Japan three times."', '["went", "have been", "have gone", "was"]', 'have been', 'Use "have been" for experiences of visiting places', 1, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Choose the correct form: "She ___ her homework yet."', '["didn''t finish", "hasn''t finished", "don''t finish", "isn''t finish"]', 'hasn''t finished', 'Use Present Perfect with "yet" in negative sentences', 2, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Complete: "They have lived here ___ 2015."', '["for", "since", "ago", "during"]', 'since', 'Use "since" with a starting point (year)', 3, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Choose the time marker: "I have ___ finished my work."', '["yesterday", "just", "last week", "ago"]', 'just', '"Just" is used with Present Perfect for recent completion', 4, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Complete: "___ you ever been to Europe?"', '["Do", "Did", "Have", "Are"]', 'Have', 'Use "Have" for Present Perfect experience questions', 5, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Choose the duration: "We have known each other ___ five years."', '["since", "for", "ago", "in"]', 'for', 'Use "for" with a period of time', 6, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Complete: "He has ___ tried sushi before."', '["ever", "never", "already", "yet"]', 'never', '"Never" means "not ever" in experiences', 7, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Choose the correct response: "Have you finished?" "Yes, I have ___ done it."', '["yet", "never", "already", "ever"]', 'already', '"Already" is used in positive responses', 8, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Complete: "This experience has ___ my perspective on life."', '["change", "changed", "changing", "changes"]', 'changed', 'Use past participle "changed" in Present Perfect', 9, 10, 'multiple_choice'),
('b16i959h-bdde-5gfc-ch36-e17g7h98f53e', 'Choose the past participle: "I have ___ many obstacles in my career."', '["overcome", "overcame", "overcoming", "overcomes"]', 'overcome', '"Overcome" is both the base form and past participle', 10, 10, 'multiple_choice');

-- C1 Level - Lesson 1: Advanced Grammar and Sophisticated Communication
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'introduction', 'Advanced Grammar Structures and Nuanced Communication', 
'Master complex grammatical structures and develop sophisticated communication skills for academic and professional contexts.',
'{
  "sections": [
    {
      "title": "Subjunctive Mood",
      "content": "Expressing hypothetical situations, wishes, and recommendations: I suggest that he be promoted"
    },
    {
      "title": "Inversion Patterns",
      "content": "Formal structures: Never have I seen such dedication. Should you need assistance..."
    },
    {
      "title": "Cleft Sentences",
      "content": "Emphasis structures: It was John who called. What I need is time."
    },
    {
      "title": "Conditional Variations",
      "content": "Mixed conditionals, inverted conditionals: Were I to accept, Had I known..."
    }
  ],
  "vocabulary": [
    {"word": "mandatory", "definition": "required, compulsory", "example": "It is mandatory that all employees attend the meeting."},
    {"word": "paramount", "definition": "of utmost importance", "example": "Customer satisfaction is paramount to our success."},
    {"word": "unprecedented", "definition": "never done before", "example": "The company achieved unprecedented growth."},
    {"word": "meticulous", "definition": "very careful and precise", "example": "She showed meticulous attention to detail."},
    {"word": "intricate", "definition": "very complex", "example": "The project involves intricate planning."},
    {"word": "compelling", "definition": "convincing, persuasive", "example": "He presented a compelling argument."},
    {"word": "inherent", "definition": "existing as a natural part", "example": "There are inherent risks in any investment."},
    {"word": "substantial", "definition": "considerable, significant", "example": "We need substantial evidence to proceed."},
    {"word": "comprehensive", "definition": "complete, thorough", "example": "The report provides comprehensive analysis."},
    {"word": "innovative", "definition": "introducing new ideas", "example": "The company is known for innovative solutions."}
  ]
}',
'[
  {"type": "subjunctive", "text": "I recommend that she take the advanced course", "usage": "Formal recommendation with subjunctive"},
  {"type": "inversion", "text": "Rarely do we encounter such dedication", "usage": "Emphatic inversion with negative adverb"},
  {"type": "cleft", "text": "What concerns me most is the lack of communication", "usage": "Wh-cleft for emphasis"},
  {"type": "conditional", "text": "Had I realized the complexity, I would have allocated more time", "usage": "Third conditional with inversion"},
  {"type": "formal", "text": "Should any issues arise, please contact our support team", "usage": "Formal conditional instruction"},
  {"type": "emphasis", "text": "It is precisely this approach that yields results", "usage": "It-cleft with adverb for strong emphasis"}
]', 1);

-- C1 Lesson 1 Exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Complete the subjunctive: "I suggest that he ___ the presentation tomorrow."', '["gives", "give", "giving", "to give"]', 'give', 'Use base form after "suggest that" in subjunctive mood', 1, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Choose the inverted form: "___ have I witnessed such unprofessional behavior."', '["Never", "Always", "Often", "Sometimes"]', 'Never', 'Negative adverbs trigger inversion: Never + auxiliary + subject', 2, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Complete the cleft sentence: "___ I need is more time to complete this project."', '["That", "What", "Which", "Who"]', 'What', 'Wh-cleft sentences start with "What" for emphasis', 3, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Choose the mixed conditional: "___ I known about the deadline, I would be finished now."', '["If", "Had", "When", "Should"]', 'Had', 'Mixed conditional with inversion: Had + past participle', 4, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Complete: "Customer satisfaction is ___ to our company''s success."', '["important", "paramount", "good", "nice"]', 'paramount', '"Paramount" means of utmost importance (C1 vocabulary)', 5, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Choose the formal conditional: "___ you require assistance, please don''t hesitate to ask."', '["If", "Should", "When", "While"]', 'Should', '"Should you..." is a formal conditional structure', 6, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Complete the emphasis structure: "It was Maria ___ recommended this approach."', '["that", "who", "which", "whom"]', 'who', '"Who" is used in it-cleft sentences for people', 7, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Choose the sophisticated vocabulary: "The research requires ___ analysis of the data."', '["good", "nice", "meticulous", "careful"]', 'meticulous', '"Meticulous" shows precision and sophistication', 8, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Complete the inversion: "___ the weather improve, we''ll proceed with the outdoor event."', '["Should", "If", "When", "Will"]', 'Should', 'Inverted conditional: Should + subject + base verb', 9, 15, 'multiple_choice'),
('c27j060i-ceef-6hgd-di47-f28h8i09g64f', 'Choose the advanced structure: "What makes this solution ___ is its innovative approach."', '["good", "nice", "compelling", "okay"]', 'compelling', '"Compelling" means convincing/persuasive (advanced vocabulary)', 10, 15, 'multiple_choice');

-- C2 Level - Lesson 1: Mastery Level Communication and Discourse
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) VALUES
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'introduction', 'Mastery Level Communication and Advanced Discourse', 
'Achieve native-like fluency with sophisticated discourse markers, nuanced expressions, and complex rhetorical structures.',
'{
  "sections": [
    {
      "title": "Discourse Markers",
      "content": "Advanced linking: Notwithstanding, albeit, inasmuch as, insofar as, hitherto"
    },
    {
      "title": "Hedging and Mitigation",
      "content": "Softening statements: It would seem that, there appears to be, one might argue"
    },
    {
      "title": "Rhetorical Devices",
      "content": "Persuasive techniques: parallelism, antithesis, rhetorical questions"
    },
    {
      "title": "Register Variation",
      "content": "Adapting language for academic, diplomatic, literary, and technical contexts"
    }
  ],
  "vocabulary": [
    {"word": "ubiquitous", "definition": "present everywhere", "example": "Smartphones have become ubiquitous in modern society."},
    {"word": "paradigmatic", "definition": "serving as a typical example", "example": "His leadership style is paradigmatic of modern management."},
    {"word": "quintessential", "definition": "representing the most perfect example", "example": "She is the quintessential professional."},
    {"word": "inexorable", "definition": "impossible to stop", "example": "The inexorable march of technological progress continues."},
    {"word": "propensity", "definition": "natural tendency", "example": "He has a propensity for analytical thinking."},
    {"word": "acumen", "definition": "keen insight", "example": "Her business acumen is widely recognized."},
    {"word": "perspicacious", "definition": "having keen insight", "example": "His perspicacious analysis revealed hidden trends."},
    {"word": "sagacious", "definition": "wise and prudent", "example": "The sagacious investor avoided the market crash."},
    {"word": "erudite", "definition": "showing great learning", "example": "The professor''s erudite lecture impressed the audience."},
    {"word": "magnanimous", "definition": "generous in forgiving", "example": "Her magnanimous response to criticism was admirable."}
  ]
}',
'[
  {"type": "hedging", "text": "It would appear that the data suggests a correlation", "usage": "Academic hedging for tentative claims"},
  {"type": "concession", "text": "Albeit challenging, the project proved successful", "usage": "Formal concession with advanced connector"},
  {"type": "emphasis", "text": "Not only did she excel academically, but she also demonstrated exceptional leadership", "usage": "Rhetorical emphasis structure"},
  {"type": "mitigation", "text": "One might reasonably argue that further investigation is warranted", "usage": "Diplomatic mitigation of strong claims"},
  {"type": "sophistication", "text": "Notwithstanding the inherent complexities, the solution proved efficacious", "usage": "Formal register with sophisticated vocabulary"},
  {"type": "parallelism", "text": "To innovate, to inspire, to transform - these are our core objectives", "usage": "Rhetorical parallelism for impact"}
]', 1);

-- C2 Lesson 1 Exercises  
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Choose the sophisticated discourse marker: "___ the challenges, the team achieved remarkable results."', '["Despite", "Although", "Notwithstanding", "Even though"]', 'Notwithstanding', '"Notwithstanding" is a formal, sophisticated discourse marker', 1, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Complete the hedging expression: "The evidence ___ suggest a correlation between the variables."', '["clearly", "obviously", "would appear to", "definitely"]', 'would appear to', 'Hedging language softens claims in academic discourse', 2, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Choose the most sophisticated vocabulary: "His business ___ is widely recognized in the industry."', '["skills", "knowledge", "acumen", "ability"]', 'acumen', '"Acumen" demonstrates C2-level vocabulary sophistication', 3, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Complete the rhetorical structure: "Not only did the policy succeed, ___ it exceeded all expectations."', '["and", "but", "also", "too"]', 'but', '"Not only...but" creates emphatic contrast', 4, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Choose the formal concession: "___ brief, the presentation was remarkably comprehensive."', '["Although", "Though", "While", "Albeit"]', 'Albeit', '"Albeit" is a formal, concise concessive conjunction', 5, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Complete the mitigation: "One ___ reasonably conclude that intervention is necessary."', '["can", "must", "might", "should"]', 'might', '"Might" provides appropriate mitigation for conclusions', 6, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Choose the sophisticated descriptor: "Technology has become ___ in modern education."', '["common", "popular", "widespread", "ubiquitous"]', 'ubiquitous', '"Ubiquitous" shows mastery-level vocabulary', 7, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Complete the formal structure: "___ as the methodology may be, it yields reliable results."', '["Complex", "Difficult", "Challenging", "Intricate"]', 'Intricate', '"Intricate as it may be" shows sophisticated concession', 8, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Choose the diplomatic language: "The proposal ___ merit further consideration."', '["needs", "requires", "would appear to", "must"]', 'would appear to', 'Diplomatic hedging avoids overly direct statements', 9, 20, 'multiple_choice'),
('d38k171j-dfgf-7ihd-ej58-g39i9j10h75g', 'Complete the erudite expression: "Her ___ response to the criticism demonstrated remarkable maturity."', '["good", "nice", "positive", "magnanimous"]', 'magnanimous', '"Magnanimous" shows sophisticated emotional vocabulary', 10, 20, 'multiple_choice');