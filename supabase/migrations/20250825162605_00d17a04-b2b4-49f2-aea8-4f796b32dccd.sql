-- Delete all existing repetitive exercises
DELETE FROM exercises;

-- Insert varied, Certificate exam-style exercises for A1 Level

-- A1 - Basic Greetings & Introductions - Introduction
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Introduction'), 'Choose the correct verb: "I ___ from Spain."', 'am', '["am", "is", "are", "be"]', 1, 'Use "am" with "I" in present simple statements.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Introduction'), 'What is the question word for asking about origin?', 'Where', '["What", "Where", "When", "Who"]', 2, '"Where" is used to ask about places and origin.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Introduction'), 'Complete: "Nice to ___ you."', 'meet', '["meet", "meat", "met", "meeting"]', 3, '"Nice to meet you" is the standard greeting expression.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Introduction'), 'Choose the formal way to ask someone''s name:', 'What is your name?', '["What is your name?", "What''s your name?", "Your name?", "Name?"]', 4, 'The full form is more formal than contractions.');

-- A1 - Basic Greetings & Introductions - Core Concepts  
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Core Concepts'), 'Choose the correct auxiliary for questions: "___ you from Italy?"', 'Are', '["Do", "Does", "Are", "Is"]', 1, 'Use "Are" with "you" for identity/origin questions.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Core Concepts'), 'What''s the plural of "person"?', 'people', '["persons", "people", "peoples", "person"]', 2, '"People" is the irregular plural of "person".'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Core Concepts'), 'Choose the correct possessive: "What is ___ job?"', 'your', '["you", "your", "yours", "you''re"]', 3, '"Your" is the possessive form before nouns.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Core Concepts'), 'Complete the pattern: "He is a teacher. She is ___ doctor."', 'a', '["a", "an", "the", ""]', 4, 'Use "a" before consonant sounds in job descriptions.');

-- A1 - Basic Greetings & Introductions - Practice & Application
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Practice & Application'), 'Reorder: "name / My / Sarah / is"', 'My name is Sarah', '["My name is Sarah", "Sarah is my name", "Name my is Sarah", "Is Sarah my name"]', 1, 'Subject + verb + object is the standard English word order.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Practice & Application'), 'Choose the appropriate response to "How are you?"', 'Fine, thanks. And you?', '["Fine, thanks. And you?", "My name is John", "I am 25", "I live in London"]', 2, 'This follows the social convention of reciprocal inquiry.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Practice & Application'), 'Which sentence is grammatically correct?', 'They are students.', '["They is students.", "They are students.", "They be students.", "They am students."]', 3, 'Use "are" with plural subjects like "they".'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Practice & Application'), 'Complete the conversation: A: "Where are you from?" B: "I''m ___ Brazil."', 'from', '["from", "in", "at", "of"]', 4, 'Use "from" to indicate country of origin.');

-- A1 - Basic Greetings & Introductions - Review & Assessment
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Review & Assessment'), 'Read: "Hi, I''m Ana. I''m a nurse from Portugal." What is Ana''s job?', 'nurse', '["teacher", "nurse", "doctor", "student"]', 1, 'The text states "I''m a nurse".'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Review & Assessment'), 'Choose the error: "She are from Germany."', 'are', '["She", "are", "from", "Germany"]', 2, 'Should be "is" with singular subject "she".'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Review & Assessment'), 'Transform to negative: "I am a student."', 'I am not a student.', '["I am not a student.", "I not am a student.", "I don''t am a student.", "I am no a student."]', 3, 'Add "not" after the verb "am" for negation.'),

((SELECT id FROM lessons WHERE title = 'Basic Greetings & Introductions - Review & Assessment'), 'Choose the most appropriate greeting for a business meeting:', 'Good morning. How do you do?', '["Hey! What''s up?", "Hi there!", "Good morning. How do you do?", "Yo! How''s it going?"]', 4, 'Formal situations require formal language.');

