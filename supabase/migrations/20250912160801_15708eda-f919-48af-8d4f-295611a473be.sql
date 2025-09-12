-- Clear existing courses and related data
DELETE FROM user_lesson_progress;
DELETE FROM user_exercise_attempts;
DELETE FROM lesson_content;
DELETE FROM exercises;
DELETE FROM lessons;
DELETE FROM courses;

-- Create new level-based courses with proper UUIDs
WITH course_ids AS (
  INSERT INTO courses (title, description, level, order_index) VALUES
    ('English Foundations - A1', 'Master the basics: greetings, present tense, numbers, family, and everyday situations. Based on Cambridge Empower A1.', 'A1', 1),
    ('Elementary English - A2', 'Build on fundamentals with countable/uncountable nouns, preferences, continuous tenses, and basic conditionals.', 'A2', 2),
    ('Pre-Intermediate English - B1', 'Develop intermediate skills with perfect tenses, modal verbs, and complex sentence structures.', 'B1', 3),
    ('Upper-Intermediate English - B2', 'Advanced grammar including future perfect, passive voice, and relative clauses. Prepare for professional communication.', 'B2', 4),
    ('Advanced English - C1', 'Master complex grammar, reported speech, idioms, and sophisticated writing techniques.', 'C1', 5),
    ('Proficiency English - C2', 'Achieve near-native fluency with nuanced language use, advanced discourse markers, and literary analysis.', 'C2', 6)
  RETURNING id, level
)
-- Store course IDs for later use
SELECT * FROM course_ids;