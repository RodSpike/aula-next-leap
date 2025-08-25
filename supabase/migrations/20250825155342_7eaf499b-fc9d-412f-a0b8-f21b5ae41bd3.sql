-- Create comprehensive lesson content and exercises for all levels

-- First, let's update lesson content with detailed, structured content
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Introduction to Basic Greetings & Introductions\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Greet people formally and informally\n- Introduce yourself and others\n- Ask for and give basic personal information\n- Use appropriate greeting phrases for different times of day\n\n## Key Vocabulary\n**Greetings:**\n- Hello / Hi\n- Good morning / Good afternoon / Good evening\n- How are you? / How do you do?\n- Nice to meet you\n- Goodbye / Bye / See you later\n\n**Introductions:**\n- My name is...\n- I am... / I am...\n- This is...\n- What is your name?\n- Where are you from?\n\n## Grammar Focus\n- Present tense of "to be" (am, is, are)\n- Question formation with "What" and "Where"\n- Possessive adjectives (my, your, his, her)\n\n## Cultural Notes\nIn English-speaking countries, it is common to:\n- Shake hands when meeting someone new\n- Make eye contact during introductions\n- Use titles (Mr., Mrs., Ms.) in formal situations'
  
  WHEN title LIKE '%Core Concepts%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Core Concepts: Greetings and Introductions\n\n## Formal vs Informal Greetings\n\n### Formal Greetings\n- Good morning (before 12 PM)\n- Good afternoon (12 PM - 6 PM)\n- Good evening (after 6 PM)\n- How do you do? (very formal)\n- It is a pleasure to meet you\n\n### Informal Greetings\n- Hi / Hello\n- Hey (very casual)\n- How is it going?\n- What is up?\n\n## Personal Information Exchange\n\n### Essential Questions:\n- What is your name?\n- Where are you from?\n- What do you do?\n- How old are you?\n- Do you speak English?\n\n### Sample Responses:\n- My name is [Name]\n- I am from [Country/City]\n- I am a [profession]\n- I am [age] years old\n- Yes, a little / No, not really\n\n## Grammar Patterns\n\n### Present Tense "To Be"\n- I am\n- You are\n- He/She/It is\n- We are\n- They are\n\n### Question Formation\n- What + is + your name?\n- Where + are + you from?\n- How + are + you?'
  
  WHEN title LIKE '%Practice%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Practice & Application: Greetings and Introductions\n\n## Dialogue Practice\n\n### Scenario 1: Meeting a New Colleague\n**A:** Good morning! I do not think we have met. I am Sarah.\n**B:** Good morning, Sarah. Nice to meet you. I am David.\n**A:** Nice to meet you too, David. What department are you in?\n**B:** I am in Marketing. How about you?\n**A:** I work in Human Resources.\n\n### Scenario 2: Casual Introduction\n**A:** Hi there! I am Mike.\n**B:** Hey Mike, I am Lisa. Are you new here?\n**A:** Yes, it is my first day. How long have you been working here?\n**B:** About two years now. Welcome to the team!\n\n## Common Mistakes to Avoid\n\n1. **Using "How do you do?" as a real question**\n   - Correct response: "How do you do?" (not details about your day)\n\n2. **Forgetting to reciprocate**\n   - When someone says "Nice to meet you," always respond with "Nice to meet you too"\n\n3. **Using wrong greeting for time of day**\n   - Do not say "Good morning" in the evening\n\n## Practice Activities\n\n### Activity 1: Fill in the blanks\nComplete these conversations with appropriate greetings:\n1. A: _______ morning! B: Good morning!\n2. A: What is _______ name? B: My name is John.\n3. A: Where are you _______? B: I am from Canada.\n\n### Activity 2: Match the situation\nMatch the greeting to the appropriate situation:\n- Business meeting → How do you do?\n- Meeting a friend → Hey, what is up?\n- First day at work → Good morning, I am [name]'
  
  WHEN title LIKE '%Review%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'A1' AND courses.title = 'Basic Greetings & Introductions') THEN
    E'# Review & Assessment: Greetings and Introductions\n\n## Summary of Key Points\n\n### Greetings by Time of Day\n- **Morning (6 AM - 12 PM):** Good morning\n- **Afternoon (12 PM - 6 PM):** Good afternoon\n- **Evening (6 PM - 10 PM):** Good evening\n- **Anytime:** Hello, Hi\n\n### Introduction Formulas\n1. **Introducing Yourself:**\n   - My name is... / I am...\n   - I am from... / I come from...\n   - I work as... / I am a...\n\n2. **Introducing Others:**\n   - This is my friend/colleague [name]\n   - I would like you to meet...\n   - Let me introduce you to...\n\n3. **Responding to Introductions:**\n   - Nice to meet you\n   - Pleased to meet you\n   - How do you do? (formal)\n\n### Essential Questions\n- What is your name?\n- Where are you from?\n- What do you do?\n- How are you?\n- Do you speak English?\n\n## Self-Assessment Checklist\n\n☐ I can greet people appropriately at different times of day\n☐ I can introduce myself with basic information\n☐ I can ask for someone name and personal information\n☐ I can respond appropriately when someone introduces themselves\n☐ I understand the difference between formal and informal greetings\n☐ I can use the present tense of "to be" correctly\n\n## Common Phrases to Remember\n\n**Arriving:**\n- Good morning/afternoon/evening\n- Hello, how are you?\n- Nice to see you\n\n**Leaving:**\n- Goodbye\n- See you later\n- Have a nice day\n- Take care\n\n**Emergency Phrases:**\n- I am sorry, I do not understand\n- Could you repeat that, please?\n- I am still learning English\n- Nice to meet you (works in most situations!)'

  ELSE content
END
WHERE title LIKE '%Basic Greetings%';

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
    ('Which is the most formal greeting?', '["Hey", "Hi", "How do you do?", "What is up?"]', 'How do you do?', '"How do you do?" is the most formal greeting, typically used in business settings.', 3),
    ('Complete: "My name ___ Sarah."', '["am", "is", "are", "be"]', 'is', 'Use "is" with third person singular. "My name is Sarah."', 4),
    ('What question asks for someone origin?', '["What is your name?", "How are you?", "Where are you from?", "What do you do?"]', 'Where are you from?', '"Where are you from?" asks about someone place of origin or nationality.', 5)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Basic Greetings%' AND l.title LIKE '%Introduction%';