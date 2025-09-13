-- Create comprehensive lesson content for A1 course with introduction explanations
-- First, let's add the A1 introduction lesson content based on the user's example

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

-- Add similar content for the second lesson: Personal Information
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index)
SELECT l.id, 'introduction', 'Aula 2: Informações Pessoais - Alfabeto + Números + Países',
  'Objetivo: Aprender o alfabeto em inglês, números de 1-100, países e nacionalidades. Praticar soletrar nomes e dar informações pessoais.',
  '{
    "parts": [
      {
        "title": "Parte 1: O Alfabeto (The Alphabet)",
        "content": "O alfabeto inglês tem 26 letras. Vamos aprender a pronúncia:",
        "alphabet": [
          "A /eɪ/", "B /biː/", "C /siː/", "D /diː/", "E /iː/", "F /ɛf/", "G /dʒiː/", "H /eɪtʃ/", "I /aɪ/",
          "J /dʒeɪ/", "K /keɪ/", "L /ɛl/", "M /ɛm/", "N /ɛn/", "O /oʊ/", "P /piː/", "Q /kjuː/", "R /ɑr/",
          "S /ɛs/", "T /tiː/", "U /juː/", "V /viː/", "W /ˈdʌbəl juː/", "X /ɛks/", "Y /waɪ/", "Z /ziː/"
        ]
      },
      {
        "title": "Parte 2: Números (Numbers) 1-100",
        "content": "Números são essenciais para dar informações pessoais como idade, telefone, etc.",
        "number_groups": [
          {
            "range": "1-20",
            "numbers": ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]
          },
          {
            "range": "Dezenas",
            "numbers": ["twenty (20)", "thirty (30)", "forty (40)", "fifty (50)", "sixty (60)", "seventy (70)", "eighty (80)", "ninety (90)", "one hundred (100)"]
          }
        ]
      },
      {
        "title": "Parte 3: Países e Nacionalidades",
        "content": "Aprenda a falar sobre sua origem:",
        "countries_table": [
          ["País", "Nacionalidade", "Exemplo"],
          ["Brazil", "Brazilian", "I am Brazilian."],
          ["United States", "American", "She is American."],
          ["England", "English", "He is English."],
          ["France", "French", "They are French."],
          ["Germany", "German", "We are German."],
          ["Japan", "Japanese", "I am Japanese."],
          ["China", "Chinese", "She is Chinese."],
          ["Italy", "Italian", "He is Italian."]
        ]
      }
    ]
  }'::jsonb,
  '[
    {
      "english": "How do you spell your name?",
      "portuguese": "Como você soletra seu nome?"
    },
    {
      "english": "My name is M-A-R-I-A",
      "portuguese": "Meu nome é M-A-R-I-A"
    }
  ]'::jsonb,
  1
FROM lessons l 
WHERE l.title = 'Personal Information + Alphabet' 
AND l.course_id = 'f3e17a99-681c-4258-8c3c-b083d5efb0c5';

-- Add practice exercises for lesson 2
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index)
SELECT l.id, 'practice', 'Práticas e Exercícios',
  'Pratique o alfabeto, números e informações pessoais.',
  '{
    "exercises": [
      {
        "title": "1. Soletrar Nomes",
        "instructions": "Pratique soletrar estes nomes:",
        "questions": [
          "Como você soletra CARLOS?",
          "Como você soletra MARIA?",
          "Como você soletra JOÃO?"
        ]
      },
      {
        "title": "2. Números",
        "instructions": "Escreva os números por extenso:",
        "questions": [
          "15 = ?",
          "32 = ?",
          "67 = ?"
        ]
      },
      {
        "title": "3. Informações Pessoais",
        "instructions": "Complete o diálogo:",
        "example": "A: \"Where are you from?\"\nB: \"I am from ___.\"\nA: \"What nationality are you?\"\nB: \"I am ___.\""
      }
    ]
  }'::jsonb,
  '[]'::jsonb,
  2
FROM lessons l 
WHERE l.title = 'Personal Information + Alphabet' 
AND l.course_id = 'f3e17a99-681c-4258-8c3c-b083d5efb0c5';