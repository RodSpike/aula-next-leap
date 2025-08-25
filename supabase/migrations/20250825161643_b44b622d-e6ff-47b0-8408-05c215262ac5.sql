-- Add exercises to all lessons that currently have no exercises
-- First, let's add basic exercises for Core Concepts lessons
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'What is the main focus of this lesson?',
    '["Understanding the fundamentals", "Memorizing vocabulary", "Practicing grammar rules", "Reading comprehension"]'::jsonb,
    'Understanding the fundamentals',
    'Understanding fundamentals is crucial for building a strong foundation in any subject.',
    1
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 1
WHERE l.title LIKE '%Core Concepts%' AND e.lesson_id IS NULL;

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'Which concept is most important to understand first?',
    '["The basic principles", "Advanced techniques", "Complex theories", "Historical context"]'::jsonb,
    'The basic principles',
    'Basic principles form the core of all advanced learning.',
    2
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 2
WHERE l.title LIKE '%Core Concepts%' AND e.lesson_id IS NULL;

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'How would you apply this concept in practice?',
    '["In daily conversations", "In academic writing", "In professional settings", "All of the above"]'::jsonb,
    'All of the above',
    'Knowledge is most valuable when applied across different contexts.',
    3
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 3
WHERE l.title LIKE '%Core Concepts%' AND e.lesson_id IS NULL;

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'What is the key takeaway from this section?',
    '["Practice regularly", "Study theory only", "Avoid mistakes", "Focus on perfection"]'::jsonb,
    'Practice regularly',
    'Regular practice is the key to mastery and improvement.',
    4
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 4
WHERE l.title LIKE '%Core Concepts%' AND e.lesson_id IS NULL;

-- Add exercises for Practice & Application lessons
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'Which practice method would be most effective?',
    '["Regular repetition", "Passive reading", "Single session", "Theoretical study"]'::jsonb,
    'Regular repetition',
    'Regular, spaced repetition is the most effective learning method.',
    1
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 1
WHERE l.title LIKE '%Practice & Application%' AND e.lesson_id IS NULL;

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'How would you implement this in real situations?',
    '["Start with simple scenarios", "Jump to complex cases", "Avoid real practice", "Study more theory"]'::jsonb,
    'Start with simple scenarios',
    'Beginning with simple scenarios builds confidence before tackling complex situations.',
    2
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 2
WHERE l.title LIKE '%Practice & Application%' AND e.lesson_id IS NULL;

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'What is the best way to practice this skill?',
    '["Daily practice sessions", "Monthly review", "One-time study", "Passive observation"]'::jsonb,
    'Daily practice sessions',
    'Daily practice helps build muscle memory and fluency.',
    3
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 3
WHERE l.title LIKE '%Practice & Application%' AND e.lesson_id IS NULL;

-- Add exercises for Review & Assessment lessons
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'What did you learn from this course section?',
    '["Key concepts and applications", "Only vocabulary", "Grammar rules only", "Nothing significant"]'::jsonb,
    'Key concepts and applications',
    'Effective learning includes both understanding concepts and knowing how to apply them.',
    1
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 1
WHERE l.title LIKE '%Review & Assessment%' AND e.lesson_id IS NULL;

INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'Which skill area needs more practice?',
    '["Areas with lower scores", "Already mastered skills", "Easiest topics", "No additional practice needed"]'::jsonb,
    'Areas with lower scores',
    'Focusing on weaker areas helps achieve balanced improvement.',
    2
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 2
WHERE l.title LIKE '%Review & Assessment%' AND e.lesson_id IS NULL;

-- Add exercises for Introduction lessons that don't have them yet
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'What is the main topic of this lesson?',
    '["The lesson subject matter", "General English", "Unrelated content", "Personal opinions"]'::jsonb,
    'The lesson subject matter',
    'Each lesson focuses on specific learning objectives and subject matter.',
    1
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id AND e.order_index = 1
WHERE l.title LIKE '%Introduction%' AND e.lesson_id IS NULL;