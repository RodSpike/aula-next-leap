-- Clear existing A1 lesson data to test the new system
DELETE FROM exercises WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  JOIN courses c ON l.course_id = c.id 
  WHERE c.level = 'A1'
);

DELETE FROM lesson_content WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  JOIN courses c ON l.course_id = c.id 
  WHERE c.level = 'A1'
);

DELETE FROM lessons WHERE course_id IN (
  SELECT id FROM courses WHERE level = 'A1'
);

DELETE FROM courses WHERE level = 'A1';