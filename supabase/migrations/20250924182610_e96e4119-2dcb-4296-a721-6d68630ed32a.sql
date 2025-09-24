-- Create per-user conversation state for direct messages
CREATE TABLE IF NOT EXISTS public.direct_conversation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  other_user_id uuid NOT NULL,
  group_id uuid NOT NULL,
  deleted_before timestamptz NOT NULL DEFAULT to_timestamp(0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, other_user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.direct_conversation_state ENABLE ROW LEVEL SECURITY;

-- Policies: users manage their own records
CREATE POLICY "Users can view their own conversation state"
ON public.direct_conversation_state
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own conversation state"
ON public.direct_conversation_state
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation state"
ON public.direct_conversation_state
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation state"
ON public.direct_conversation_state
FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_direct_conversation_state_updated_at ON public.direct_conversation_state;
CREATE TRIGGER trg_update_direct_conversation_state_updated_at
BEFORE UPDATE ON public.direct_conversation_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();