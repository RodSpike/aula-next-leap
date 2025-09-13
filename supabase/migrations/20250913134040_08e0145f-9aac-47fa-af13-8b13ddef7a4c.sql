-- Add some sample exercises for A1 lessons
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, exercise_type, order_index)
SELECT l.id, exercise.question, exercise.options, exercise.correct_answer, exercise.explanation, exercise.exercise_type, exercise.order_index
FROM lessons l
CROSS JOIN (VALUES
  ('Choose the correct form of "to be":', '["I am happy", "I is happy", "I are happy", "I be happy"]'::jsonb, 'I am happy', 'Use "am" with "I"', 'multiple_choice', 1),
  ('What is the plural of "country"?', '["countrys", "countries", "countryes", "countris"]'::jsonb, 'countries', 'Change "y" to "ies" for words ending in consonant + y', 'multiple_choice', 2),
  ('Complete: "She _____ English every day."', '["study", "studies", "studys", "studying"]'::jsonb, 'studies', 'Add "s" or "es" to verbs with he/she/it', 'multiple_choice', 1),
  ('Which is a question word?', '["Because", "Where", "Always", "Beautiful"]'::jsonb, 'Where', 'Question words ask for information', 'multiple_choice', 2),
  ('How do you say "15" in English?', '["Fiveteen", "Fifteen", "Fifty", "Fiftteen"]'::jsonb, 'Fifteen', 'Numbers from 13-19 end in -teen', 'multiple_choice', 1),
  ('Complete: "I _____ go to the gym."', '["never", "Never", "not never", "no never"]'::jsonb, 'never', 'Adverbs of frequency go before the main verb', 'multiple_choice', 2),
  ('What is your father''s wife called?', '["Sister", "Mother", "Aunt", "Cousin"]'::jsonb, 'Mother', 'Your father''s wife is your mother', 'multiple_choice', 1),
  ('Complete: "_____ are three books on the table."', '["There", "They", "Their", "Theirs"]'::jsonb, 'There', 'Use "There are" for plural things that exist', 'multiple_choice', 2)
) AS exercise(question, options, correct_answer, explanation, exercise_type, order_index)
WHERE l.course_id = 'f3e17a99-681c-4258-8c3c-b083d5efb0c5' AND l.order_index <= 8;