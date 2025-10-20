-- Update RLS policies for community posting and visibility
-- 1) Allow members to SELECT posts in their groups
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='group_posts' AND policyname='Members can view posts in their groups'
  ) THEN
    CREATE POLICY "Members can view posts in their groups"
    ON public.group_posts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id = group_posts.group_id
          AND gm.user_id = auth.uid()
          AND gm.status = 'accepted'
      )
      OR is_group_creator(group_posts.group_id, auth.uid())
      OR user_has_admin_role(auth.uid())
    );
  END IF;
END $$;

-- 2) Relax INSERT policy: allow group creators and admins, or members with can_post=true
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='group_posts' AND policyname='Members can post if they have permission'
  ) THEN
    DROP POLICY "Members can post if they have permission" ON public.group_posts;
  END IF;
END $$;

CREATE POLICY "Members/creators/admins can create posts"
ON public.group_posts
FOR INSERT
WITH CHECK (
  -- Member with explicit posting permission
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_posts.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'accepted'
      AND gm.can_post = true
  )
  OR is_group_creator(group_posts.group_id, auth.uid())
  OR user_has_admin_role(auth.uid())
);

-- 3) Allow SELECT for post_likes to members of the group
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='post_likes' AND policyname='Members can view likes for posts in their groups'
  ) THEN
    CREATE POLICY "Members can view likes for posts in their groups"
    ON public.post_likes
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.group_posts gp
        JOIN public.group_members gm ON gm.group_id = gp.group_id
        WHERE gp.id = post_likes.post_id
          AND gm.user_id = auth.uid()
          AND gm.status = 'accepted'
      )
      OR user_has_admin_role(auth.uid())
    );
  END IF;
END $$;

-- 4) Allow SELECT for post_comments to members of the group
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='post_comments' AND policyname='Members can view comments for posts in their groups'
  ) THEN
    CREATE POLICY "Members can view comments for posts in their groups"
    ON public.post_comments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.group_posts gp
        JOIN public.group_members gm ON gm.group_id = gp.group_id
        WHERE gp.id = post_comments.post_id
          AND gm.user_id = auth.uid()
          AND gm.status = 'accepted'
      )
      OR user_has_admin_role(auth.uid())
    );
  END IF;
END $$;
