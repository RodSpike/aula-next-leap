-- Update the level constraint to include Cambridge levels
ALTER TABLE public.community_groups DROP CONSTRAINT community_groups_level_check;

-- Add new constraint with Cambridge levels
ALTER TABLE public.community_groups ADD CONSTRAINT community_groups_level_check 
CHECK (level = ANY (ARRAY['Basic'::text, 'Intermediate'::text, 'Advanced'::text, 'A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text]));

-- Create default level-based community groups for Cambridge placement test
INSERT INTO public.community_groups (name, description, level, is_default, created_by, max_members)
SELECT 
  level || ' Level - English Learning' as name,
  'Join fellow ' || level || ' level learners! Practice English and improve together in this supportive community.' as description,
  level,
  true as is_default,
  (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1) as created_by,
  100 as max_members
FROM (VALUES ('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2')) as levels(level)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_groups 
  WHERE community_groups.level = levels.level AND is_default = true
);