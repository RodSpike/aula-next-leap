-- Manually join existing users who completed placement test but weren't auto-joined
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
  )
ON CONFLICT (group_id, user_id) DO NOTHING;