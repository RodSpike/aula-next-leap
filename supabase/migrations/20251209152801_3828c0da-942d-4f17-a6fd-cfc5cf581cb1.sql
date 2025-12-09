-- Insert Speech Tutor specific achievements
INSERT INTO achievements (key, name, description, category, tier, icon, xp_reward, requirement_count) VALUES
('speech_first_session', 'Primeira Conversa', 'Complete sua primeira sessão no Speech Tutor', 'learning', 'bronze', '🎤', 15, 1),
('speech_5_sessions', 'Praticante', 'Complete 5 sessões no Speech Tutor', 'learning', 'bronze', '🗣️', 30, 5),
('speech_10_minutes', '10 Minutos de Prática', 'Acumule 10 minutos de prática no Speech Tutor', 'learning', 'bronze', '⏱️', 25, 10),
('speech_30_minutes', '30 Minutos de Prática', 'Acumule 30 minutos de prática no Speech Tutor', 'learning', 'silver', '⏰', 75, 30),
('speech_60_minutes', '1 Hora de Prática', 'Acumule 1 hora de prática no Speech Tutor', 'learning', 'silver', '🕐', 100, 60),
('speech_100_messages', 'Conversador', 'Envie 100 mensagens no Speech Tutor', 'learning', 'silver', '💬', 80, 100),
('speech_500_words', 'Falante Fluente', 'Fale 500 palavras no Speech Tutor', 'learning', 'silver', '📝', 90, 500),
('speech_180_minutes', '3 Horas de Prática', 'Acumule 3 horas de prática no Speech Tutor', 'learning', 'gold', '🎙️', 200, 180),
('speech_25_sessions', 'Dedicado ao Speaking', 'Complete 25 sessões no Speech Tutor', 'learning', 'gold', '🏅', 150, 25),
('speech_1000_words', 'Mestre da Fala', 'Fale 1000 palavras no Speech Tutor', 'learning', 'gold', '👑', 250, 1000),
('speech_300_minutes', '5 Horas de Prática', 'Acumule 5 horas de prática no Speech Tutor', 'learning', 'platinum', '🌟', 400, 300),
('speech_50_sessions', 'Expert em Conversação', 'Complete 50 sessões no Speech Tutor', 'learning', 'platinum', '🏆', 500, 50);