-- Create default community groups for each Cambridge level
INSERT INTO public.community_groups (name, description, level, created_by, is_default, max_members) 
VALUES 
  ('A1 Beginners', 'Community group for A1 level English learners - Basic everyday expressions and simple phrases', 'A1', (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com' LIMIT 1), true, 100),
  ('A2 Elementary', 'Community group for A2 level English learners - Simple conversations and familiar topics', 'A2', (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com' LIMIT 1), true, 100),
  ('B1 Intermediate', 'Community group for B1 level English learners - Express opinions and handle most situations', 'B1', (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com' LIMIT 1), true, 100),
  ('B2 Upper-Intermediate', 'Community group for B2 level English learners - Discuss complex topics and abstract ideas', 'B2', (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com' LIMIT 1), true, 100),
  ('C1 Advanced', 'Community group for C1 level English learners - Fluent expression and academic language', 'C1', (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com' LIMIT 1), true, 100),
  ('C2 Proficiency', 'Community group for C2 level English learners - Near-native proficiency', 'C2', (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com' LIMIT 1), true, 100)
ON CONFLICT DO NOTHING;

-- Auto-join existing users who have completed the placement test to their appropriate groups
INSERT INTO public.group_members (group_id, user_id, status, can_post)
SELECT 
  cg.id as group_id,
  p.user_id,
  'accepted' as status,
  true as can_post
FROM public.profiles p
JOIN public.community_groups cg ON cg.level = p.cambridge_level AND cg.is_default = true
WHERE p.cambridge_level IS NOT NULL
  AND p.cambridge_level != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = cg.id AND gm.user_id = p.user_id
  );