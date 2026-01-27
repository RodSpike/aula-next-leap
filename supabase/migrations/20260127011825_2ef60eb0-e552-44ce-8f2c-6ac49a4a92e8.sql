-- Update AI teacher avatar URLs with actual generated images
UPDATE ai_teachers 
SET avatar_url = 'https://aula-next-leap.lovable.app/ai-teachers/junior-avatar.png',
    updated_at = NOW()
WHERE name = 'Júnior';

UPDATE ai_teachers 
SET avatar_url = 'https://aula-next-leap.lovable.app/ai-teachers/maria-avatar.png',
    updated_at = NOW()
WHERE name = 'Maria';

UPDATE ai_teachers 
SET avatar_url = 'https://aula-next-leap.lovable.app/ai-teachers/vitoria-avatar.png',
    updated_at = NOW()
WHERE name = 'Vitória';

UPDATE ai_teachers 
SET avatar_url = 'https://aula-next-leap.lovable.app/ai-teachers/juliana-avatar.png',
    updated_at = NOW()
WHERE name = 'Juliana';