-- Add B1 exercises and B2, C1, C2 content

-- B1 Expressing Opinions exercises
INSERT INTO exercises (lesson_id, question, options, correct_answer, explanation, order_index)
SELECT 
    l.id,
    questions.question,
    questions.options::jsonb,
    questions.correct_answer,
    questions.explanation,
    questions.order_index
FROM lessons l
CROSS JOIN (
    VALUES
    ('Which phrase shows strong certainty?', '["I might be wrong, but...", "Perhaps...", "I am absolutely certain that...", "It is possible that..."]', 'I am absolutely certain that...', 'This phrase expresses complete confidence in your opinion.', 1),
    ('How do you politely disagree?', '["You are wrong", "That is stupid", "I see what you mean, but...", "No way"]', 'I see what you mean, but...', 'Start by acknowledging their point before presenting your disagreement.', 2),
    ('Which linking word gives a reason?', '["however", "although", "because", "nevertheless"]', 'because', '"Because" introduces a reason or explanation for something.', 3),
    ('Complete: "___ my opinion, recycling is essential."', '["In", "On", "At", "By"]', 'In', 'The correct phrase is "In my opinion".', 4)
) AS questions(question, options, correct_answer, explanation, order_index)
WHERE l.title LIKE '%Expressing Opinions%' AND l.title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = l.course_id AND courses.level = 'B1');

-- B2 Level Content - Business English
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B2' AND courses.title = 'Business English') THEN
    E'# Introduction to Business English\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Communicate effectively in professional business contexts\n- Write formal business correspondence and reports\n- Participate confidently in meetings and presentations\n- Negotiate deals and handle business discussions\n- Use appropriate business terminology and etiquette\n\n## Key Vocabulary\n\n**Business Operations:**\n- Revenue, profit, turnover, market share\n- Budget, forecast, quarterly reports, ROI\n- Stakeholders, shareholders, board of directors\n- Merger, acquisition, joint venture, partnership\n- Supply chain, logistics, procurement, outsourcing\n\n**Professional Communication:**\n- Agenda, minutes, action items, deadlines\n- Follow-up, cc/bcc, attachment, urgent\n- Conference call, video conference, webinar\n- Proposal, contract, agreement, terms and conditions\n- Networking, relationship building, client relations\n\n**Leadership and Management:**\n- Delegation, supervision, performance review\n- Team building, motivation, productivity\n- Strategic planning, goal setting, KPIs\n- Problem-solving, decision-making, crisis management\n- Innovation, efficiency, continuous improvement\n\n## Grammar Focus\n- Complex conditional structures for business scenarios\n- Passive voice for formal business writing\n- Subjunctive mood for recommendations and proposals\n- Advanced modal verbs for professional obligations'
  
  WHEN title LIKE '%Core Concepts%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B2' AND courses.title = 'Business English') THEN
    E'# Core Concepts: Business English\n\n## Formal Business Writing\n\n### Email Structure\n**Subject Line:** Clear and specific\n**Greeting:** Dear Mr./Ms. [Surname] or Dear [First Name]\n**Opening:** Reference previous contact or state purpose\n**Body:** Main message with clear paragraphs\n**Closing:** Next steps or call to action\n**Sign-off:** Yours sincerely/Best regards + name\n\n### Professional Phrases\n- I am writing to inquire about...\n- Further to our conversation...\n- Please find attached...\n- I would be grateful if you could...\n- Thank you for your prompt response\n- Please do not hesitate to contact me\n\n## Meeting Language\n\n### Starting a Meeting\n- Good morning, everyone. Shall we get started?\n- Thank you all for coming\n- Let me begin by outlining the agenda\n- The purpose of this meeting is to...\n\n### Expressing Opinions\n- From a business perspective...\n- Based on our analysis...\n- The data suggests that...\n- I would recommend that we...\n- In terms of ROI...\n\n### Making Decisions\n- After careful consideration...\n- The best course of action would be...\n- We need to weigh the pros and cons\n- Let us move forward with...\n- This approach offers the most value\n\n## Negotiation Skills\n\n### Making Proposals\n- We would like to propose...\n- Our offer includes...\n- We are prepared to...\n- Would you consider...?\n- How about if we...?\n\n### Responding to Offers\n- That sounds reasonable\n- We need to discuss this internally\n- I am afraid that would not work for us\n- We would need some concessions on...\n- Let me get back to you on that\n\n## Financial Discussions\n\n### Budgets and Costs\n- The budget allocation for...\n- We need to reduce costs by...\n- The projected savings are...\n- This investment will pay for itself\n- We are looking at a 15% increase in revenue'
  
  ELSE content
