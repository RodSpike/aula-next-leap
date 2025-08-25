-- Create comprehensive lesson content and exercises for all levels

-- First, let's update lesson content with detailed, structured content
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Introduction to Basic Greetings & Introductions\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Greet people formally and informally\n- Introduce yourself and others\n- Ask for and give basic personal information\n- Use appropriate greeting phrases for different times of day\n\n## Key Vocabulary\n**Greetings:**\n- Hello / Hi\n- Good morning / Good afternoon / Good evening\n- How are you? / How do you do?\n- Nice to meet you\n- Goodbye / Bye / See you later\n\n**Introductions:**\n- My name is...\n- I am... / I\'m...\n- This is...\n- What\'s your name?\n- Where are you from?\n\n## Grammar Focus\n- Present tense of "to be" (am, is, are)\n- Question formation with "What" and "Where"\n- Possessive adjectives (my, your, his, her)\n\n## Cultural Notes\nIn English-speaking countries, it\'s common to:\n- Shake hands when meeting someone new\n- Make eye contact during introductions\n- Use titles (Mr., Mrs., Ms.) in formal situations'
  
  WHEN title LIKE '%Core Concepts%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Core Concepts: Greetings and Introductions\n\n## Formal vs Informal Greetings\n\n### Formal Greetings\n- Good morning (before 12 PM)\n- Good afternoon (12 PM - 6 PM)\n- Good evening (after 6 PM)\n- How do you do? (very formal)\n- It\'s a pleasure to meet you\n\n### Informal Greetings\n- Hi / Hello\n- Hey (very casual)\n- How\'s it going?\n- What\'s up?\n\n## Personal Information Exchange\n\n### Essential Questions:\n- What\'s your name?\n- Where are you from?\n- What do you do?\n- How old are you?\n- Do you speak English?\n\n### Sample Responses:\n- My name is [Name]\n- I\'m from [Country/City]\n- I\'m a [profession]\n- I\'m [age] years old\n- Yes, a little / No, not really\n\n## Grammar Patterns\n\n### Present Tense "To Be"\n- I am (I\'m)\n- You are (You\'re)\n- He/She/It is (He\'s/She\'s/It\'s)\n- We are (We\'re)\n- They are (They\'re)\n\n### Question Formation\n- What + is + your name?\n- Where + are + you from?\n- How + are + you?'
  
  WHEN title LIKE '%Practice%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Practice & Application: Greetings and Introductions\n\n## Dialogue Practice\n\n### Scenario 1: Meeting a New Colleague\n**A:** Good morning! I don\'t think we\'ve met. I\'m Sarah.\n**B:** Good morning, Sarah. Nice to meet you. I\'m David.\n**A:** Nice to meet you too, David. What department are you in?\n**B:** I\'m in Marketing. How about you?\n**A:** I work in Human Resources.\n\n### Scenario 2: Casual Introduction\n**A:** Hi there! I\'m Mike.\n**B:** Hey Mike, I\'m Lisa. Are you new here?\n**A:** Yes, it\'s my first day. How long have you been working here?\n**B:** About two years now. Welcome to the team!\n\n## Common Mistakes to Avoid\n\n1. **Using "How do you do?" as a real question**\n   - Correct response: "How do you do?" (not details about your day)\n\n2. **Forgetting to reciprocate**\n   - When someone says "Nice to meet you," always respond with "Nice to meet you too"\n\n3. **Using wrong greeting for time of day**\n   - Don\'t say "Good morning" in the evening\n\n## Practice Activities\n\n### Activity 1: Fill in the blanks\nComplete these conversations with appropriate greetings:\n1. A: _______ morning! B: Good morning!\n2. A: What\'s _______ name? B: My name is John.\n3. A: Where are you _______? B: I\'m from Canada.\n\n### Activity 2: Match the situation\nMatch the greeting to the appropriate situation:\n- Business meeting → How do you do?\n- Meeting a friend → Hey, what\'s up?\n- First day at work → Good morning, I\'m [name]'
  
  WHEN title LIKE '%Review%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Review & Assessment: Greetings and Introductions\n\n## Summary of Key Points\n\n### Greetings by Time of Day\n- **Morning (6 AM - 12 PM):** Good morning\n- **Afternoon (12 PM - 6 PM):** Good afternoon\n- **Evening (6 PM - 10 PM):** Good evening\n- **Anytime:** Hello, Hi\n\n### Introduction Formulas\n1. **Introducing Yourself:**\n   - My name is... / I\'m...\n   - I\'m from... / I come from...\n   - I work as... / I\'m a...\n\n2. **Introducing Others:**\n   - This is my friend/colleague [name]\n   - I\'d like you to meet...\n   - Let me introduce you to...\n\n3. **Responding to Introductions:**\n   - Nice to meet you\n   - Pleased to meet you\n   - How do you do? (formal)\n\n### Essential Questions\n- What\'s your name?\n- Where are you from?\n- What do you do?\n- How are you?\n- Do you speak English?\n\n## Self-Assessment Checklist\n\n☐ I can greet people appropriately at different times of day\n☐ I can introduce myself with basic information\n☐ I can ask for someone\'s name and personal information\n☐ I can respond appropriately when someone introduces themselves\n☐ I understand the difference between formal and informal greetings\n☐ I can use the present tense of "to be" correctly\n\n## Common Phrases to Remember\n\n**Arriving:**\n- Good morning/afternoon/evening\n- Hello, how are you?\n- Nice to see you\n\n**Leaving:**\n- Goodbye\n- See you later\n- Have a nice day\n- Take care\n\n**Emergency Phrases:**\n- I\'m sorry, I don\'t understand\n- Could you repeat that, please?\n- I\'m still learning English\n- Nice to meet you (works in most situations!)'

  ELSE content
