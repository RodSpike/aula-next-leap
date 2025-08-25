-- Add exercises for remaining lessons with proper escaping

-- Continue adding A1 exercises for remaining lessons
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

-- A1 Food & Shopping - Core Concepts, Practice, Review
('f9127fc0-124a-4bdc-8e21-9d21dbc74940', 'Choose: "I need ___ sugar for the recipe."', 'some', '["some", "a", "an", "any"]', 1, 'Use "some" with uncountable nouns in positive statements.'),
('f9127fc0-124a-4bdc-8e21-9d21dbc74940', 'Complete: "Are there ___ eggs in the fridge?"', 'any', '["some", "any", "a", "an"]', 2, 'Use "any" in questions with plural/uncountable nouns.'),
('f9127fc0-124a-4bdc-8e21-9d21dbc74940', 'What''s the opposite of "expensive"?', 'cheap', '["free", "cheap", "small", "old"]', 3, 'Cheap is the direct opposite of expensive.'),
('f9127fc0-124a-4bdc-8e21-9d21dbc74940', 'Choose the correct quantifier: "___ bread, please."', 'Some', '["A", "An", "Some", "Any"]', 4, 'Use "some" when offering or requesting uncountable nouns.'),

('a84795d4-dbd5-43de-839a-666a963ed2b4', 'Complete the shopping dialogue: "Can I help you?" - "Yes, I''m ___ for a birthday gift."', 'looking', '["looking", "seeing", "watching", "finding"]', 1, '"Looking for" is the correct phrasal verb for searching.'),
('a84795d4-dbd5-43de-839a-666a963ed2b4', 'Choose: "This shirt is ___ small. Do you have a larger size?"', 'too', '["very", "too", "so", "quite"]', 2, '"Too + adjective" indicates excess/problem.'),
('a84795d4-dbd5-43de-839a-666a963ed2b4', 'What do you say to ask about payment methods?', 'Do you accept credit cards?', '["How much money?", "Do you accept credit cards?", "What is payment?", "Where is money?"]', 3, 'Standard question about payment options.'),
('a84795d4-dbd5-43de-839a-666a963ed2b4', 'Complete: "I''d like to ___ this dress on."', 'try', '["put", "try", "wear", "take"]', 4, '"Try on" means to test clothing before buying.'),

-- B1 Level - Expressing Opinions (intermediate grammar)
('88e20bb0-adf3-48c3-8bad-14b7f93c0e24', 'Choose the correct opinion phrase: "___ that online learning is effective."', 'I believe', '["I am believing", "I believe", "I am believe", "I believing"]', 1, 'Opinion verbs use simple present, not continuous.'),
('88e20bb0-adf3-48c3-8bad-14b7f93c0e24', 'Complete: "What do you ___ about the new policy?"', 'think', '["think", "thinking", "thought", "thinks"]', 2, 'Questions use base form after auxiliary "do".'),
('88e20bb0-adf3-48c3-8bad-14b7f93c0e24', 'Which shows stronger agreement?', 'I completely agree', '["I think so", "Maybe", "I completely agree", "I suppose"]', 3, '"Completely" intensifies the agreement.'),
('88e20bb0-adf3-48c3-8bad-14b7f93c0e24', 'Choose the polite disagreement: "___, I think differently."', 'I''m afraid', '["You''re wrong", "That''s stupid", "I''m afraid", "No way"]', 4, '"I''m afraid" softens disagreement politely.'),

('3b75bd61-9635-46a1-b460-2998cd032545', 'Choose the subjunctive: "I suggest that he ___ more practice."', 'get', '["gets", "getting", "get", "got"]', 1, 'Subjunctive uses base form after "suggest that".'),
('3b75bd61-9635-46a1-b460-2998cd032545', 'Complete: "It''s important ___ both sides of the argument."', 'to consider', '["considering", "to consider", "consider", "considered"]', 2, '"It''s + adjective + to infinitive" structure.'),
('3b75bd61-9635-46a1-b460-2998cd032545', 'Which modal expresses possibility?', 'might', '["must", "should", "might", "will"]', 3, '"Might" shows uncertain possibility.'),
('3b75bd61-9635-46a1-b460-2998cd032545', 'Choose: "The evidence ___ that the theory is correct."', 'suggests', '["suggest", "suggests", "suggesting", "suggested"]', 4, 'Third person singular takes -s in present simple.'),

-- B1 Media & Technology (passive voice, conditionals)
('1cc0be4c-3b6d-4c95-9026-ce8497dcfbe7', 'Transform to passive: "People use smartphones everywhere."', 'Smartphones are used everywhere', '["Smartphones use everywhere", "Smartphones are used everywhere", "Smartphones are using everywhere", "People are used smartphones"]', 1, 'Passive: object becomes subject + be + past participle.'),
('1cc0be4c-3b6d-4c95-9026-ce8497dcfbe7', 'Choose the second conditional: "If I ___ rich, I would buy a Tesla."', 'were', '["am", "was", "were", "would be"]', 2, 'Second conditional uses past tense (were for all persons).'),
('1cc0be4c-3b6d-4c95-9026-ce8497dcfbe7', 'Complete: "Social media ___ to connect with friends."', 'is used', '["uses", "is used", "using", "used"]', 3, 'Passive voice shows what social media is used for.'),
('1cc0be4c-3b6d-4c95-9026-ce8497dcfbe7', 'Which sentence shows cause and effect?', 'Technology has changed communication', '["I like technology", "Technology is useful", "Technology has changed communication", "Technology exists everywhere"]', 4, 'Present perfect shows impact over time.');

-- Add more B1 exercises for higher-level grammar concepts
('230e64fc-318b-4fc0-906f-5033e3453927', 'Choose the correct relative clause: "The app ___ I downloaded is very useful."', 'that', '["who", "where", "that", "when"]', 1, '"That" refers to things as objects in relative clauses.'),
('230e64fc-318b-4fc0-906f-5033e3453927', 'Complete: "I wish I ___ understand this software better."', 'could', '["can", "could", "will", "would"]', 2, '"Wish + could" expresses ability desires.'),
('230e64fc-318b-4fc0-906f-5033e3453927', 'Transform: "Someone hacked the system." (Passive)', 'The system was hacked', '["The system hacked", "The system was hacked", "Someone was hacked the system", "The system has hacked"]', 3, 'Past passive: was/were + past participle.'),
('230e64fc-318b-4fc0-906f-5033e3453927', 'Choose: "Unless you ___ the password, you cannot access the account."', 'know', '["will know", "know", "knew", "would know"]', 4, 'First conditional with "unless" uses present tense.');

-- Add sample exercises for B2, C1, C2 to demonstrate progression
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

-- B2 Level examples (more complex structures)
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'B2' LIMIT 1), 'Complete: "Had I known about the meeting, I ___ attended."', 'would have', '["would", "would have", "will have", "had"]', 1, 'Third conditional with inversion: Had + subject + past participle.'),

-- C1 Level examples (advanced structures)  
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C1' LIMIT 1), 'Choose the most formal option: "The research findings are..."', 'inconclusive', '["unclear", "not clear", "inconclusive", "mixed up"]', 1, '"Inconclusive" is more academic than "unclear".'),

-- C2 Level examples (expert-level language)
((SELECT id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.level = 'C2' LIMIT 1), 'Select the most nuanced expression: "The policy change was..."', 'a watershed moment', '["important", "big", "significant", "a watershed moment"]', 1, '"Watershed moment" shows sophisticated vocabulary use.');