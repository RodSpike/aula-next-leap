-- Clear existing content for Lesson 1 A1 and create comprehensive content
DELETE FROM lesson_content WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  JOIN courses c ON l.course_id = c.id 
  WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be'
);

-- Insert comprehensive content for Lesson 1 A1 following user's exact format
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) 
SELECT 
  l.id as lesson_id,
  'introduction' as section_type,
  'Aula 1: Introdução ao Inglês - Cumprimentos + Verbo "to be" + Perguntas "Wh-" com "to be"' as title,
  'Objetivo: Aprender saudações básicas e introduções em inglês. Entender o uso do verbo "to be" nas formas afirmativa, negativa e interrogativa. Praticar perguntas com "Wh-" para iniciar conversas.' as explanation,
  jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object(
        'title', 'Parte 1: Cumprimentos e Introduções',
        'content', 'Vocabulário: Saudações (Greetings)',
        'sections', jsonb_build_array(
          jsonb_build_object(
            'title', 'Formais:',
            'items', jsonb_build_array(
              'Good morning! (Bom dia!)',
              'Good afternoon! (Boa tarde!)', 
              'Good evening! (Boa noite! - ao chegar)',
              'How are you? (Como você está?)'
            )
          ),
          jsonb_build_object(
            'title', 'Informais:',
            'items', jsonb_build_array(
              'Hi! (Oi!)',
              'Hello! (Olá!)',
              'Hey! (Ei!)',
              'What''s up? (E aí?)'
            )
          )
        )
      ),
      jsonb_build_object(
        'title', 'Exemplo de Introduções (Introductions):',
        'content', 'Hello! My name is Ana. What''s your name? (Olá! Meu nome é Ana. Qual é o seu nome?) Hi! I''m João. Nice to meet you! (Oi! Eu sou o João. Prazer em te conhecer!)',
        'activity', 'Atividade: Pratique cumprimentos e introduções com um colega, criando um diálogo curto. Por exemplo: A: "Hi! My name is Carlos. What''s your name?" B: "Hello, Carlos! I''m Julia. Nice to meet you!"'
      ),
      jsonb_build_object(
        'title', 'Parte 2: Verbo "to be" (ser/estar)',
        'content', 'O verbo "to be" é usado para indicar características ou estados. Veja a conjugação no presente:',
        'table', jsonb_build_array(
          jsonb_build_array('Pronome', 'Verbo "to be"', 'Tradução', 'Exemplo', 'Tradução'),
          jsonb_build_array('I', 'am', 'Eu sou/estou', 'I am a student.', 'Eu sou um estudante.'),
          jsonb_build_array('You', 'are', 'Você é/está', 'You are happy.', 'Você está feliz.'),
          jsonb_build_array('He/She/It', 'is', 'Ele/Ela é/está', 'He is my friend.', 'Ele é meu amigo.'),
          jsonb_build_array('We', 'are', 'Nós somos/estamos', 'We are from Brazil.', 'Nós somos do Brasil.'),
          jsonb_build_array('They', 'are', 'Eles são/estão', 'They are at school.', 'Eles estão na escola.')
        ),
        'sentence_types', jsonb_build_array(
          jsonb_build_object(
            'type', 'Frases Afirmativas (Affirmative Sentences):',
            'examples', jsonb_build_array(
              'I am a teacher. (Eu sou um professor.)',
              'She is happy. (Ela está feliz.)',
              'They are my friends. (Eles são meus amigos.)'
            )
          ),
          jsonb_build_object(
            'type', 'Frases Negativas (Negative Sentences):',
            'examples', jsonb_build_array(
              'I am not a student. (Eu não sou um estudante.)',
              'She isn''t sad. (Ela não está triste.)',
              'They aren''t from Brazil. (Eles não são do Brasil.)'
            )
          ),
          jsonb_build_object(
            'type', 'Perguntas com "to be" (Questions with "to be"):',
            'examples', jsonb_build_array(
              'Are you happy? → Yes, I am. / No, I''m not. (Você está feliz? → Sim, eu estou. / Não, eu não estou.)',
              'Is she your sister? → Yes, she is. / No, she isn''t. (Ela é sua irmã? → Sim, ela é. / Não, ela não é.)'
            )
          )
        )
      ),
      jsonb_build_object(
        'title', 'Parte 3: Perguntas "Wh-" com "to be"',
        'content', 'Perguntas "Wh-" começam com palavras específicas para obter informações mais detalhadas.',
        'wh_table', jsonb_build_array(
          jsonb_build_array('Wh-Word', 'Significado', 'Exemplo com "to be"', 'Tradução'),
          jsonb_build_array('Who', 'Quem', 'Who is your teacher?', 'Quem é seu professor?'),
          jsonb_build_array('What', 'O que/Qual', 'What is your name?', 'Qual é o seu nome?'),
          jsonb_build_array('Where', 'Onde', 'Where are you from?', 'De onde você é?'),
          jsonb_build_array('When', 'Quando', 'When is your birthday?', 'Quando é seu aniversário?'),
          jsonb_build_array('Why', 'Por que', 'Why are you sad?', 'Por que você está triste?'),
          jsonb_build_array('How', 'Como', 'How are you?', 'Como você está?')
        )
      )
    )
  ) as content,
  jsonb_build_array() as examples,
  1 as order_index
FROM lessons l
JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';

-- Insert practice exercises as separate section
INSERT INTO lesson_content (lesson_id, section_type, title, explanation, content, examples, order_index) 
SELECT 
  l.id as lesson_id,
  'practice' as section_type,
  'Práticas e Exercícios' as title,
  'Complete os exercícios abaixo para praticar o conteúdo aprendido.' as explanation,
  jsonb_build_object(
    'exercises', jsonb_build_array(
      jsonb_build_object(
        'title', '1. Complete as Frases com "to be":',
        'questions', jsonb_build_array(
          'a) I ___ a student. (Eu sou um estudante.)',
          'b) She ___ my sister. (Ela é minha irmã.)', 
          'c) They ___ at school now. (Eles estão na escola agora.)'
        )
      ),
      jsonb_build_object(
        'title', '2. Complete com as Wh-Questions:',
        'questions', jsonb_build_array(
          'a) ___ is your name? (Qual é o seu nome?)',
          'b) ___ are you from? (De onde você é?)',
          'c) ___ are you sad? (Por que você está triste?)'
        )
      ),
      jsonb_build_object(
        'title', '3. Role-Play: Crie um diálogo como este:',
        'example', 'A: "Hi! What is your name?"\nB: "Hello! My name is Lucas. Where are you from?"\nA: "I''m from Brazil. Nice to meet you!"\n\nTradução:\nA: "Oi! Qual é o seu nome?"\nB: "Olá! Meu nome é Lucas. De onde você é?"\nA: "Eu sou do Brasil. Prazer em te conhecer!"',
        'instructions', 'Pratique este diálogo com um colega, substituindo os nomes e países.'
      )
    )
  ) as content,
  jsonb_build_array() as examples,
  2 as order_index
FROM lessons l
JOIN courses c ON l.course_id = c.id 
WHERE c.level = 'A1' AND l.title = 'Meet and Greet + Verb To Be';