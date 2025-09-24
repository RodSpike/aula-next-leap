-- Add a flag to distinguish private DM groups from community groups
ALTER TABLE public.community_groups
ADD COLUMN IF NOT EXISTS is_private_chat boolean NOT NULL DEFAULT false;

-- Index for fast filtering in community pages
CREATE INDEX IF NOT EXISTS idx_community_groups_is_private_chat
ON public.community_groups(is_private_chat);
