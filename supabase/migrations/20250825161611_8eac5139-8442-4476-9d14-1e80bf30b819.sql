-- Add exercises to all lessons that currently have no exercises
-- This will ensure every lesson has at least 3-5 exercises for students to practice

-- Get all lessons without exercises and add exercises for them
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id as lesson_id,
    CASE 
        WHEN l.title LIKE '%Core Concepts%' THEN 
            CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
                WHEN 1 THEN 'What is the main focus of this lesson?'
                WHEN 2 THEN 'Which concept is most important to understand first?'
                WHEN 3 THEN 'How would you apply this concept in practice?'
                WHEN 4 THEN 'What is the key takeaway from this section?'
                ELSE 'Which example best demonstrates the concept?'
            END
        WHEN l.title LIKE '%Practice & Application%' THEN
            CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
                WHEN 1 THEN 'Which practice method would be most effective?'
                WHEN 2 THEN 'How would you implement this in real situations?'
                WHEN 3 THEN 'What is the best way to practice this skill?'
                WHEN 4 THEN 'Which scenario demonstrates proper application?'
                ELSE 'How can you improve your performance?'
            END
        WHEN l.title LIKE '%Review & Assessment%' THEN
            CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
                WHEN 1 THEN 'What did you learn from this course section?'
                WHEN 2 THEN 'Which skill area needs more practice?'
                WHEN 3 THEN 'How would you rate your understanding?'
                WHEN 4 THEN 'What will you focus on next?'
                ELSE 'Which concept was most challenging?'
            END
        ELSE 
            CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
                WHEN 1 THEN 'What is the main topic of this lesson?'
                WHEN 2 THEN 'Which point is most important?'
                WHEN 3 THEN 'How can you use this knowledge?'
                WHEN 4 THEN 'What should you remember most?'
                ELSE 'Which example is most helpful?'
            END
    END as question,
    CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
        WHEN 1 THEN '["Understanding the fundamentals", "Memorizing vocabulary", "Practicing grammar rules", "Reading comprehension"]'::jsonb
        WHEN 2 THEN '["The basic principles", "Advanced techniques", "Complex theories", "Historical context"]'::jsonb
        WHEN 3 THEN '["In daily conversations", "In academic writing", "In professional settings", "All of the above"]'::jsonb
        WHEN 4 THEN '["Practice regularly", "Study theory only", "Avoid mistakes", "Focus on perfection"]'::jsonb
        ELSE '["The first option", "The second option", "The third option", "The fourth option"]'::jsonb
    END as options,
    CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
        WHEN 1 THEN 'Understanding the fundamentals'
        WHEN 2 THEN 'The basic principles'
        WHEN 3 THEN 'All of the above'
        WHEN 4 THEN 'Practice regularly'
        ELSE 'The first option'
    END as correct_answer,
    CASE ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id)
        WHEN 1 THEN 'Understanding fundamentals is crucial for building a strong foundation in any subject.'
        WHEN 2 THEN 'Basic principles form the core of all advanced learning.'
        WHEN 3 THEN 'Knowledge is most valuable when applied across different contexts.'
        WHEN 4 THEN 'Regular practice is the key to mastery and improvement.'
        ELSE 'This option represents the most logical choice for this context.'
    END as explanation,
    ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY l.id) as order_index
FROM lessons l
LEFT JOIN exercises e ON l.id = e.lesson_id
WHERE e.lesson_id IS NULL  -- Only lessons with no exercises
CROSS JOIN generate_series(1, 4) -- Generate 4 exercises per lesson
ORDER BY l.title, l.order_index;

-- Now add specific exercises for different course levels and topics
-- Academic Writing exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    CASE 
        WHEN l.title LIKE '%Academic Writing%' AND l.title LIKE '%Introduction%' THEN 'What is the most important element of academic writing?'
        WHEN l.title LIKE '%Academic Writing%' AND l.title LIKE '%Core Concepts%' THEN 'Which structure is recommended for academic essays?'
        WHEN l.title LIKE '%Academic Writing%' AND l.title LIKE '%Practice%' THEN 'How should you cite sources in academic writing?'
        WHEN l.title LIKE '%Academic Writing%' AND l.title LIKE '%Review%' THEN 'What makes academic writing different from other forms?'
        ELSE 'What is academic writing?'
    END,
    '["Clear thesis statement", "Long sentences", "Complex vocabulary", "Personal opinions"]'::jsonb,
    'Clear thesis statement',
    'A clear thesis statement guides the entire essay and helps readers understand your main argument.',
    5
FROM lessons l
WHERE l.title LIKE '%Academic Writing%' AND NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.lesson_id = l.id AND e.order_index = 5
);

-- Business English exercises  
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    CASE 
        WHEN l.title LIKE '%Business English%' AND l.title LIKE '%Core Concepts%' THEN 'What is essential for professional communication?'
        WHEN l.title LIKE '%Business English%' AND l.title LIKE '%Practice%' THEN 'How should you end a business email?'
        WHEN l.title LIKE '%Business English%' AND l.title LIKE '%Review%' THEN 'What tone should business writing maintain?'
        ELSE 'What characterizes business English?'
    END,
    '["Formal tone and clarity", "Casual language", "Emotional expressions", "Personal stories"]'::jsonb,
    'Formal tone and clarity',
    'Business communication requires a formal, clear, and professional tone to be effective.',
    5
FROM lessons l
WHERE l.title LIKE '%Business English%' AND NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.lesson_id = l.id AND e.order_index = 5
);

-- Daily Routines exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'What time do you usually wake up?',
    '["At 7:00 AM", "At 7:00 PM", "At 7:00", "7 o''clock in the evening"]'::jsonb,
    'At 7:00 AM',
    'When talking about morning routines, we specify AM to be clear about the time of day.',
    5
FROM lessons l
WHERE l.title LIKE '%Daily Routines%' AND NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.lesson_id = l.id AND e.order_index = 5
);

-- Culture & Traditions exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    'Which is an example of cultural sensitivity?',
    '["Learning local customs", "Ignoring differences", "Speaking louder", "Avoiding interaction"]'::jsonb,
    'Learning local customs',
    'Cultural sensitivity involves understanding and respecting local customs and traditions.',
    5
FROM lessons l
WHERE l.title LIKE '%Culture%' AND NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.lesson_id = l.id AND e.order_index = 5
);