-- Add exercises to all lessons that currently have no exercises
-- First, let's add basic exercises for lessons without any

-- Add 4 exercises for each lesson that has no exercises
WITH lessons_without_exercises AS (
  SELECT l.id, l.title, l.course_id
  FROM lessons l
  LEFT JOIN exercises e ON l.id = e.lesson_id
  WHERE e.lesson_id IS NULL
)
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    lwe.id,
    'What is the main focus of this lesson?',
    '["Understanding the fundamentals", "Memorizing vocabulary", "Practicing grammar rules", "Reading comprehension"]'::jsonb,
    'Understanding the fundamentals',
    'Understanding fundamentals is crucial for building a strong foundation in any subject.',
    1
FROM lessons_without_exercises lwe;

-- Add second exercise for each lesson without exercises
WITH lessons_without_exercises AS (
  SELECT l.id, l.title, l.course_id
  FROM lessons l
  LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 2
  WHERE e.lesson_id IS NULL
)
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    lwe.id,
    'Which concept is most important to understand first?',
    '["The basic principles", "Advanced techniques", "Complex theories", "Historical context"]'::jsonb,
    'The basic principles',
    'Basic principles form the core of all advanced learning.',
    2
FROM lessons_without_exercises lwe;

-- Add third exercise for each lesson without exercises
WITH lessons_without_exercises AS (
  SELECT l.id, l.title, l.course_id
  FROM lessons l
  LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 3
  WHERE e.lesson_id IS NULL
)
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    lwe.id,
    'How would you apply this concept in practice?',
    '["In daily conversations", "In academic writing", "In professional settings", "All of the above"]'::jsonb,
    'All of the above',
    'Knowledge is most valuable when applied across different contexts.',
    3
FROM lessons_without_exercises lwe;

-- Add fourth exercise for each lesson without exercises
WITH lessons_without_exercises AS (
  SELECT l.id, l.title, l.course_id
  FROM lessons l
  LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 4
  WHERE e.lesson_id IS NULL
)
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    lwe.id,
    'What is the key takeaway from this section?',
    '["Practice regularly", "Study theory only", "Avoid mistakes", "Focus on perfection"]'::jsonb,
    'Practice regularly',
    'Regular practice is the key to mastery and improvement.',
    4
FROM lessons_without_exercises lwe;