END
WHERE EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'B2' AND courses.title = 'Business English');

-- C1 Level Content - Literary Analysis
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'C1' AND courses.title = 'Literary Analysis') THEN
    E'# Introduction to Literary Analysis\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Analyze complex literary texts with sophisticated understanding\n- Identify and interpret literary devices, themes, and symbolism\n- Construct well-reasoned arguments about literary works\n- Compare and contrast different authors, genres, and time periods\n- Write comprehensive literary essays with academic rigor\n\n## Key Vocabulary\n\n**Literary Devices:**\n- Metaphor, simile, personification, allegory\n- Irony, satire, paradox, juxtaposition\n- Foreshadowing, flashback, symbolism, imagery\n- Alliteration, assonance, rhythm, meter\n- Stream of consciousness, unreliable narrator\n\n**Critical Analysis:**\n- Theme, motif, archetype, protagonist, antagonist\n- Character development, plot structure, climax\n- Setting, atmosphere, mood, tone\n- Point of view, narrative perspective, voice\n- Genre conventions, literary movements, context\n\n**Academic Writing:**\n- Thesis statement, evidence, textual analysis\n - Close reading, interpretation, argumentation\n- Primary sources, secondary sources, citations\n- Literary criticism, theoretical frameworks\n- Comparative analysis, synthesis, evaluation\n\n## Grammar Focus\n- Subjunctive mood for hypothetical literary scenarios\n- Complex sentence structures for analytical writing\n- Passive constructions for academic objectivity\n- Advanced vocabulary for nuanced interpretation'
  
  ELSE content
END
WHERE EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'C1' AND courses.title = 'Literary Analysis');

-- C2 Level Content - Native-Level Fluency
UPDATE lessons SET content = CASE 
  WHEN title LIKE '%Introduction%' AND EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'C2' AND courses.title = 'Native-Level Fluency') THEN
    E'# Introduction to Native-Level Fluency\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Demonstrate native-like fluency in all language skills\n- Master subtle nuances of meaning and expression\n- Use language flexibly for social, academic, and professional purposes\n- Understand implicit meaning, humor, and cultural references\n- Produce sophisticated, well-structured discourse effortlessly\n\n## Advanced Language Features\n\n**Stylistic Sophistication:**\n- Register variation (formal, informal, technical, colloquial)\n- Rhetorical devices and persuasive techniques\n- Subtle emphasis and implication\n- Sophisticated humor and wordplay\n- Mastery of written and spoken genres\n\n**Pragmatic Competence:**\n- Indirect speech acts and implicature\n- Cultural sensitivity and appropriateness\n- Negotiation of meaning in complex contexts\n- Understanding of subtext and hidden meanings\n- Social and professional etiquette mastery\n\n**Linguistic Precision:**\n- Fine distinctions in meaning and connotation\n- Mastery of collocations and fixed expressions\n- Advanced grammatical structures and exceptions\n- Phonological subtleties and accent reduction\n- Error-free production in demanding contexts\n\n## Grammar Focus\n- Mastery of all tense and aspect combinations\n- Sophisticated use of modal verbs and conditionals\n- Complex syntactic structures and transformations\n- Advanced discourse markers and cohesive devices\n- Idiomatic expressions and phrasal verb mastery'
  
  ELSE content
END
WHERE EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.level = 'C2' AND courses.title = 'Native-Level Fluency');