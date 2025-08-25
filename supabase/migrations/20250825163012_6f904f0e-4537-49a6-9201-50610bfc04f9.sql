-- Add exercises for remaining A1 lessons

-- Daily Routines
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

('e1677188-653d-43c4-a0e5-315f16f4fb2d', 'Choose the correct time phrase: "I wake up ___ 7 AM."', 'at', '["in", "at", "on", "by"]', 1, 'Use "at" with specific times.'),
('e1677188-653d-43c4-a0e5-315f16f4fb2d', 'What''s the third person singular of "study"?', 'studies', '["study", "studies", "studys", "studying"]', 2, 'Add -ies for verbs ending in consonant + y.'),
('e1677188-653d-43c4-a0e5-315f16f4fb2d', 'Complete: "She ___ breakfast every morning."', 'has', '["have", "has", "having", "had"]', 3, 'Use "has" with third person singular in present simple.'),
('e1677188-653d-43c4-a0e5-315f16f4fb2d', 'Choose the adverb of frequency: "I ___ go to bed at 10 PM."', 'usually', '["usual", "usually", "use", "using"]', 4, 'Adverbs of frequency describe how often we do something.'),

('095ffe71-83bd-4f8d-afbe-5342c819f27b', 'Put in order: "always / I / coffee / drink"', 'I always drink coffee', '["I always drink coffee", "Always I drink coffee", "I drink always coffee", "Coffee I always drink"]', 1, 'Adverbs of frequency go before main verbs.'),
('095ffe71-83bd-4f8d-afbe-5342c819f27b', 'Choose the correct negative: "He ___ work on Sundays."', 'doesn''t', '["don''t", "doesn''t", "isn''t", "aren''t"]', 2, 'Use "doesn''t" with third person singular.'),
('095ffe71-83bd-4f8d-afbe-5342c819f27b', 'Complete: "How often ___ you exercise?"', 'do', '["do", "does", "are", "is"]', 3, 'Use "do" for questions with "you".'),
('095ffe71-83bd-4f8d-afbe-5342c819f27b', 'Choose the correct preposition: "I work ___ the morning."', 'in', '["in", "at", "on", "by"]', 4, 'Use "in" with parts of the day.'),

-- Food & Shopping
('d7552a4f-0677-4621-bd68-9bf742db9b0f', 'What''s the plural of "tomato"?', 'tomatoes', '["tomatos", "tomatoes", "tomato", "tomatoe"]', 1, 'Add -es to words ending in -o.'),
('d7552a4f-0677-4621-bd68-9bf742db9b0f', 'Complete: "I''d like ___ apple, please."', 'an', '["a", "an", "the", ""]', 2, 'Use "an" before vowel sounds.'),
('d7552a4f-0677-4621-bd68-9bf742db9b0f', 'Choose the countable noun:', 'apple', '["water", "milk", "apple", "rice"]', 3, 'Apples can be counted individually.'),
('d7552a4f-0677-4621-bd68-9bf742db9b0f', 'What do you say when asking for the price?', 'How much is it?', '["How much is it?", "How many is it?", "What much is it?", "How cost is it?"]', 4, 'Use "How much" for price questions.'),

-- A2 Future Plans
('4cbe8d29-eda7-4e4d-bf48-f0c89de179ac', 'Choose the future form: "I ___ travel to Japan next year."', 'will', '["will", "would", "shall", "should"]', 1, '"Will" expresses future intention.'),
('4cbe8d29-eda7-4e4d-bf48-f0c89de179ac', 'Complete: "She ___ going to study medicine."', 'is', '["am", "is", "are", "be"]', 2, 'Use "is" with third person singular for "going to" future.'),
('4cbe8d29-eda7-4e4d-bf48-f0c89de179ac', 'Which expresses a planned future action?', 'I''m going to visit my parents.', '["I will visit my parents.", "I''m going to visit my parents.", "I visit my parents.", "I visited my parents."]', 3, '"Going to" shows planned actions.'),
('4cbe8d29-eda7-4e4d-bf48-f0c89de179ac', 'Choose the question form: "___ you come to the party?"', 'Will', '["Do", "Are", "Will", "Did"]', 4, 'Use "Will" for future questions with "will".'),

('a3b6268b-2c10-4a63-885e-fa35df89c3ec', 'Choose the correct form: "If it rains, I ___ stay home."', 'will', '["will", "would", "am", "going"]', 1, 'First conditional: if + present, ... will + base verb.'),
('a3b6268b-2c10-4a63-885e-fa35df89c3ec', 'Complete the time clause: "When I ___ 18, I''ll go to university."', 'am', '["am", "will be", "would be", "was"]', 2, 'Use present tense in time clauses with future meaning.'),
('a3b6268b-2c10-4a63-885e-fa35df89c3ec', 'What''s the difference between "will" and "going to"?', 'Will = spontaneous, going to = planned', '["No difference", "Will = past, going to = future", "Will = spontaneous, going to = planned", "Going to = formal, will = informal"]', 3, '"Will" for spontaneous decisions, "going to" for planned actions.'),
('a3b6268b-2c10-4a63-885e-fa35df89c3ec', 'Complete: "I think it ___ rain tomorrow."', 'will', '["will", "is going to", "going to", "shall"]', 4, 'Use "will" with "think" for predictions.');

