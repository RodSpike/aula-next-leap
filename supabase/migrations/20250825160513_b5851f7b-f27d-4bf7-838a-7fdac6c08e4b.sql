-- Add advanced level exercises and complete remaining content

-- B2 Business English exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    questions.question,
    questions.options::jsonb,
    questions.correct_answer,
    questions.explanation,
    questions.order_index
FROM lessons l
CROSS JOIN (
    VALUES
    ('Which is the most professional email greeting?', '["Hey there!", "Hi buddy!", "Dear Mr. Smith,", "Whats up?"]', 'Dear Mr. Smith,', 'Use formal titles and surnames in professional business correspondence.', 1),
    ('Complete: "We need to ___ the pros and cons."', '["weight", "weigh", "way", "wait"]', 'weigh', '"Weigh the pros and cons" means to carefully consider advantages and disadvantages.', 2),
    ('What does ROI stand for?', '["Return on Investment", "Rate of Interest", "Revenue over Income", "Risk of Investment"]', 'Return on Investment', 'ROI measures the efficiency of an investment relative to its cost.', 3),
    ('Which phrase is used to make a business proposal?', '["I want you to...", "You should...", "We would like to propose...", "You must..."]', 'We would like to propose...', 'This is a formal, polite way to present a business proposal.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Business English%' AND l.title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = l.course_id AND courses.level = 'B2');

-- C1 Literary Analysis exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    questions.question,
    questions.options::jsonb,
    questions.correct_answer,
    questions.explanation,
    questions.order_index
FROM lessons l
CROSS JOIN (
    VALUES
    ('What is a metaphor?', '["A direct comparison using like or as", "An indirect comparison without using like or as", "A sound repetition", "A character speaking"]', 'An indirect comparison without using like or as', 'A metaphor directly states one thing is another for comparison.', 1),
    ('What does foreshadowing do in literature?', '["Describes the setting", "Hints at future events", "Develops characters", "Creates rhyme"]', 'Hints at future events', 'Foreshadowing gives clues about what will happen later in the story.', 2),
    ('What is the climax of a story?', '["The beginning", "The turning point of highest tension", "The ending", "The setting description"]', 'The turning point of highest tension', 'The climax is the peak moment of conflict or tension in a narrative.', 3),
    ('What does an unreliable narrator do?', '["Tells the truth always", "Provides objective facts", "May mislead or have limited knowledge", "Speaks in third person"]', 'May mislead or have limited knowledge', 'An unreliable narrator cannot be trusted to tell the story accurately.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Literary Analysis%' AND l.title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = l.course_id AND courses.level = 'C1');

-- C2 Native-Level Fluency exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    questions.question,
    questions.options::jsonb,
    questions.correct_answer,
    questions.explanation,
    questions.order_index
FROM lessons l
CROSS JOIN (
    VALUES
    ('Which sentence shows the most sophisticated register?', '["Its good", "That is acceptable", "The proposal merits serious consideration", "OK sure"]', 'The proposal merits serious consideration', 'This shows advanced vocabulary and formal register appropriate for professional contexts.', 1),
    ('What is implicature in communication?', '["Direct meaning", "Implied meaning beyond literal words", "Loud speaking", "Written communication"]', 'Implied meaning beyond literal words', 'Implicature refers to what is suggested or implied rather than explicitly stated.', 2),
    ('Which shows mastery of subtle connotation?', '["The plan is cheap", "The plan is economical", "The plan costs less", "The plan is not expensive"]', 'The plan is economical', '"Economical" has positive connotations while "cheap" may suggest poor quality.', 3),
    ('What characterizes native-level discourse?', '["Perfect grammar only", "Effortless, appropriate, and nuanced communication", "No mistakes ever", "Formal language always"]', 'Effortless, appropriate, and nuanced communication', 'Native-level fluency involves natural, contextually appropriate language use with subtle understanding.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Native-Level Fluency%' AND l.title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = l.course_id AND courses.level = 'C2');

-- Add content for remaining A1 courses
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Food & Shopping') THEN
    E'# Introduction to Food & Shopping\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Order food in restaurants and cafes\n- Shop for groceries and ask about prices\n- Express food preferences and dietary requirements\n- Use polite language for requests and transactions\n- Understand basic shopping vocabulary and phrases\n\n## Key Vocabulary\n\n**Food Categories:**\n- Fruits: apple, banana, orange, grapes, strawberry\n- Vegetables: carrot, potato, tomato, lettuce, onion\n- Meat: chicken, beef, pork, fish, lamb\n- Dairy: milk, cheese, butter, yogurt, cream\n- Drinks: water, coffee, tea, juice, soda\n\n**Shopping Places:**\n- Supermarket, grocery store, bakery, butcher\n- Market, shopping mall, restaurant, cafe\n- Checkout, cashier, shopping cart, basket\n\n**Money and Quantities:**\n- Price, cost, expensive, cheap, free\n- A kilo of, a liter of, a piece of, a bottle of\n- How much?, How many?, Too much, enough\n\n## Grammar Focus\n- Countable and uncountable nouns\n- Some/any with food items\n- Would like vs want for polite requests\n- How much/How many questions'
  
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Daily Routines') THEN
    E'# Introduction to Daily Routines\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Describe your daily activities and schedule\n- Use time expressions and frequency adverbs\n- Talk about habits and regular activities\n- Ask about other people daily routines\n- Use present simple tense correctly\n\n## Key Vocabulary\n\n**Daily Activities:**\n- Wake up, get up, get dressed, have breakfast\n- Go to work/school, have lunch, come home\n- Watch TV, have dinner, go to bed, sleep\n- Brush teeth, take a shower, wash face\n\n**Time Expressions:**\n- In the morning/afternoon/evening\n- At night, at noon, at midnight\n- Early, late, on time\n- Before, after, during, while\n\n**Frequency Adverbs:**\n- Always, usually, often, sometimes\n- Rarely, never, every day, once a week\n- Twice a month, three times a year\n\n## Grammar Focus\n- Present simple tense for routines\n- Frequency adverbs placement\n- Time prepositions (at, in, on)\n- Question formation with "What time" and "When"'

  ELSE content
END
WHERE EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND (courses.title = 'Food & Shopping' OR courses.title = 'Daily Routines'));