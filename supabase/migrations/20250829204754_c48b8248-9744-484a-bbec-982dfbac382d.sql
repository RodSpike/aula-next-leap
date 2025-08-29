
-- Create a comprehensive lessons content table with real ESL content
CREATE TABLE public.lesson_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing')),
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  examples JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced exercises with multiple types
DROP TABLE IF EXISTS public.exercises CASCADE;
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('multiple_choice', 'fill_blank', 'drag_drop', 'matching', 'true_false', 'reading_comprehension')),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friend chat messages table
CREATE TABLE public.friend_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_friendship CHECK (
    EXISTS (
      SELECT 1 FROM friends 
      WHERE status = 'accepted' 
      AND ((requester_id = sender_id AND requested_id = receiver_id) 
           OR (requester_id = receiver_id AND requested_id = sender_id))
    )
  )
);

-- Add RLS policies for lesson content
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view lesson content" 
  ON public.lesson_content 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage lesson content" 
  ON public.lesson_content 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for enhanced exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view exercises" 
  ON public.exercises 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage exercises" 
  ON public.exercises 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for friend messages
ALTER TABLE public.friend_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" 
  ON public.friend_messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to friends" 
  ON public.friend_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages" 
  ON public.friend_messages 
  FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Enable realtime for friend messages
ALTER TABLE public.friend_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_messages;

-- Insert sample ESL content for beginners
INSERT INTO public.lesson_content (lesson_id, section_type, title, explanation, examples, order_index) VALUES
((SELECT id FROM lessons WHERE title LIKE '%Introduction%' LIMIT 1), 'grammar', 'Present Simple Tense', 'The present simple tense is used to express habits, general truths, and repeated actions. We use the base form of the verb for I, you, we, they, and add -s or -es for he, she, it.', '[{"example": "I eat breakfast every morning.", "translation": "Eu como café da manhã toda manhã."}, {"example": "She works in a hospital.", "translation": "Ela trabalha em um hospital."}]', 1),
((SELECT id FROM lessons WHERE title LIKE '%Introduction%' LIMIT 1), 'vocabulary', 'Common Greetings', 'Learn essential greetings and polite expressions used in everyday English conversations.', '[{"word": "Hello", "meaning": "Olá", "usage": "Hello, how are you?"}, {"word": "Good morning", "meaning": "Bom dia", "usage": "Good morning, Mr. Smith!"}, {"word": "Thank you", "meaning": "Obrigado", "usage": "Thank you for your help."}]', 2),
((SELECT id FROM lessons WHERE title LIKE '%Introduction%' LIMIT 1), 'reading', 'My Daily Routine', 'Read about John daily routine and learn new vocabulary about daily activities.', '[{"text": "My name is John. I wake up at 7 AM every day. I brush my teeth and take a shower. Then I eat breakfast with my family. I go to work at 8:30 AM by bus. I work in an office from 9 AM to 5 PM. After work, I go home and have dinner. I watch TV and go to bed at 10 PM.", "questions": ["What time does John wake up?", "How does John go to work?", "What does John do after work?"]}]', 3);

-- Insert sample exercises
INSERT INTO public.exercises (lesson_id, exercise_type, title, instructions, question, options, correct_answer, explanation, points, order_index) VALUES
((SELECT id FROM lessons WHERE title LIKE '%Introduction%' LIMIT 1), 'multiple_choice', 'Present Simple Practice', 'Choose the correct form of the verb in present simple.', 'She _____ English every day.', '["study", "studies", "studying", "studied"]', 'studies', 'We use "studies" because the subject is "she" (third person singular), so we add -es to the base verb "study".', 10, 1),
((SELECT id FROM lessons WHERE title LIKE '%Introduction%' LIMIT 1), 'fill_blank', 'Complete the Greeting', 'Fill in the blank with the appropriate greeting.', '_____ morning, teacher!', '["Good", "Hello", "Hi", "Hey"]', 'Good', 'We say "Good morning" as a formal greeting in the morning hours.', 10, 2),
((SELECT id FROM lessons WHERE title LIKE '%Introduction%' LIMIT 1), 'reading_comprehension', 'Reading Comprehension', 'Read the text about John and answer the question.', 'What time does John wake up every day?', '["6 AM", "7 AM", "8 AM", "9 AM"]', '7 AM', 'According to the text, John wakes up at 7 AM every day.', 15, 3);
