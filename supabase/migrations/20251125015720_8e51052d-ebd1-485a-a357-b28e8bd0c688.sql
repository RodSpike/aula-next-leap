-- Add admin_only flag and course_type to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS admin_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS course_type text DEFAULT 'english';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_courses_admin_only ON public.courses(admin_only);
CREATE INDEX IF NOT EXISTS idx_courses_type ON public.courses(course_type);

-- Insert ENEM preparation course
INSERT INTO public.courses (title, description, level, order_index, admin_only, course_type)
VALUES (
  'Preparação ENEM e Vestibulares',
  'Curso completo de preparação para o ENEM e vestibulares mais concorridos do Brasil. Cobrindo todas as áreas do conhecimento com técnicas de memorização e estratégias de estudo.',
  'ENEM',
  0,
  true,
  'enem'
)
ON CONFLICT DO NOTHING;

-- Get the course ID and insert lessons for all ENEM subjects
WITH enem_course AS (
  SELECT id FROM public.courses WHERE course_type = 'enem' LIMIT 1
)
INSERT INTO public.lessons (course_id, title, content, order_index)
SELECT 
  enem_course.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM enem_course,
(VALUES
  (1, 'Português e Literatura', '# Português e Literatura para ENEM

## Gramática Essencial
- Sintaxe e análise sintática
- Concordância verbal e nominal
- Regência verbal e nominal
- Crase e pontuação
- Colocação pronominal

## Literatura Brasileira
- Períodos literários (Barroco ao Modernismo)
- Autores fundamentais: Machado de Assis, Carlos Drummond de Andrade, Clarice Lispector
- Análise e interpretação de textos literários
- Figuras de linguagem e recursos estilísticos

## Interpretação de Textos
- Identificação de tese e argumentos
- Inferências e deduções
- Contexto histórico e cultural
- Gêneros textuais diversos

## Dicas de Estudo
- Leia textos variados diariamente
- Pratique redações semanalmente
- Crie mapas mentais dos períodos literários
- Anote citações importantes de cada autor'),

  (2, 'Redação ENEM', '# Redação ENEM - Texto Dissertativo-Argumentativo

## Estrutura da Redação
1. **Introdução**: Contextualização + Tese
2. **Desenvolvimento**: 2 parágrafos com argumentos
3. **Conclusão**: Retomada da tese + Proposta de intervenção

## Competências Avaliadas
- C1: Domínio da norma culta
- C2: Compreensão da proposta
- C3: Argumentação
- C4: Coesão
- C5: Proposta de intervenção completa

## Proposta de Intervenção Completa
- Agente: Quem vai fazer?
- Ação: O que fazer?
- Meio/Modo: Como fazer?
- Finalidade: Para quê?
- Detalhamento: Especificação

## Temas Recorrentes
- Direitos humanos
- Inclusão social
- Meio ambiente
- Tecnologia e sociedade
- Educação
- Saúde pública

## Técnicas de Memorização
- Repertório sociocultural: leia notícias diariamente
- Banco de argumentos por tema
- Conectivos organizados por função
- Modelos de introdução e conclusão'),

  (3, 'Matemática - Álgebra e Funções', '# Matemática - Álgebra e Funções

## Conjuntos Numéricos
- Naturais, Inteiros, Racionais, Irracionais, Reais
- Operações e propriedades
- Intervalos e representação

## Funções
- Função de 1º grau (linear)
- Função de 2º grau (quadrática)
- Função exponencial
- Função logarítmica
- Função modular

## Equações e Inequações
- Resolução de equações
- Sistemas lineares
- Inequações de 1º e 2º grau

## Progressões
- PA (Progressão Aritmética)
- PG (Progressão Geométrica)
- Termo geral e soma dos termos

## Técnicas de Estudo
- Resolva pelo menos 10 questões por dia
- Refaça questões erradas até dominar
- Crie fórmulas resumidas em cartões
- Identifique padrões nos enunciados'),

  (4, 'Matemática - Geometria', '# Matemática - Geometria

## Geometria Plana
- Triângulos: Pitágoras, lei dos senos e cossenos
- Quadriláteros: áreas e perímetros
- Círculos e circunferências
- Polígonos regulares

## Geometria Espacial
- Prismas e cilindros
- Pirâmides e cones
- Esferas
- Volume e área superficial

## Geometria Analítica
- Ponto, reta e plano cartesiano
- Distância entre pontos
- Equação da reta
- Circunferência

## Trigonometria
- Relações trigonométricas básicas
- Círculo trigonométrico
- Transformações trigonométricas

## Dicas Práticas
- Desenhe sempre as figuras
- Use cores para destacar informações
- Memorize fórmulas de área e volume
- Faça lista de "truques" para questões rápidas'),

  (5, 'Matemática - Estatística e Probabilidade', '# Estatística e Probabilidade

## Estatística Básica
- Média, moda e mediana
- Desvio padrão e variância
- Gráficos: barras, linhas, setores
- Tabelas e interpretação de dados

## Probabilidade
- Probabilidade simples
- Probabilidade condicional
- Eventos independentes e dependentes
- Combinatória: permutação, arranjo, combinação

## Análise Combinatória
- Princípio fundamental da contagem
- Fatorial
- Permutações simples e com repetição
- Combinações

## Aplicações ENEM
- Interpretação de gráficos e tabelas
- Problemas contextualizados
- Probabilidade em situações reais

## Estratégias
- Pratique leitura de gráficos em jornais
- Crie árvores de possibilidades
- Memorize fórmulas de combinatória
- Use diagramas de Venn'),

  (6, 'Física - Mecânica', '# Física - Mecânica

## Cinemática
- MRU (Movimento Retilíneo Uniforme)
- MRUV (Movimento Uniformemente Variado)
- Queda livre e lançamentos
- Movimento circular

## Dinâmica
- Leis de Newton
- Força peso, normal, atrito
- Plano inclinado
- Força centrípeta

## Trabalho e Energia
- Trabalho de uma força
- Energia cinética e potencial
- Conservação de energia
- Potência

## Impulso e Quantidade de Movimento
- Impulso e teorema do impulso
- Conservação da quantidade de movimento
- Colisões elásticas e inelásticas

## Dicas de Memorização
- Crie analogias com situações cotidianas
- Desenhe diagramas de forças
- Faça tabela de fórmulas por tópico
- Resolva questões contextualizadas'),

  (7, 'Física - Eletricidade e Ondas', '# Física - Eletricidade e Ondas

## Eletrostática
- Carga elétrica e Lei de Coulomb
- Campo elétrico
- Potencial elétrico
- Capacitores

## Eletrodinâmica
- Corrente elétrica
- Resistência e Lei de Ohm
- Circuitos elétricos
- Potência elétrica

## Eletromagnetismo
- Campo magnético
- Força magnética
- Indução eletromagnética
- Transformadores

## Ondulatória
- Características das ondas
- Fenômenos ondulatórios
- Ondas sonoras
- Ondas eletromagnéticas

## Estratégias ENEM
- Entenda conceitos antes de decorar fórmulas
- Relacione com aplicações tecnológicas
- Pratique análise de circuitos
- Memorize ordem de grandeza'),

  (8, 'Física - Termodinâmica e Óptica', '# Termodinâmica e Óptica

## Termologia
- Temperatura e escalas termométricas
- Dilatação térmica
- Calor sensível e latente
- Mudanças de estado

## Termodinâmica
- Trabalho e energia interna
- Primeira lei da termodinâmica
- Segunda lei e entropia
- Máquinas térmicas

## Óptica Geométrica
- Reflexão e refração
- Espelhos planos e esféricos
- Lentes convergentes e divergentes
- Instrumentos ópticos

## Óptica Física
- Natureza da luz
- Interferência e difração
- Polarização

## Técnicas
- Faça diagramas de raios luminosos
- Relacione com fenômenos naturais
- Memorize convenções de sinais
- Pratique conversão de unidades'),

  (9, 'Química - Química Geral', '# Química Geral

## Estrutura Atômica
- Modelos atômicos
- Número atômico e massa
- Distribuição eletrônica
- Tabela periódica

## Ligações Químicas
- Ligação iônica
- Ligação covalente
- Ligação metálica
- Forças intermoleculares

## Funções Inorgânicas
- Ácidos e bases
- Sais e óxidos
- Nomenclatura
- Reações de neutralização

## Reações Químicas
- Balanceamento de equações
- Tipos de reações
- Estequiometria
- Rendimento e pureza

## Dicas Práticas
- Use mnemônicos para famílias da tabela periódica
- Crie cards de funções inorgânicas
- Pratique balanceamento diariamente
- Relacione com produtos do cotidiano'),

  (10, 'Química - Físico-Química', '# Físico-Química

## Soluções
- Concentração e diluição
- Solubilidade
- Propriedades coligativas
- Misturas e separações

## Termoquímica
- Entalpia e calor de reação
- Lei de Hess
- Energia de ligação
- Espontaneidade

## Cinética Química
- Velocidade das reações
- Fatores que influenciam
- Lei da velocidade
- Catalisadores

## Equilíbrio Químico
- Constante de equilíbrio
- Deslocamento de equilíbrio
- pH e pOH
- Hidrólise salina

## Estratégias
- Faça tabelas de fórmulas
- Resolva exercícios de pH
- Memorize valores de constantes
- Use gráficos para entender conceitos'),

  (11, 'Química Orgânica', '# Química Orgânica

## Funções Orgânicas
- Hidrocarbonetos
- Álcoois, fenóis, éteres
- Aldeídos e cetonas
- Ácidos carboxílicos e ésteres
- Aminas e amidas

## Nomenclatura
- IUPAC
- Nomenclatura usual
- Cadeias carbônicas
- Isomeria

## Reações Orgânicas
- Substituição
- Adição
- Eliminação
- Oxidação e redução
- Polimerização

## Biomoléculas
- Carboidratos
- Lipídios
- Proteínas
- Ácidos nucleicos

## Técnicas de Memorização
- Desenhe estruturas diariamente
- Crie árvore de funções orgânicas
- Use modelos moleculares mentais
- Relacione com medicamentos e alimentos'),

  (12, 'Biologia - Citologia e Genética', '# Citologia e Genética

## Citologia
- Células procariontes e eucariontes
- Organelas e funções
- Membrana plasmática e transporte
- Metabolismo energético

## Divisão Celular
- Mitose e meiose
- Ciclo celular
- Crossing-over
- Gametogênese

## Genética Clássica
- Leis de Mendel
- Herança ligada ao sexo
- Polialelia
- Heredogramas

## Genética Molecular
- DNA e RNA
- Síntese proteica
- Mutações
- Biotecnologia

## Dicas de Estudo
- Desenhe células e organelas
- Faça exercícios de cruzamento
- Crie mapas de conceitos
- Use vídeos de processos celulares'),

  (13, 'Biologia - Evolução e Ecologia', '# Evolução e Ecologia

## Evolução
- Teorias evolutivas
- Seleção natural
- Evidências da evolução
- Especiação
- Evolução humana

## Ecologia
- Conceitos básicos: habitat, nicho, população
- Cadeias e teias alimentares
- Ciclos biogeoquímicos
- Relações ecológicas

## Ecossistemas Brasileiros
- Amazônia
- Cerrado
- Mata Atlântica
- Caatinga
- Pantanal
- Pampa

## Problemas Ambientais
- Aquecimento global
- Desmatamento
- Poluição
- Perda de biodiversidade

## Estratégias ENEM
- Relacione evolução com atualidades
- Entenda fluxo de energia
- Memorize biomas brasileiros
- Conecte com sustentabilidade'),

  (14, 'Biologia - Fisiologia Humana', '# Fisiologia Humana

## Sistemas do Corpo
- Sistema digestório
- Sistema circulatório
- Sistema respiratório
- Sistema excretor
- Sistema nervoso
- Sistema endócrino
- Sistema imunológico

## Nutrição
- Nutrientes e funções
- Pirâmide alimentar
- Doenças nutricionais
- Metabolismo

## Saúde e Doenças
- Doenças infectocontagiosas
- Doenças degenerativas
- Prevenção e vacinas
- Saúde pública

## Reprodução
- Sistema reprodutor
- Métodos contraceptivos
- DSTs
- Desenvolvimento embrionário

## Técnicas
- Desenhe sistemas do corpo
- Crie analogias funcionais
- Memorize hormônios e funções
- Relacione com saúde pública'),

  (15, 'História do Brasil', '# História do Brasil

## Brasil Colônia
- Descobrimento e colonização
- Economia açucareira e mineração
- Escravidão
- Movimentos emancipacionistas

## Brasil Império
- Independência
- Primeiro Reinado
- Período Regencial
- Segundo Reinado
- Abolição e República

## República Velha
- Proclamação da República
- República oligárquica
- Movimentos sociais
- Tenentismo

## Era Vargas
- Revolução de 1930
- Estado Novo
- Trabalhismo
- Segunda Guerra Mundial

## Ditadura Militar
- Golpe de 1964
- AI-5 e repressão
- Milagre econômico
- Redemocratização

## Brasil Contemporâneo
- Nova República
- Plano Real
- Governos recentes
- Desafios atuais

## Dicas
- Crie linha do tempo ilustrada
- Conecte eventos com causas/consequências
- Memorize presidentes e períodos
- Relacione com contexto mundial'),

  (16, 'História Geral', '# História Geral

## Idade Antiga
- Civilizações mesopotâmicas
- Egito Antigo
- Grécia: democracia e cultura
- Roma: república e império
- Cristianismo

## Idade Média
- Feudalismo
- Igreja Católica e poder
- Cruzadas
- Renascimento comercial
- Formação dos Estados Nacionais

## Idade Moderna
- Renascimento cultural
- Reformas religiosas
- Absolutismo
- Expansão marítima
- Iluminismo
- Revoluções burguesas

## Idade Contemporânea
- Revolução Industrial
- Imperialismo
- Primeira Guerra Mundial
- Revolução Russa
- Segunda Guerra Mundial
- Guerra Fria
- Globalização

## Estratégias
- Faça mapas mentais por período
- Conecte eventos globalmente
- Memorize datas-chave
- Entenda contextos, não apenas fatos'),

  (17, 'Geografia Física e Ambiental', '# Geografia Física e Ambiental

## Cartografia
- Escalas e projeções
- Coordenadas geográficas
- Interpretação de mapas
- Fusos horários

## Geologia
- Estrutura da Terra
- Placas tectônicas
- Rochas e minerais
- Relevo brasileiro

## Climatologia
- Fatores climáticos
- Climas do Brasil e do mundo
- Massas de ar
- Fenômenos climáticos

## Hidrografia
- Bacias hidrográficas
- Águas continentais
- Oceanos e mares
- Recursos hídricos

## Biomas e Ecossistemas
- Vegetação brasileira
- Vegetação mundial
- Problemas ambientais
- Desenvolvimento sustentável

## Técnicas
- Pratique leitura de mapas
- Desenhe esquemas de clima
- Memorize características dos biomas
- Relacione com questões atuais'),

  (18, 'Geografia Humana e Econômica', '# Geografia Humana e Econômica

## População
- Teorias demográficas
- Pirâmides etárias
- Migrações
- Urbanização
- IDH e indicadores sociais

## Geopolítica
- Conflitos contemporâneos
- Organizações internacionais
- Blocos econômicos
- Nova ordem mundial
- Terrorismo

## Geografia Econômica
- Sistemas econômicos
- Globalização
- Setores da economia
- Comércio internacional
- Desenvolvimento econômico

## Geografia Urbana
- Urbanização brasileira
- Problemas urbanos
- Rede urbana
- Metropolização
- Cidades globais

## Geografia Agrária
- Estrutura fundiária
- Agricultura brasileira
- Reforma agrária
- Agronegócio
- Movimentos sociais no campo

## Dicas Práticas
- Acompanhe notícias internacionais
- Analise gráficos e tabelas
- Memorize dados do Brasil
- Conecte economia com política'),

  (19, 'Filosofia', '# Filosofia

## Filosofia Antiga
- Pré-socráticos
- Sócrates, Platão, Aristóteles
- Escolas helenísticas
- Filosofia cristã

## Filosofia Moderna
- Racionalismo: Descartes
- Empirismo: Locke, Hume
- Kant e o Iluminismo
- Contratualistas: Hobbes, Rousseau

## Filosofia Contemporânea
- Marxismo
- Nietzsche
- Existencialismo
- Escola de Frankfurt
- Pós-modernidade

## Temas Filosóficos
- Ética e moral
- Política e poder
- Conhecimento e verdade
- Arte e estética
- Ciência e tecnologia

## Filósofos Brasileiros
- Pensamento social brasileiro
- Filosofia da libertação
- Questões contemporâneas

## Estratégias ENEM
- Relacione filósofos com contexto histórico
- Entenda conceitos centrais
- Conecte com atualidades
- Pratique análise de textos filosóficos'),

  (20, 'Sociologia', '# Sociologia

## Clássicos da Sociologia
- Émile Durkheim: fato social
- Karl Marx: luta de classes
- Max Weber: ação social
- Método sociológico

## Cultura e Sociedade
- Conceito de cultura
- Etnocentrismo e relativismo
- Cultura popular e erudita
- Indústria cultural
- Diversidade cultural brasileira

## Estrutura Social
- Classes sociais
- Mobilidade social
- Desigualdade social
- Pobreza e exclusão
- Estratificação

## Instituições Sociais
- Família
- Religião
- Educação
- Estado
- Mídia

## Movimentos Sociais
- Movimentos sociais no Brasil
- Movimentos identitários
- Cidadania e direitos
- Participação política
- Democracia

## Trabalho e Sociedade
- Fordismo e Taylorismo
- Toyotismo
- Trabalho na contemporaneidade
- Desemprego
- Precarização

## Dicas
- Conecte teorias com realidade brasileira
- Analise fenômenos sociais atuais
- Memorize conceitos-chave
- Relacione sociólogos e suas ideias'),

  (21, 'Inglês Instrumental', '# Inglês Instrumental para ENEM

## Estratégias de Leitura
- Skimming: leitura rápida para ideia geral
- Scanning: busca de informações específicas
- Cognatos e falsos cognatos
- Inferência contextual

## Gramática Essencial
- Tempos verbais básicos
- Pronomes
- Conectivos
- Preposições
- Comparativos e superlativos

## Vocabulário Frequente
- Palavras-chave por tema
- Expressões idiomáticas comuns
- Vocabulário acadêmico
- Termos técnicos recorrentes

## Gêneros Textuais
- Artigos de jornal
- Textos científicos
- Tirinhas e charges
- Anúncios publicitários
- Manuais e instruções

## Dicas para o ENEM
- Não traduza palavra por palavra
- Identifique tipo de texto primeiro
- Use contexto para palavras desconhecidas
- Priorize compreensão global
- Pratique com textos autênticos diariamente

## Técnicas de Memorização
- Flashcards de vocabulário
- Leitura diária de notícias em inglês
- Músicas e legendas
- Apps de idiomas'),

  (22, 'Espanhol Instrumental', '# Espanhol Instrumental para ENEM

## Estratégias de Compreensão
- Aproveite similaridades com português
- Identifique heterosemánticos
- Pratique leitura extensiva
- Use contexto visual

## Gramática Fundamental
- Verbos irregulares comuns
- Ser vs Estar
- Pretéritos
- Pronombres
- Muy vs Mucho

## Vocabulário Essencial
- Falsos amigos (heterosemánticos)
- Vocabulário por temas
- Expressões cotidianas
- Vocabulário acadêmico

## Heterosemánticos Importantes
- Apellido (sobrenome)
- Largo (longo)
- Taller (oficina)
- Exito (sucesso)
- Todavía (ainda)

## Gêneros Textuais
- Notícias hispanoamericanas
- Textos literários
- HQs e tirinhas
- Propagandas
- Textos informativos

## Cultura Hispânica
- Literatura hispanoamericana
- Costumbres e tradiciones
- Geografia e história
- Variantes do espanhol

## Dicas Práticas
- Não confunda com português
- Memorize heterosemánticos
- Leia em espanhol 15min/dia
- Assista séries espanholas com legendas')
) AS lesson_data(order_index, title, content);