-- Create table for ENEM lesson content
CREATE TABLE IF NOT EXISTS enem_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for ENEM exam questions
CREATE TABLE IF NOT EXISTS enem_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subject_id)
);

-- Enable RLS
ALTER TABLE enem_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enem_exam_questions ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone can read
CREATE POLICY "Everyone can view ENEM lessons"
  ON enem_lessons FOR SELECT
  USING (true);

CREATE POLICY "Everyone can view ENEM exam questions"
  ON enem_exam_questions FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage ENEM lessons"
  ON enem_lessons FOR ALL
  USING (user_has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage ENEM exam questions"
  ON enem_exam_questions FOR ALL
  USING (user_has_admin_role(auth.uid()));

-- Create indexes for faster lookups
CREATE INDEX idx_enem_lessons_subject_id ON enem_lessons(subject_id);
CREATE INDEX idx_enem_exam_questions_subject_id ON enem_exam_questions(subject_id);