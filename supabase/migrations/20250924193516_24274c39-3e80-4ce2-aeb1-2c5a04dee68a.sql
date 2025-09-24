-- Add system message flag to group chat messages
ALTER TABLE public.group_chat_messages 
ADD COLUMN IF NOT EXISTS is_system_message boolean NOT NULL DEFAULT false;

-- Create index for faster system message queries
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_system 
ON public.group_chat_messages(group_id, is_system_message);