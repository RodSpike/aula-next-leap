-- First, let's clean up and recreate comprehensive content for all A1 lessons
DELETE FROM lesson_content WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  JOIN courses c ON l.course_id = c.id 
  WHERE c.level = 'A1'
);

DELETE FROM exercises WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  JOIN courses c ON l.course_id = c.id 
  WHERE c.level = 'A1'
);

-- Insert comprehensive lesson content for A1 Level
-- Lesson 1: Meet and Greet + Verb To Be
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) 
SELECT l.id, 'introduction', 'Meet and Greet + Verb To Be', 
'Master the fundamentals of English communication! Learn how to greet people, introduce yourself, and use the essential verb "to be" in all its forms. This lesson covers formal and informal greetings, personal introductions, and the basic structure that forms the foundation of English grammar.',
jsonb_build_object(
  'sections', jsonb_build_array(
    jsonb_build_object('title', 'Essential Greetings', 'content', 'Hello, Hi, Good morning, Good afternoon, Good evening, Good night, How are you?, Nice to meet you, See you later, Goodbye, Bye, Take care'),
    jsonb_build_object('title', 'Introducing Yourself', 'content', 'My name is..., I am..., I come from..., I live in..., I work as..., I study at..., Nice to meet you, Pleased to meet you'),
    jsonb_build_object('title', 'Verb To Be - Present Tense', 'content', 'I am (I''m), You are (You''re), He is (He''s), She is (She''s), It is (It''s), We are (We''re), They are (They''re)'),
    jsonb_build_object('title', 'Question Formation', 'content', 'Am I?, Are you?, Is he/she/it?, Are we?, Are they?, What is your name?, Where are you from?, How are you?')
  ),
  'vocabulary', jsonb_build_array(
    jsonb_build_object('word', 'hello', 'definition', 'a friendly greeting', 'example', 'Hello! How are you today?', 'pronunciation', '/həˈloʊ/'),
    jsonb_build_object('word', 'goodbye', 'definition', 'a farewell when leaving', 'example', 'Goodbye! See you tomorrow.', 'pronunciation', '/ɡʊdˈbaɪ/'),
    jsonb_build_object('word', 'name', 'definition', 'what someone is called', 'example', 'My name is Sarah.', 'pronunciation', '/neɪm/'),
    jsonb_build_object('word', 'from', 'definition', 'indicating origin or source', 'example', 'I am from Brazil.', 'pronunciation', '/frʌm/'),
    jsonb_build_object('word', 'nice', 'definition', 'pleasant or agreeable', 'example', 'Nice to meet you!', 'pronunciation', '/naɪs/'),
    jsonb_build_object('word', 'meet', 'definition', 'to encounter for the first time', 'example', 'Nice to meet you, John.', 'pronunciation', '/miːt/'),
    jsonb_build_object('word', 'student', 'definition', 'a person who studies', 'example', 'I am a student at university.', 'pronunciation', '/ˈstuːdənt/'),
    jsonb_build_object('word', 'teacher', 'definition', 'a person who teaches', 'example', 'She is a teacher at school.', 'pronunciation', '/ˈtiːʧər/'),
    jsonb_build_object('word', 'work', 'definition', 'to have a job', 'example', 'I work in an office.', 'pronunciation', '/wɜrk/'),
    jsonb_build_object('word', 'live', 'definition', 'to have your home somewhere', 'example', 'I live in New York.', 'pronunciation', '/lɪv/')
  )
),
jsonb_build_array(
  jsonb_build_object('text', 'Good morning, Maria!', 'type', 'formal_greeting', 'usage', 'Before 12 PM, formal situations'),
  jsonb_build_object('text', 'Hi there, how''s it going?', 'type', 'informal_greeting', 'usage', 'Casual, with friends'),
  jsonb_build_object('text', 'My name is Carlos, and I am from Mexico.', 'type', 'introduction', 'usage', 'Introducing yourself'),
  jsonb_build_object('text', 'Where are you from?', 'type', 'question', 'usage', 'Asking about origin'),
  jsonb_build_object('text', 'I am a doctor.', 'type', 'profession', 'usage', 'Stating your job'),
  jsonb_build_object('text', 'She is not here today.', 'type', 'negative', 'usage', 'Negative statement'),
  jsonb_build_object('text', 'Are you ready?', 'type', 'yes_no_question', 'usage', 'Yes/no questions')
), 1
FROM lessons l JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';

-- Add exercises for Lesson 1
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, exercise_type, order_index, points)
SELECT l.id, 
'Choose the correct greeting for the morning:', 
jsonb_build_array('Good night', 'Good morning', 'Good afternoon', 'Goodbye'),
'Good morning',
'We use "Good morning" to greet people before 12 PM.',
'multiple_choice', 0, 10
FROM lessons l JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, exercise_type, order_index, points)
SELECT l.id,
'Complete: "My name ___ John."',
jsonb_build_array('am', 'is', 'are', 'be'),
'is',
'We use "is" with singular subjects like names. "My name is John."',
'multiple_choice', 1, 10
FROM lessons l JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, exercise_type, order_index, points)
SELECT l.id,
'Which is the correct question?',
jsonb_build_array('Where you are from?', 'Where are you from?', 'Where from you are?', 'From where you are?'),
'Where are you from?',
'In questions with "be", we put the verb before the subject: "Where are you from?"',
'multiple_choice', 2, 10
FROM lessons l JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, exercise_type, order_index, points)
SELECT l.id,
'Choose the negative form: "She ___ a student."',
jsonb_build_array('is not', 'are not', 'am not', 'not is'),
'is not',
'For negative with "she", we use "is not" or the contraction "isn''t".',
'multiple_choice', 3, 10
FROM lessons l JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';