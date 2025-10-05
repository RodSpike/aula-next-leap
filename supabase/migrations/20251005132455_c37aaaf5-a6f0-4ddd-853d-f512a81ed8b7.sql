-- Clear all existing chat messages
DELETE FROM chat_messages;
DELETE FROM direct_messages;
DELETE FROM group_chat_messages;

-- Reset conversation states
DELETE FROM direct_conversation_state;