-- A1 - Numbers & Time - Introduction
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Introduction'), 'What number comes after nineteen?', 'twenty', '["twenty", "thirty", "ninety", "twelve"]', 1, 'The sequence continues: nineteen, twenty, twenty-one...'),

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Introduction'), 'Choose the correct time: "It''s half ___ three."', 'past', '["past", "to", "at", "in"]', 2, '"Half past" means 30 minutes after the hour.'),

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Introduction'), 'What''s the ordinal number for "3"?', 'third', '["three", "third", "thirty", "thirteen"]', 3, 'Ordinal numbers show position: first, second, third...'),

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Introduction'), 'Complete: "The meeting is ___ 2 o''clock."', 'at', '["at", "in", "on", "by"]', 4, 'Use "at" with specific times.');

-- A1 - Numbers & Time - Core Concepts
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Core Concepts'), 'Choose the correct preposition: "I work ___ Monday to Friday."', 'from', '["from", "in", "at", "on"]', 1, '"From...to" shows a range of days.'),

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Core Concepts'), 'What time is "quarter to nine"?', '8:45', '["8:45", "9:15", "8:15", "9:45"]', 2, '"Quarter to" means 15 minutes before the hour.'),

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Core Concepts'), 'Choose the plural form: "How many ___?"', 'children', '["child", "children", "childs", "childrens"]', 3, '"Children" is the irregular plural of "child".'),

((SELECT id FROM lessons WHERE title = 'Numbers & Time - Core Concepts'), 'Complete: "There ___ twelve months in a year."', 'are', '["is", "are", "be", "am"]', 4, 'Use "are" with plural subjects like "months".');

-- Continue with more A1 lessons...

-- A1 - Family & Friends - Introduction  
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Family & Friends - Introduction'), 'What do you call your father''s brother?', 'uncle', '["cousin", "uncle", "nephew", "grandfather"]', 1, 'Your father''s brother is your uncle.'),

((SELECT id FROM lessons WHERE title = 'Family & Friends - Introduction'), 'Choose the correct possessive: "This is ___ sister."', 'my', '["me", "my", "mine", "I"]', 2, '"My" shows possession before nouns.'),

((SELECT id FROM lessons WHERE title = 'Family & Friends - Introduction'), 'What''s the feminine form of "son"?', 'daughter', '["daughter", "sister", "mother", "aunt"]', 3, '"Daughter" is the female equivalent of "son".'),

((SELECT id FROM lessons WHERE title = 'Family & Friends - Introduction'), 'Complete: "How ___ people are in your family?"', 'many', '["much", "many", "long", "old"]', 4, 'Use "many" with countable nouns like "people".');

-- A2 Level Courses

-- A2 - Past Experiences - Introduction
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Past Experiences - Introduction'), 'Choose the past tense of "go":', 'went', '["goed", "went", "gone", "going"]', 1, '"Went" is the irregular past tense of "go".'),

((SELECT id FROM lessons WHERE title = 'Past Experiences - Introduction'), 'Complete: "I ___ to Paris last year."', 'went', '["go", "went", "gone", "going"]', 2, 'Use past tense for completed actions in the past.'),

((SELECT id FROM lessons WHERE title = 'Past Experiences - Introduction'), 'Which is correct for past questions?', 'Did you see the movie?', '["Did you see the movie?", "Did you saw the movie?", "Do you saw the movie?", "You did see the movie?"]', 3, 'Use "did" + base form for past questions.'),

((SELECT id FROM lessons WHERE title = 'Past Experiences - Introduction'), 'Choose the past tense of "have":', 'had', '["haved", "had", "has", "having"]', 4, '"Had" is the past tense of "have".');

-- A2 - Past Experiences - Core Concepts
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title = 'Past Experiences - Core Concepts'), 'Choose the correct form: "She ___ lived in London for five years."', 'has', '["have", "has", "had", "having"]', 1, 'Present perfect uses "has" with third person singular.'),

