-- Populate achievements (challenges) table
INSERT INTO achievements (key, name, description, category, tier, icon, xp_reward, requirement_count) VALUES
-- Learning achievements
('first_lesson', 'Primeira Lição', 'Complete sua primeira lição', 'learning', 'bronze', '📚', 10, 1),
('lesson_streak_3', 'Estudioso Dedicado', 'Complete lições por 3 dias seguidos', 'milestone', 'silver', '🔥', 25, 3),
('lesson_streak_7', 'Semana Perfeita', 'Complete lições por 7 dias seguidos', 'milestone', 'gold', '⭐', 50, 7),
('lesson_streak_30', 'Mestre da Consistência', 'Complete lições por 30 dias seguidos', 'milestone', 'platinum', '💎', 200, 30),
('complete_10_lessons', 'Aprendiz', 'Complete 10 lições', 'learning', 'bronze', '🎓', 50, 10),
('complete_50_lessons', 'Estudante Dedicado', 'Complete 50 lições', 'learning', 'silver', '📖', 150, 50),
('complete_100_lessons', 'Acadêmico', 'Complete 100 lições', 'learning', 'gold', '🏆', 300, 100),
('complete_250_lessons', 'Mestre do Conhecimento', 'Complete 250 lições', 'learning', 'platinum', '👑', 750, 250),

-- Exercise achievements
('perfect_score', 'Pontuação Perfeita', 'Obtenha 100% em um exercício', 'learning', 'bronze', '💯', 20, 1),
('perfect_10', 'Perfeccionista', 'Obtenha 100% em 10 exercícios', 'learning', 'silver', '✨', 75, 10),
('exercise_master', 'Mestre dos Exercícios', 'Complete 100 exercícios', 'learning', 'gold', '🎯', 200, 100),

-- Social achievements
('first_friend', 'Primeiro Amigo', 'Adicione seu primeiro amigo', 'social', 'bronze', '👋', 10, 1),
('social_butterfly', 'Borboleta Social', 'Tenha 10 amigos', 'social', 'silver', '🦋', 50, 10),
('popular', 'Popular', 'Tenha 25 amigos', 'social', 'gold', '⭐', 100, 25),
('celebrity', 'Celebridade', 'Tenha 50 amigos', 'social', 'platinum', '🌟', 250, 50),

-- Engagement achievements
('first_post', 'Primeira Mensagem', 'Faça sua primeira postagem na comunidade', 'engagement', 'bronze', '💬', 10, 1),
('active_member', 'Membro Ativo', 'Faça 25 postagens', 'engagement', 'silver', '📱', 75, 25),
('community_leader', 'Líder Comunitário', 'Faça 100 postagens', 'engagement', 'gold', '👥', 200, 100),
('helpful', 'Prestativo', 'Receba 50 curtidas em suas postagens', 'engagement', 'silver', '❤️', 100, 50),
('influencer', 'Influenciador', 'Receba 200 curtidas em suas postagens', 'engagement', 'gold', '🌠', 300, 200),

-- Milestone achievements
('night_owl', 'Coruja Noturna', 'Estude entre 22h e 6h', 'milestone', 'silver', '🦉', 25, 1),
('early_bird', 'Madrugador', 'Estude entre 5h e 7h', 'milestone', 'silver', '🌅', 25, 1),
('weekend_warrior', 'Guerreiro de Fim de Semana', 'Complete lições no fim de semana', 'milestone', 'bronze', '⚔️', 15, 1),
('level_up', 'Subida de Nível', 'Alcance o nível 10', 'milestone', 'silver', '📈', 100, 10),
('high_achiever', 'Grande Realizador', 'Alcance o nível 25', 'milestone', 'gold', '🏅', 250, 25),
('legendary', 'Lendário', 'Alcance o nível 50', 'milestone', 'platinum', '👑', 500, 50),
('ultimate', 'Supremo', 'Alcance o nível 100', 'milestone', 'platinum', '💫', 1000, 100)
ON CONFLICT (key) DO NOTHING;