END
WHERE title LIKE '%Basic Greetings%';

-- Update Numbers & Time content
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Numbers & Time') THEN
    E'# Introduction to Numbers & Time\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Count from 1 to 100 in English\n- Tell time using both 12-hour and 24-hour formats\n- Use ordinal numbers (1st, 2nd, 3rd, etc.)\n- Express dates, months, and years\n- Perform basic mathematical operations in English\n\n## Cardinal Numbers (1-20)\n1 = one, 2 = two, 3 = three, 4 = four, 5 = five\n6 = six, 7 = seven, 8 = eight, 9 = nine, 10 = ten\n11 = eleven, 12 = twelve, 13 = thirteen, 14 = fourteen, 15 = fifteen\n16 = sixteen, 17 = seventeen, 18 = eighteen, 19 = nineteen, 20 = twenty\n\n## Tens (20-100)\n20 = twenty, 30 = thirty, 40 = forty, 50 = fifty\n60 = sixty, 70 = seventy, 80 = eighty, 90 = ninety, 100 = one hundred\n\n## Time Vocabulary\n- Clock, watch, time\n- Hour, minute, second\n- AM (morning) / PM (afternoon/evening)\n- O\'clock, quarter, half\n- Early, late, on time\n\n## Basic Math Operations\n- Plus (+) = addition\n- Minus (-) = subtraction  \n- Times (×) = multiplication\n- Divided by (÷) = division\n- Equals (=) = result'
  
  WHEN title LIKE '%Core Concepts%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Numbers & Time') THEN
    E'# Core Concepts: Numbers & Time\n\n## Telling Time\n\n### Digital Time\n- 9:00 = "nine o\'clock"\n- 9:15 = "nine fifteen" or "quarter past nine"\n- 9:30 = "nine thirty" or "half past nine"\n- 9:45 = "nine forty-five" or "quarter to ten"\n\n### Asking About Time\n- What time is it?\n- What\'s the time?\n- Do you have the time?\n- Could you tell me the time?\n\n### Time Expressions\n- **Exact time:** It\'s exactly 3 o\'clock\n- **Approximate:** It\'s about 3 o\'clock / around 3\n- **Before/After:** It\'s almost 3 / It\'s just after 3\n\n## Days of the Week\nMonday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday\n\n### Prepositions with Days\n- On Monday / On weekdays / On weekends\n- This Monday / Next Tuesday / Last Wednesday\n\n## Months of the Year\nJanuary, February, March, April, May, June\nJuly, August, September, October, November, December\n\n### Prepositions with Months\n- In January / In summer / In 2024\n- At the beginning/end of March\n\n## Ordinal Numbers\n1st = first, 2nd = second, 3rd = third\n4th = fourth, 5th = fifth, 6th = sixth\n7th = seventh, 8th = eighth, 9th = ninth, 10th = tenth\n\n### Using Ordinals\n- Dates: March 3rd (March third)\n- Floors: 2nd floor (second floor)\n- Ranking: 1st place (first place)\n\n## Age and Years\n- How old are you? → I\'m 25 years old\n- When were you born? → I was born in 1998\n- What year is it? → It\'s 2024'
  
  ELSE content
