-- Clear all existing chat-related data to start fresh
-- This operation removes user-generated chat messages and conversation state.
-- It does not alter schemas or permissions.

BEGIN;
  DELETE FROM public.direct_messages;
  DELETE FROM public.group_chat_messages;
  DELETE FROM public.direct_conversation_state;
COMMIT;