-- Add exercises for all remaining lessons across all levels
-- B1 level examples
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

-- For B1 lessons (using actual lesson IDs from the database)
-- Technology lessons
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B1' AND l.title LIKE '%Introduction%' LIMIT 1), 'Choose the correct conditional: "If I ___ more time, I would learn programming."', 'had', '["have", "had", "would have", "will have"]', 1, 'Second conditional uses past tense in the if-clause.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B1' AND l.title LIKE '%Core Concepts%' LIMIT 1), 'Complete: "The app ___ by millions of people every day."', 'is used', '["uses", "is used", "using", "used"]', 2, 'Passive voice: subject + be + past participle.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B1' AND l.title LIKE '%Practice%' LIMIT 1), 'Which relative pronoun is correct? "The person ___ created this website is very talented."', 'who', '["who", "which", "that", "whose"]', 3, 'Use "who" for people as subjects.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B1' AND l.title LIKE '%Review%' LIMIT 1), 'Choose the correct form: "I suggest ___ a different approach."', 'trying', '["to try", "trying", "try", "tried"]', 4, '"Suggest" is followed by gerund (-ing form).'),

-- B2 level examples  
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B2' AND l.title LIKE '%Introduction%' LIMIT 1), 'Complete: "I wish I ___ more confident in presentations."', 'were', '["was", "were", "am", "would be"]', 1, 'Use "were" in all persons for hypothetical wishes.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B2' AND l.title LIKE '%Core Concepts%' LIMIT 1), 'Choose: "The manager insisted that everyone ___ on time."', 'be', '["is", "was", "be", "would be"]', 2, 'Subjunctive mood after "insist that".'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B2' AND l.title LIKE '%Practice%' LIMIT 1), 'Select the correct form: "___ the rain, we continued our hike."', 'Despite', '["Despite", "Although", "However", "Because"]', 3, '"Despite" + noun phrase shows contrast.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B2' AND l.title LIKE '%Review%' LIMIT 1), 'Transform: "They say he is very talented." → "He ___ very talented."', 'is said to be', '["is said to be", "is said being", "said to be", "is saying to be"]', 4, 'Passive reporting structure: is said to be.');

-- C1 level examples (advanced grammar)
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C1' AND l.title LIKE '%Introduction%' LIMIT 1), 'Choose the most sophisticated option: "The research shows conclusive evidence."', 'The findings substantiate', '["The research shows", "The findings substantiate", "Studies say", "Data tells us"]', 1, 'Advanced vocabulary: "substantiate" is more academic.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C1' AND l.title LIKE '%Core Concepts%' LIMIT 1), 'Select the correct inversion: "Not only ___ the project successful, but it also exceeded expectations."', 'was', '["the project was", "was the project", "was", "did the project"]', 2, 'Inversion after "Not only" in formal contexts.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C1' AND l.title LIKE '%Practice%' LIMIT 1), 'Complete: "The proposal ___ thorough consideration before implementation."', 'warrants', '["needs", "requires", "warrants", "wants"]', 3, '"Warrants" is more formal and precise.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C1' AND l.title LIKE '%Review%' LIMIT 1), 'Choose the appropriate register: "The committee ___ the motion."', 'ratified', '["agreed to", "said yes to", "ratified", "liked"]', 4, '"Ratified" is formal/legal language.');

-- C2 level examples (expert language use)
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C2' AND l.title LIKE '%Introduction%' LIMIT 1), 'Select the most nuanced option: "The policy had ___ consequences."', 'far-reaching', '["big", "important", "far-reaching", "serious"]', 1, '"Far-reaching" shows sophisticated vocabulary.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C2' AND l.title LIKE '%Core Concepts%' LIMIT 1), 'Choose the subjunctive: "It is imperative that the guidelines ___ strictly followed."', 'be', '["are", "were", "be", "would be"]', 2, 'Subjunctive mood after "imperative that".'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C2' AND l.title LIKE '%Practice%' LIMIT 1), 'Complete: "The phenomenon ___ extensive research over decades."', 'has undergone', '["has had", "has undergone", "has experienced", "has seen"]', 3, '"Undergone" collocates naturally with research.'),
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C2' AND l.title LIKE '%Review%' LIMIT 1), 'Select the most precise alternative: "The theory lacks empirical support."', 'is devoid of empirical substantiation', '["has no proof", "lacks empirical support", "is devoid of empirical substantiation", "needs more evidence"]', 4, 'C2 level requires sophisticated expression.');