END
WHERE title LIKE '%Numbers & Time%';

-- Create exercises for A1 Basic Greetings lessons
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
    ('What is the appropriate greeting for 2 PM?', '["Good morning", "Good afternoon", "Good evening", "Good night"]', 'Good afternoon', 'Good afternoon is used from 12 PM to 6 PM.', 1),
    ('How do you respond to "Nice to meet you"?', '["I am fine", "Nice to meet you too", "Thank you", "You are welcome"]', 'Nice to meet you too', 'When someone says "Nice to meet you," the polite response is "Nice to meet you too."', 2),
    ('Which is the most formal greeting?', '["Hey", "Hi", "How do you do?", "What\'s up?"]', 'How do you do?', '"How do you do?" is the most formal greeting, typically used in business settings.', 3),
    ('Complete: "My name ___ Sarah."', '["am", "is", "are", "be"]', 'is', 'Use "is" with third person singular. "My name is Sarah."', 4),
    ('What question asks for someone\'s origin?', '["What is your name?", "How are you?", "Where are you from?", "What do you do?"]', 'Where are you from?', '"Where are you from?" asks about someone\'s place of origin or nationality.', 5)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Basic Greetings%' AND l.title LIKE '%Introduction%';

-- Create exercises for A1 Numbers & Time lessons  
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
    ('What time is 3:30?', '["Three thirteen", "Half past three", "Quarter to three", "Three three"]', 'Half past three', '3:30 can be said as "half past three" or "three thirty."', 2),
    ('Which is correct for the 2nd floor?', '["Two floor", "Second floor", "Floor two", "Number two floor"]', 'Second floor', 'Use ordinal numbers for floors: "second floor" for the 2nd floor.', 3),
    ('Complete: "20 + 5 = ___"', '["twenty", "fifteen", "twenty-five", "thirty"]', 'twenty-five', '20 + 5 = 25, which is "twenty-five" in English.', 4),
    ('What day comes after Tuesday?', '["Monday", "Wednesday", "Thursday", "Sunday"]', 'Wednesday', 'The days of the week in order are: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.', 5)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Numbers & Time%' AND l.title LIKE '%Introduction%';

-- Add more comprehensive exercises for Core Concepts lessons
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
    ('Choose the informal greeting:', '["How do you do?", "Good evening", "Hey, what\'s up?", "It\'s a pleasure to meet you"]', 'Hey, what\'s up?', '"Hey, what\'s up?" is a very casual, informal greeting used with friends.', 1),
    ('Which response is appropriate for "How are you?"', '["My name is John", "I\'m fine, thank you", "Nice to meet you", "I\'m from Canada"]', 'I\'m fine, thank you', '"How are you?" asks about your well-being, so "I\'m fine, thank you" is the appropriate response.', 2),
    ('Complete: "They ___ from Australia."', '["am", "is", "are", "be"]', 'are', 'Use "are" with "they": "They are from Australia."', 3)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Basic Greetings%' AND l.title LIKE '%Core Concepts%';

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
    ('What time is 9:45?', '["Quarter past nine", "Half past nine", "Quarter to ten", "Nine forty"]', 'Quarter to ten', '9:45 is "quarter to ten" because it\'s 15 minutes before 10 o\'clock.', 1),
    ('Which month comes before April?', '["May", "March", "February", "January"]', 'March', 'The months in order are: January, February, March, April, May...', 2),
    ('How do you write the date March 3rd?', '["3/3", "March 3rd", "March third", "Both B and C"]', 'Both B and C', 'March 3rd can be written as "March 3rd" or spoken as "March third."', 3)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Numbers & Time%' AND l.title LIKE '%Core Concepts%';