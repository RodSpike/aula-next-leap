-- Add exercises for Core Concepts, Practice, and Review lessons

-- Add exercises for Basic Greetings Core Concepts
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
    ('Choose the informal greeting:', '["How do you do?", "Good evening", "Hey, what is up?", "It is a pleasure to meet you"]', 'Hey, what is up?', '"Hey, what is up?" is a very casual, informal greeting used with friends.', 1),
    ('Which response is appropriate for "How are you?"', '["My name is John", "I am fine, thank you", "Nice to meet you", "I am from Canada"]', 'I am fine, thank you', '"How are you?" asks about your well-being, so "I am fine, thank you" is the appropriate response.', 2),
    ('Complete: "They ___ from Australia."', '["am", "is", "are", "be"]', 'are', 'Use "are" with "they": "They are from Australia."', 3),
    ('What is the correct contraction for "I am"?', '["Im", "I am", "Iam", "I-am"]', 'I am', 'The contraction for "I am" is "I am" but contractions are often written as "I am" in formal writing.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Basic Greetings%' AND l.title LIKE '%Core Concepts%';

-- Add exercises for Basic Greetings Practice
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
    ('In a business meeting, which greeting is most appropriate?', '["Hey there!", "What is up?", "Good morning, how do you do?", "Hi buddy!"]', 'Good morning, how do you do?', 'In formal business settings, use formal greetings like "Good morning" combined with "How do you do?"', 1),
    ('If someone says "Nice to meet you," what should you NOT say?', '["Nice to meet you too", "The pleasure is mine", "How are you?", "Likewise"]', 'How are you?', '"How are you?" is not a response to "Nice to meet you." The appropriate responses are reciprocal greetings.', 2),
    ('Complete this introduction: "I would like you to ___ my colleague Sarah."', '["meet", "know", "see", "find"]', 'meet', 'The correct phrase is "I would like you to meet..." when introducing someone.', 3)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Basic Greetings%' AND l.title LIKE '%Practice%';

-- Add exercises for Basic Greetings Review
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
    ('Which greeting is appropriate for 8 PM?', '["Good morning", "Good afternoon", "Good evening", "Good night"]', 'Good evening', 'Good evening is used from 6 PM to 10 PM. Good night is used when leaving or going to bed.', 1),
    ('What is the most versatile greeting you can use anytime?', '["Good morning", "How do you do?", "Hello", "What is up?"]', 'Hello', '"Hello" can be used at any time of day and in most situations, formal or informal.', 2),
    ('In formal situations, which title is used for a married woman?', '["Miss", "Mrs.", "Ms.", "Madam"]', 'Mrs.', 'Mrs. is traditionally used for married women, though Ms. is becoming more common as it does not indicate marital status.', 3)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Basic Greetings%' AND l.title LIKE '%Review%';

-- Add comprehensive content and exercises for Numbers & Time lessons
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Numbers & Time') THEN
    E'# Introduction to Numbers & Time\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Count from 1 to 100 in English\n- Tell time using both 12-hour and 24-hour formats\n- Use ordinal numbers (1st, 2nd, 3rd, etc.)\n- Express dates, months, and years\n- Perform basic mathematical operations in English\n\n## Cardinal Numbers (1-20)\n1 = one, 2 = two, 3 = three, 4 = four, 5 = five\n6 = six, 7 = seven, 8 = eight, 9 = nine, 10 = ten\n11 = eleven, 12 = twelve, 13 = thirteen, 14 = fourteen, 15 = fifteen\n16 = sixteen, 17 = seventeen, 18 = eighteen, 19 = nineteen, 20 = twenty\n\n## Tens (20-100)\n20 = twenty, 30 = thirty, 40 = forty, 50 = fifty\n60 = sixty, 70 = seventy, 80 = eighty, 90 = ninety, 100 = one hundred\n\n## Time Vocabulary\n- Clock, watch, time\n- Hour, minute, second\n- AM (morning) / PM (afternoon/evening)\n- O clock, quarter, half\n- Early, late, on time\n\n## Basic Math Operations\n- Plus (+) = addition\n- Minus (-) = subtraction\n- Times (×) = multiplication\n- Divided by (÷) = division\n- Equals (=) = result'
  
  WHEN title LIKE '%Core Concepts%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Numbers & Time') THEN
    E'# Core Concepts: Numbers & Time\n\n## Telling Time\n\n### Digital Time\n- 9:00 = "nine o clock"\n- 9:15 = "nine fifteen" or "quarter past nine"\n- 9:30 = "nine thirty" or "half past nine"\n- 9:45 = "nine forty-five" or "quarter to ten"\n\n### Asking About Time\n- What time is it?\n- What is the time?\n- Do you have the time?\n- Could you tell me the time?\n\n### Time Expressions\n- **Exact time:** It is exactly 3 o clock\n- **Approximate:** It is about 3 o clock / around 3\n- **Before/After:** It is almost 3 / It is just after 3\n\n## Days of the Week\nMonday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday\n\n### Prepositions with Days\n- On Monday / On weekdays / On weekends\n- This Monday / Next Tuesday / Last Wednesday\n\n## Months of the Year\nJanuary, February, March, April, May, June\nJuly, August, September, October, November, December\n\n### Prepositions with Months\n- In January / In summer / In 2024\n- At the beginning/end of March\n\n## Ordinal Numbers\n1st = first, 2nd = second, 3rd = third\n4th = fourth, 5th = fifth, 6th = sixth\n7th = seventh, 8th = eighth, 9th = ninth, 10th = tenth\n\n### Using Ordinals\n- Dates: March 3rd (March third)\n- Floors: 2nd floor (second floor)\n- Ranking: 1st place (first place)\n\n## Age and Years\n- How old are you? → I am 25 years old\n- When were you born? → I was born in 1998\n- What year is it? → It is 2024'
  
  ELSE content
END
WHERE title LIKE '%Numbers & Time%';

-- Add exercises for Numbers & Time Introduction
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
    ('How do you say "15" in English?', '["fifty", "fifteen", "fourteen", "five"]', 'fifteen', '15 is pronounced "fifteen" in English.', 1),
    ('What comes after "nineteen"?', '["twenty", "twenty-one", "thirty", "ninety"]', 'twenty', 'After nineteen (19) comes twenty (20).', 2),
    ('Which number is spelled correctly?', '["fourty", "forty", "fourthy", "fourty"]', 'forty', 'The correct spelling is "forty" (not "fourty").', 3),
    ('Complete: "10 + 10 = ___"', '["thirty", "twenty", "twelve", "eleven"]', 'twenty', '10 + 10 = 20, which is "twenty" in English.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Numbers & Time%' AND l.title LIKE '%Introduction%';

-- Add exercises for Numbers & Time Core Concepts
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
    ('What time is 9:45?', '["Quarter past nine", "Half past nine", "Quarter to ten", "Nine forty"]', 'Quarter to ten', '9:45 is "quarter to ten" because it is 15 minutes before 10 o clock.', 1),
    ('Which month comes before April?', '["May", "March", "February", "January"]', 'March', 'The months in order are: January, February, March, April, May...', 2),
    ('How do you say the date "March 3rd"?', '["March three", "March third", "Three March", "Third March"]', 'March third', 'Dates with ordinal numbers are spoken as "March third" for March 3rd.', 3),
    ('What day comes after Wednesday?', '["Tuesday", "Thursday", "Friday", "Monday"]', 'Thursday', 'The days of the week in order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Numbers & Time%' AND l.title LIKE '%Core Concepts%';