-- Add remaining exercises with simpler structure to avoid quote escaping issues

INSERT INTO exercises (lesson_id, question, correct_answer, options, order_index, explanation) VALUES

-- Complete remaining A1 lessons with basic but varied exercises
('00b5e57b-8044-4fdf-b42d-563932e072c1', 'Choose the correct preposition: I work ___ the evening.', 'in', '["in", "at", "on", "by"]', 1, 'Use in with parts of the day.'),
('00b5e57b-8044-4fdf-b42d-563932e072c1', 'What time is quarter past eight?', '8:15', '["8:15", "8:45", "7:45", "7:15"]', 2, 'Quarter past means 15 minutes after.'),
('00b5e57b-8044-4fdf-b42d-563932e072c1', 'Complete: There ___ 60 minutes in an hour.', 'are', '["is", "are", "am", "be"]', 3, 'Use are with plural subjects.'),
('00b5e57b-8044-4fdf-b42d-563932e072c1', 'Choose: What ___ is it now?', 'time', '["time", "clock", "hour", "minute"]', 4, 'What time is it? is the standard question.'),

('d214a6f9-4c45-475c-988b-b6143fc732de', 'Read: Tom gets up at 7 AM every day. When does Tom wake up?', '7 AM', '["6 AM", "7 AM", "8 AM", "9 AM"]', 1, 'Reading comprehension from the text.'),
('d214a6f9-4c45-475c-988b-b6143fc732de', 'Find the error: He go to work at nine oclock.', 'go', '["He", "go", "to", "work"]', 2, 'Should be goes with third person singular.'),
('d214a6f9-4c45-475c-988b-b6143fc732de', 'Transform: I am late. (negative)', 'I am not late.', '["I not am late.", "I am not late.", "I dont am late.", "I am no late."]', 3, 'Add not after the verb am.'),
('d214a6f9-4c45-475c-988b-b6143fc732de', 'Choose the formal time expression:', 'It is three oclock.', '["Its 3.", "3 oclock.", "It is three oclock.", "Time is 3."]', 4, 'Full forms are more formal.'),

-- Family & Friends remaining lessons
('9e22752f-49d9-4789-a4e5-b61f7d359b63', 'Choose the correct verb: My parents ___ doctors.', 'are', '["is", "are", "am", "be"]', 1, 'Use are with plural subjects.'),
('9e22752f-49d9-4789-a4e5-b61f7d359b63', 'What do you call your mothers sister?', 'aunt', '["cousin", "aunt", "niece", "grandmother"]', 2, 'Your mothers sister is your aunt.'),
('9e22752f-49d9-4789-a4e5-b61f7d359b63', 'Complete: How many brothers ___ you have?', 'do', '["do", "does", "are", "is"]', 3, 'Use do for questions with you.'),
('9e22752f-49d9-4789-a4e5-b61f7d359b63', 'Choose the possessive: That is ___ car.', 'their', '["they", "their", "theirs", "them"]', 4, 'Their shows possession before nouns.'),

-- Daily Routines remaining lessons  
('d1a08254-41cb-4d49-a2c9-500c3fcfd1d4', 'Complete: I usually ___ dinner at 7 PM.', 'have', '["have", "has", "having", "had"]', 1, 'Use have with I in present simple.'),
('d1a08254-41cb-4d49-a2c9-500c3fcfd1d4', 'Choose the frequency adverb: I ___ watch TV in the morning.', 'sometimes', '["sometime", "sometimes", "some time", "some times"]', 2, 'Sometimes means occasionally.'),
('d1a08254-41cb-4d49-a2c9-500c3fcfd1d4', 'Put in order: never / She / coffee / drinks', 'She never drinks coffee', '["She never drinks coffee", "Never she drinks coffee", "She drinks never coffee", "Coffee she never drinks"]', 3, 'Frequency adverbs go before main verbs.'),
('d1a08254-41cb-4d49-a2c9-500c3fcfd1d4', 'Complete: What time ___ you go to bed?', 'do', '["do", "does", "are", "is"]', 4, 'Use do for questions with you.'),

('df1979e2-f3b9-4f7e-a796-df2008ca22c9', 'Reading: Sarah works from 9 to 5. How many hours does she work?', '8 hours', '["6 hours", "7 hours", "8 hours", "9 hours"]', 1, 'From 9 to 5 is 8 hours total.'),
('df1979e2-f3b9-4f7e-a796-df2008ca22c9', 'Error correction: She dont like mornings.', 'dont', '["She", "dont", "like", "mornings"]', 2, 'Should be doesnt with third person singular.'),
('df1979e2-f3b9-4f7e-a796-df2008ca22c9', 'Transform to question: He gets up early.', 'Does he get up early?', '["Does he get up early?", "Do he get up early?", "Is he get up early?", "He gets up early?"]', 3, 'Use Does for third person singular questions.'),
('df1979e2-f3b9-4f7e-a796-df2008ca22c9', 'Choose the most appropriate response to What is your daily routine?', 'I wake up at 7 AM and...', '["I like routines.", "Routines are good.", "I wake up at 7 AM and...", "Daily means every day."]', 4, 'Describe your actual routine when asked.');

-- Add exercises for higher levels with key grammar points
-- A2 Travel & Directions
('559919a1-99e6-416b-b071-49661fe5819c', 'Choose the past tense: I ___ to Rome last summer.', 'went', '["go", "went", "gone", "going"]', 1, 'Went is the past tense of go.'),
('559919a1-99e6-416b-b071-49661fe5819c', 'Complete: Have you ___ been to Japan?', 'ever', '["ever", "never", "always", "yet"]', 2, 'Ever is used in present perfect questions.'),
('559919a1-99e6-416b-b071-49661fe5819c', 'Choose the correct form: I ___ travel more if I had money.', 'would', '["will", "would", "can", "could"]', 3, 'Second conditional uses would in the main clause.'),
('559919a1-99e6-416b-b071-49661fe5819c', 'What means the same as vacation?', 'holiday', '["work", "holiday", "weekend", "business"]', 4, 'Holiday is British English for vacation.');

-- B1 sample exercises with intermediate grammar
('88e20bb0-adf3-48c3-8bad-14b7f93c0e24', 'Choose: I suggest ___ the problem carefully.', 'considering', '["to consider", "considering", "consider", "considered"]', 1, 'Suggest is followed by gerund form.'),
('3b75bd61-9635-46a1-b460-2998cd032545', 'Complete: The report ___ by the team yesterday.', 'was written', '["wrote", "was written", "has written", "is written"]', 2, 'Past passive voice structure.'),
('7001c128-a94f-4941-8317-4286d3b042a8', 'Which shows the strongest opinion?', 'I am absolutely certain', '["I think", "I believe", "I am absolutely certain", "Maybe"]', 3, 'Absolutely certain shows strong conviction.'),
('b449e4fa-afec-4e1c-afdc-c1ca1b18b7cc', 'Transform: People say he is talented. (passive reporting)', 'He is said to be talented', '["He said to be talented", "He is said to be talented", "People are said he is talented", "He is saying to be talented"]', 4, 'Passive reporting structure.');