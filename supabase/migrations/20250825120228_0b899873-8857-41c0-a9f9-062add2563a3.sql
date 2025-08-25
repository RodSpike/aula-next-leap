-- Create default level-based community groups for Cambridge placement test
INSERT INTO public.community_groups (name, description, level, is_default, created_by, max_members)
SELECT 
  level || ' Level - Beginner English' as name,
  'Welcome to the ' || level || ' level community! Practice your English with others at your level.' as description,
  level,
  true as is_default,
  (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1) as created_by,
  100 as max_members
FROM (VALUES ('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2')) as levels(level)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_groups 
  WHERE community_groups.level = levels.level AND is_default = true
);