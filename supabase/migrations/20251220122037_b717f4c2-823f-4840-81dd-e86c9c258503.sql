-- Add column to group_posts to identify which AI teacher posted
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS ai_teacher_id uuid REFERENCES public.ai_teachers(id);

-- Add column to ai_teachers to store avatar URL
ALTER TABLE public.ai_teachers ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update AI teachers with avatar URLs
UPDATE public.ai_teachers 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Junior&backgroundColor=b6e3f4&accessories=prescription02&clothingGraphic=bear&eyes=happy&eyebrows=defaultNatural&mouth=smile&skinColor=light&top=shortFlat&topColor=black'
WHERE name = 'Júnior';

UPDATE public.ai_teachers 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=ffd5dc&accessories=round&clothingGraphic=bat&eyes=default&eyebrows=defaultNatural&mouth=serious&skinColor=pale&top=longHairStraight&topColor=brown'
WHERE name = 'Maria';

UPDATE public.ai_teachers 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vitoria&backgroundColor=c0aede&accessories=sunglasses&clothingGraphic=diamond&eyes=wink&eyebrows=upDown&mouth=twinkle&skinColor=brown&top=longHairCurvy&topColor=black'
WHERE name = 'Vitória';

UPDATE public.ai_teachers 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana&backgroundColor=ffdfbf&accessories=prescription01&clothingGraphic=pizza&eyes=happy&eyebrows=raisedExcited&mouth=smile&skinColor=light&top=longHairBob&topColor=auburn'
WHERE name = 'Juliana';

-- Allow admins to update and delete group_posts (for managing AI teacher posts)
CREATE POLICY "Admins can update group posts"
ON public.group_posts
FOR UPDATE
USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete group posts"
ON public.group_posts
FOR DELETE
USING (user_has_admin_role(auth.uid()));