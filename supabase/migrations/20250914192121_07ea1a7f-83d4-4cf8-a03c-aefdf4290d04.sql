-- Delete existing exercises for lesson 1 that don't match the content
DELETE FROM exercises WHERE lesson_id = '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a';

-- Insert new exercises aligned with lesson 1 content: Meet and Greet + Verb To Be
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index, points, exercise_type) VALUES
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Complete: "Hi! My name ___ Ana."',
  '["am", "is", "are", "be"]',
  'is',
  'Use "is" with "my name" (3rd person singular)',
  1,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Which is a formal greeting?',
  '["Hey!", "What''s up?", "Good morning!", "Hi!"]',
  'Good morning!',
  '"Good morning" is a formal way to greet someone',
  2,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Complete: "I ___ a student."',
  '["am", "is", "are", "be"]',
  'am',
  'Use "am" with "I"',
  3,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Make this negative: "She is happy." → "She ___ happy."',
  '["am not", "is not", "are not", "not is"]',
  'is not',
  'Use "is not" or "isn''t" to make negative sentences with "she"',
  4,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Complete the question: "___ are you from?"',
  '["Who", "What", "Where", "When"]',
  'Where',
  '"Where" is used to ask about location or origin',
  5,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Complete: "They ___ my friends."',
  '["am", "is", "are", "be"]',
  'are',
  'Use "are" with "they"',
  6,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Which response is correct for "How are you?"',
  '["I am from Brazil", "My name is João", "I am fine, thank you", "I am 25 years old"]',
  'I am fine, thank you',
  '"How are you?" asks about your condition or feelings',
  7,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Complete the question: "___ is your teacher?"',
  '["Who", "What", "Where", "How"]',
  'Who',
  '"Who" is used to ask about people',
  8,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a', 
  'Make this a question: "You are happy." → "___ you happy?"',
  '["Am", "Is", "Are", "Be"]',
  'Are',
  'Move "are" to the beginning to make a yes/no question',
  9,
  10,
  'multiple_choice'
),
(
  '7dd2515d-79aa-4dc8-bdf2-a83c4d54b19a',
  'Which is an informal greeting?',
  '["Good evening!", "Good afternoon!", "Hey!", "How are you?"]',
  'Hey!',
  '"Hey!" is an informal, casual way to greet someone',
  10,
  10,
  'multiple_choice'
);