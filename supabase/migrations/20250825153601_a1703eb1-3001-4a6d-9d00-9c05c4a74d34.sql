-- Clean up duplicate courses by keeping only the earliest created entry for each level/title combination
DELETE FROM courses 
WHERE id NOT IN (
  SELECT DISTINCT ON (level, title) id 
  FROM courses 
  ORDER BY level, title, created_at ASC
);

-- Verify cleanup
SELECT level, title, COUNT(*) as count 
FROM courses 
GROUP BY level, title;