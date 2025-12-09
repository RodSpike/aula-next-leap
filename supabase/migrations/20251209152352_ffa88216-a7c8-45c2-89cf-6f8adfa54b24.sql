-- Create table for speech tutor practice sessions
CREATE TABLE public.speech_tutor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  words_spoken INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speech_tutor_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own speech tutor sessions"
ON public.speech_tutor_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own speech tutor sessions"
ON public.speech_tutor_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own speech tutor sessions"
ON public.speech_tutor_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_speech_tutor_sessions_user_id ON public.speech_tutor_sessions(user_id);
CREATE INDEX idx_speech_tutor_sessions_created_at ON public.speech_tutor_sessions(created_at DESC);