((SELECT id FROM lessons WHERE title = 'Past Experiences - Core Concepts'), 'What''s the past participle of "eat"?', 'eaten', '["ate", "eaten", "eating", "eated"]', 2, '"Eaten" is the past participle of "eat".'),

((SELECT id FROM lessons WHERE title = 'Past Experiences - Core Concepts'), 'Complete: "I have ___ been to Italy."', 'never', '["never", "ever", "always", "yet"]', 3, '"Never" means "not at any time" in perfect tenses.'),

((SELECT id FROM lessons WHERE title = 'Past Experiences - Core Concepts'), 'Choose the time expression for present perfect: "I have lived here ___ 2010."', 'since', '["since", "for", "ago", "in"]', 4, 'Use "since" with specific points in time.');

-- Continue with B1, B2, C1, C2 levels with progressively more complex exercises...

-- B1 Level Examples

-- B1 - Social Media & Technology - Core Concepts
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title LIKE '%Social Media & Technology - Core Concepts%' AND title LIKE '%B1%' LIMIT 1), 'Choose the correct conditional: "If I ___ more time, I would learn programming."', 'had', '["have", "had", "would have", "will have"]', 1, 'Second conditional uses past tense in the if-clause.'),

((SELECT id FROM lessons WHERE title LIKE '%Social Media & Technology - Core Concepts%' AND title LIKE '%B1%' LIMIT 1), 'Complete: "The app ___ by millions of people every day."', 'is used', '["uses", "is used", "using", "used"]', 2, 'Passive voice: subject + be + past participle.'),

((SELECT id FROM lessons WHERE title LIKE '%Social Media & Technology - Core Concepts%' AND title LIKE '%B1%' LIMIT 1), 'Which relative pronoun is correct? "The person ___ created this website is very talented."', 'who', '["who", "which", "that", "whose"]', 3, 'Use "who" for people as subjects.'),

((SELECT id FROM lessons WHERE title LIKE '%Social Media & Technology - Core Concepts%' AND title LIKE '%B1%' LIMIT 1), 'Choose the correct form: "I suggest ___ a different approach."', 'trying', '["to try", "trying", "try", "tried"]', 4, '"Suggest" is followed by gerund (-ing form).');

-- Add exercises for higher levels as examples

-- C1 Level Example 
INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

((SELECT id FROM lessons WHERE title LIKE '%Advanced Grammar%' AND title LIKE '%C1%' LIMIT 1), 'Choose the most appropriate option: "_____ the weather, the event was a great success."', 'Despite', '["Although", "Despite", "In spite", "However"]', 1, '"Despite" is followed directly by a noun phrase.'),

((SELECT id FROM lessons WHERE title LIKE '%Advanced Grammar%' AND title LIKE '%C1%' LIMIT 1), 'Select the correct inversion: "Only when the results were published ___ the truth."', 'did we learn', '["we learned", "did we learn", "we did learn", "learned we"]', 2, 'Inversion occurs after "Only when" in formal contexts.'),

((SELECT id FROM lessons WHERE title LIKE '%Advanced Grammar%' AND title LIKE '%C1%' LIMIT 1), 'Complete: "The committee recommended that the proposal ___ immediately."', 'be implemented', '["is implemented", "be implemented", "was implemented", "will be implemented"]', 3, 'Subjunctive mood uses base form after "recommend that".'),

((SELECT id FROM lessons WHERE title LIKE '%Advanced Grammar%' AND title LIKE '%C1%' LIMIT 1), 'Choose the most sophisticated alternative: "The research shows that..."', 'The findings indicate that', '["The research shows that", "The findings indicate that", "Studies say that", "Research tells us that"]', 4, '"Findings indicate" is more academic and precise.');

-- Add sample exercises for all remaining lessons with similar variety and progression