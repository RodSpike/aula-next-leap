-- Add A2 exercises and B1 content

-- A2 Past Experiences exercises
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
    ('Which is the correct past tense of "go"?', '["goed", "went", "gone", "going"]', 'went', 'The irregular past tense of "go" is "went".', 1),
    ('Choose the correct sentence:', '["I have visited Paris last year", "I visited Paris last year", "I visit Paris last year", "I am visiting Paris last year"]', 'I visited Paris last year', 'Use simple past with specific time references like "last year".', 2),
    ('Complete: "Have you ___ been to Japan?"', '["never", "ever", "already", "yet"]', 'ever', '"Ever" is used in questions with present perfect to ask about lifetime experiences.', 3),
    ('Which time expression goes with present perfect?', '["yesterday", "last week", "already", "two days ago"]', 'already', '"Already" is used with present perfect to show something happened before now.', 4),
    ('What is the past participle of "see"?', '["saw", "seen", "seeing", "sees"]', 'seen', 'The past participle of "see" is "seen", used with have/has.', 5)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Past Experiences%' AND l.title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = l.course_id AND courses.level = 'A2');

-- A2 Travel & Directions exercises
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
    ('How do you politely ask for directions?', '["Where is the station?", "Excuse me, how do I get to the station?", "Station where?", "Tell me station location"]', 'Excuse me, how do I get to the station?', 'Start with "Excuse me" to be polite when asking for directions.', 1),
    ('If someone says "turn left at the traffic lights", what do you do?', '["Turn right", "Go straight", "Turn left when you see traffic lights", "Stop at traffic lights"]', 'Turn left when you see traffic lights', 'Follow the direction given at the landmark mentioned.', 2),
    ('Which preposition is correct: "The bank is ___ the corner"?', '["in", "at", "on", "by"]', 'at', 'Use "at" with corners: "at the corner".', 3),
    ('What does "You cannot miss it" mean?', '["It is very small", "It is easy to find", "It is closed", "It is far away"]', 'It is easy to find', '"You cannot miss it" means something is very obvious and easy to find.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Travel & Directions%' AND l.title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = l.course_id AND courses.level = 'A2');

-- B1 Level Content - Expressing Opinions
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B1' AND courses.title = 'Expressing Opinions') THEN
    E'# Introduction to Expressing Opinions\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Express personal opinions clearly and confidently\n- Agree and disagree politely in discussions\n- Support your opinions with reasons and examples\n- Use appropriate language for different levels of certainty\n- Navigate debates and discussions respectfully\n\n## Key Vocabulary\n\n**Opinion Expressions:**\n- In my opinion, I think, I believe, I feel\n- From my point of view, as far as I am concerned\n- It seems to me that, I would say that\n- Personally, honestly, frankly speaking\n\n**Agreement:**\n- I totally agree, I completely agree\n- You are absolutely right, exactly\n- I could not agree more, that is a good point\n- I see your point, I share your view\n\n**Disagreement:**\n- I am afraid I disagree, I see it differently\n- I am not sure about that, I have doubts about\n- That is not necessarily true, I would argue that\n- I understand your point, but...\n\n## Grammar Focus\n- Modal verbs for opinions (might, could, should, must)\n- Conditional structures (If I were you, I would...)\n- Comparative and superlative forms for evaluating\n- Linking words for giving reasons (because, since, therefore)'
  
  WHEN title LIKE '%Core Concepts%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B1' AND courses.title = 'Expressing Opinions') THEN
    E'# Core Concepts: Expressing Opinions\n\n## Levels of Certainty\n\n### Strong Certainty\n- I am absolutely certain that...\n- I am convinced that...\n- There is no doubt that...\n- I am sure that...\n- It is definitely true that...\n\n### Moderate Certainty\n- I think/believe that...\n- It seems likely that...\n- I would say that...\n- It appears that...\n- Probably...\n\n### Low Certainty\n- I might be wrong, but...\n- It is possible that...\n- Perhaps..., maybe...\n- I am not entirely sure, but...\n- It could be that...\n\n## Supporting Your Opinion\n\n### Giving Reasons\n- The main reason is...\n- This is because...\n- The evidence shows that...\n- For instance/For example...\n- Studies have proven that...\n\n### Using Examples\n- Take... for example\n- A good example of this is...\n- This can be seen in...\n- Look at the case of...\n- Consider the situation where...\n\n## Polite Disagreement\n\n### Soft Disagreement\n- I see what you mean, but...\n- That is an interesting point, however...\n- I understand your perspective, although...\n- You make a valid point, nevertheless...\n\n### Direct but Polite\n- I am afraid I have to disagree\n- I am sorry, but I do not share that view\n- With respect, I think differently\n- I am not convinced by that argument\n\n## Discussion Strategies\n\n### Keeping the Conversation Going\n- What do you think about...?\n- How do you feel about...?\n- What is your take on...?\n- Do you see what I mean?\n- Would you agree that...?\n\n### Summarizing and Concluding\n- So, to sum up...\n- In conclusion...\n- The bottom line is...\n- All things considered...\n- At the end of the day...'
  
  ELSE content
END
WHERE EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B1' AND courses.title = 'Expressing Opinions');

-- B1 Environment & Society content
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B1' AND courses.title = 'Environment & Society') THEN
    E'# Introduction to Environment & Society\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Discuss environmental issues and their impact on society\n- Express concern about global problems\n- Propose solutions for environmental challenges\n- Understand the relationship between human behavior and the environment\n- Use advanced vocabulary related to sustainability and conservation\n\n## Key Vocabulary\n\n**Environmental Issues:**\n- Climate change, global warming, greenhouse effect\n- Pollution (air, water, soil, noise)\n- Deforestation, desertification, habitat destruction\n- Extinction, endangered species, biodiversity loss\n- Waste management, landfills, recycling\n\n**Solutions and Actions:**\n- Renewable energy, solar power, wind energy\n- Conservation, sustainability, eco-friendly\n- Reduce, reuse, recycle\n- Carbon footprint, carbon neutral\n- Organic farming, sustainable agriculture\n\n**Social Impact:**\n- Public awareness, environmental education\n- Government policies, regulations, legislation\n- Corporate responsibility, green business\n- Community involvement, grassroots movements\n- International cooperation, global initiatives\n\n## Grammar Focus\n- Future forms for predictions and possibilities\n- Conditional sentences for hypothetical situations\n- Passive voice for describing processes and problems\n- Complex sentence structures with multiple clauses'
  
  ELSE content
END
WHERE EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B1' AND courses.title = 'Environment & Society');