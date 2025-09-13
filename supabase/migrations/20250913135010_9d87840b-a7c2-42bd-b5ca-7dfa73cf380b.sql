-- First, drop the existing check constraint and recreate it with new section types
ALTER TABLE lesson_content DROP CONSTRAINT lesson_content_section_type_check;

-- Add the new constraint with 'introduction' and 'practice' types
ALTER TABLE lesson_content ADD CONSTRAINT lesson_content_section_type_check 
CHECK (section_type = ANY (ARRAY['introduction'::text, 'grammar'::text, 'vocabulary'::text, 'reading'::text, 'listening'::text, 'speaking'::text, 'writing'::text, 'exercise'::text, 'assessment'::text, 'practice'::text]));

-- Now create comprehensive lesson content for A1 course with introduction explanations
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index)
SELECT l.id, 'introduction', 'Aula 1: Introdução ao Inglês - Cumprimentos + Verbo "to be" + Perguntas "Wh-" com "to be"',
  'Objetivo: Aprender saudações básicas e introduções em inglês. Entender o uso do verbo "to be" nas formas afirmativa, negativa e interrogativa. Praticar perguntas com "Wh-" para iniciar conversas.',
  '{
    "parts": [
      {
        "title": "Parte 1: Cumprimentos e Introduções",
        "content": "Vocabulário: Saudações (Greetings)",
        "sections": [
          {
            "title": "Formais",
            "items": [
              "Good morning! (Bom dia!)",
              "Good afternoon! (Boa tarde!)",
              "Good evening! (Boa noite! - ao chegar)",
              "How are you? (Como você está?)"
            ]
          },
          {
            "title": "Informais",
            "items": [
              "Hi! (Oi!)",
              "Hello! (Olá!)",
              "Hey! (Ei!)",
              "What''s up? (E aí?)"
            ]
          }
        ]
      },
      {
        "title": "Parte 2: Verbo \"to be\" (ser/estar)",
        "content": "O verbo \"to be\" é usado para indicar características ou estados. Veja a conjugação no presente:",
        "table": [
          ["Pronome", "Verbo \"to be\"", "Tradução", "Exemplo", "Tradução"],
          ["I", "am", "Eu sou/estou", "I am a student.", "Eu sou um estudante."],
          ["You", "are", "Você é/está", "You are happy.", "Você está feliz."],
          ["He/She/It", "is", "Ele/Ela é/está", "He is my friend.", "Ele é meu amigo."],
          ["We", "are", "Nós somos/estamos", "We are from Brazil.", "Nós somos do Brasil."],
          ["They", "are", "Eles são/estão", "They are at school.", "Eles estão na escola."]
        ],
        "sentence_types": [
          {
            "type": "Frases Afirmativas (Affirmative Sentences)",
            "examples": [
              "I am a teacher. (Eu sou um professor.)",
              "She is happy. (Ela está feliz.)",
              "They are my friends. (Eles são meus amigos.)"
            ]
          },
          {
            "type": "Frases Negativas (Negative Sentences)",
            "examples": [
              "I am not a student. (Eu não sou um estudante.)",
              "She isn''t sad. (Ela não está triste.)",
              "They aren''t from Brazil. (Eles não são do Brasil.)"
            ]
          },
          {
            "type": "Perguntas com \"to be\" (Questions with \"to be\")",
            "examples": [
              "Are you happy? → Yes, I am. / No, I''m not. (Você está feliz? → Sim, eu estou. / Não, eu não estou.)",
              "Is she your sister? → Yes, she is. / No, she isn''t. (Ela é sua irmã? → Sim, ela é. / Não, ela não é.)"
            ]
          }
        ]
      },
      {
        "title": "Parte 3: Perguntas \"Wh-\" com \"to be\"",
        "content": "Perguntas \"Wh-\" começam com palavras específicas para obter informações mais detalhadas.",
        "wh_table": [
          ["Wh-Word", "Significado", "Exemplo com \"to be\"", "Tradução"],
          ["Who", "Quem", "Who is your teacher?", "Quem é seu professor?"],
          ["What", "O que/Qual", "What is your name?", "Qual é o seu nome?"],
          ["Where", "Onde", "Where are you from?", "De onde você é?"],
          ["When", "Quando", "When is your birthday?", "Quando é seu aniversário?"],
          ["Why", "Por que", "Why are you sad?", "Por que você está triste?"],
          ["How", "Como", "How are you?", "Como você está?"]
        ]
      }
    ]
  }'::jsonb,
  '[
    {
      "english": "Hello! My name is Ana. What''s your name?",
      "portuguese": "Olá! Meu nome é Ana. Qual é o seu nome?"
    },
    {
      "english": "Hi! I''m João. Nice to meet you!",
      "portuguese": "Oi! Eu sou o João. Prazer em te conhecer!"
    }
  ]'::jsonb,
  1
FROM lessons l 
WHERE l.title = 'Meet and Greet + Verb To Be' 
AND l.course_id = 'f3e17a99-681c-4258-8c3c-b083d5efb0c5';

-- Add practice exercises section for this lesson
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index)
SELECT l.id, 'practice', 'Práticas e Exercícios',
  'Complete os exercícios abaixo para praticar o que aprendeu.',
  '{
    "exercises": [
      {
        "title": "1. Complete as Frases com \"to be\"",
        "instructions": "Complete as frases com a forma correta do verbo \"to be\":",
        "questions": [
          "I ___ a student. (Eu sou um estudante.)",
          "She ___ my sister. (Ela é minha irmã.)",
          "They ___ at school now. (Eles estão na escola agora.)"
        ]
      },
      {
        "title": "2. Complete com as Wh-Questions",
        "instructions": "Complete com a palavra interrogativa correta:",
        "questions": [
          "___ is your name? (Qual é o seu nome?)",
          "___ are you from? (De onde você é?)",
          "___ are you sad? (Por que você está triste?)"
        ]
      },
      {
        "title": "3. Role-Play",
        "instructions": "Crie um diálogo como este:",
        "example": "A: \"Hi! What is your name?\"\nB: \"Hello! My name is Lucas. Where are you from?\"\nA: \"I''m from Brazil. Nice to meet you!\""
      }
    ]
  }'::jsonb,
  '[]'::jsonb,
  2
FROM lessons l 
WHERE l.title = 'Meet and Greet + Verb To Be' 
AND l.course_id = 'f3e17a99-681c-4258-8c3c-b083d5efb0c5';