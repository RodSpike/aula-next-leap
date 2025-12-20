import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AITeacher {
  id: string;
  name: string;
  email: string;
  personality: string;
  personality_traits: {
    style: string;
    approach: string;
    tone: string;
    examples: string;
  };
}

interface GroupPost {
  id: string;
  content: string;
  user_id: string;
  group_id: string;
  created_at: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  level: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, groupId } = await req.json();
    console.log(`[AI-POST] Starting action: ${action}, groupId: ${groupId || 'all'}`);

    // Get an admin user to use as the post author (needed for RLS bypass)
    const { data: adminUser, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.error('[AI-POST] No admin user found:', adminError);
      return new Response(JSON.stringify({ error: 'No admin user found to post as' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemUserId = adminUser.user_id;
    console.log(`[AI-POST] Using admin user for RLS bypass: ${systemUserId}`);

    // Get active AI teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('ai_teachers')
      .select('*')
      .eq('is_active', true);

    if (teachersError) {
      console.error('[AI-POST] Error fetching teachers:', teachersError);
      throw teachersError;
    }

    if (!teachers?.length) {
      console.log('[AI-POST] No active AI teachers found');
      return new Response(JSON.stringify({ error: 'No active AI teachers' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[AI-POST] Found ${teachers.length} active teachers`);

    // Get groups to process
    let groups: CommunityGroup[] = [];
    if (groupId) {
      const { data, error } = await supabase
        .from('community_groups')
        .select('id, name, description, level')
        .eq('id', groupId)
        .eq('is_private_chat', false)
        .single();
      if (error) {
        console.error('[AI-POST] Error fetching group:', error);
      }
      if (data) groups = [data];
    } else {
      const { data, error } = await supabase
        .from('community_groups')
        .select('id, name, description, level')
        .eq('is_private_chat', false)
        .neq('archived', true);
      if (error) {
        console.error('[AI-POST] Error fetching groups:', error);
      }
      if (data) groups = data;
    }

    if (!groups.length) {
      console.log('[AI-POST] No groups to process');
      return new Response(JSON.stringify({ message: 'No groups to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[AI-POST] Processing ${groups.length} groups`);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const group of groups) {
      console.log(`[AI-POST] Processing group: ${group.name}`);

      try {
        if (action === 'interact') {
          // Get recent posts from regular users (not admins, teachers, or AI)
          const hoursAgo = new Date();
          hoursAgo.setHours(hoursAgo.getHours() - 12);

          const { data: recentPosts, error: postsError } = await supabase
            .from('group_posts')
            .select('id, content, user_id, group_id, created_at')
            .eq('group_id', group.id)
            .gte('created_at', hoursAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

          if (postsError) {
            console.error(`[AI-POST] Error fetching posts for ${group.name}:`, postsError);
            continue;
          }

          if (!recentPosts?.length) {
            console.log(`[AI-POST] No recent posts in group ${group.name}`);
            continue;
          }

          // Filter out posts from admins, teachers, and AI
          const postsToRespond: GroupPost[] = [];
          for (const post of recentPosts) {
            // Check if user is admin
            const { data: isAdmin } = await supabase.rpc('user_has_admin_role', { user_uuid: post.user_id });
            if (isAdmin) continue;

            // Check if user is teacher
            const { data: isTeacher } = await supabase.rpc('is_teacher', { user_uuid: post.user_id });
            if (isTeacher) continue;

            // Check if user email is AI teacher
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('user_id', post.user_id)
              .single();
            
            if (profile?.email?.includes('@aulaclick.com')) continue;

            postsToRespond.push(post);
          }

          if (!postsToRespond.length) {
            console.log(`[AI-POST] No posts from regular users in group ${group.name}`);
            continue;
          }

          // Select a random teacher
          const teacher = teachers[Math.floor(Math.random() * teachers.length)] as AITeacher;
          
          // Combine recent posts for context
          const postsContext = postsToRespond.slice(0, 5).map(p => p.content).join('\n---\n');

          // Generate AI response
          const systemPrompt = `Você é ${teacher.name}, um(a) professor(a) de inglês da Aula Click.

Sua personalidade:
- Estilo: ${teacher.personality_traits?.style || 'amigável'}
- Abordagem: ${teacher.personality_traits?.approach || 'didática'}
- Tom: ${teacher.personality_traits?.tone || 'encorajador'}
- Exemplos: ${teacher.personality_traits?.examples || 'práticos'}

Você está respondendo a posts em um grupo de estudantes de inglês chamado "${group.name}" (nível ${group.level}).
${group.description ? `Descrição do grupo: ${group.description}` : ''}

REGRAS IMPORTANTES:
1. Responda de forma natural, como se estivesse participando da conversa
2. Se houver dúvidas sobre inglês, responda de forma pedagógica
3. Mantenha sua personalidade única
4. Use exemplos relevantes ao contexto
5. Seja encorajador(a) e motivador(a)
6. Limite sua resposta a 2-3 parágrafos no máximo
7. Se apropriado, inclua uma dica de vocabulário ou gramática
8. Responda em português, mas com exemplos em inglês quando relevante
9. NÃO coloque seu nome no início da mensagem, apenas responda diretamente`;

          const userPrompt = `Aqui estão os posts recentes dos alunos no grupo:\n\n${postsContext}\n\nParticipe da conversa de forma natural e pedagógica.`;

          console.log(`[AI-POST] Calling AI for interaction in ${group.name}`);

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error(`[AI-POST] AI API error: ${aiResponse.status} - ${errText}`);
            errorCount++;
            continue;
          }

          const aiData = await aiResponse.json();
          const responseContent = aiData.choices?.[0]?.message?.content;

          if (!responseContent) {
            console.error('[AI-POST] No content in AI response');
            errorCount++;
            continue;
          }

          // Format the post content (no header needed, will show from ai_teacher_id)
          const formattedContent = responseContent;

          // Insert the post with ai_teacher_id to identify the AI teacher
          const { data: postData, error: postError } = await supabase
            .from('group_posts')
            .insert({
              group_id: group.id,
              content: formattedContent,
              user_id: systemUserId,
              ai_teacher_id: teacher.id
            })
            .select('id')
            .single();

          if (postError) {
            console.error(`[AI-POST] Error inserting post in ${group.name}:`, postError);
            errorCount++;
            continue;
          }

          console.log(`[AI-POST] Successfully posted interaction in ${group.name}, post ID: ${postData?.id}`);
          successCount++;
          
          results.push({
            group: group.name,
            teacher: teacher.name,
            action: 'interaction',
            postId: postData?.id,
            content: responseContent.substring(0, 200) + '...'
          });

        } else if (action === 'tip') {
          // Generate a tip related to the group's level/topic
          const teacher = teachers[Math.floor(Math.random() * teachers.length)] as AITeacher;

          const systemPrompt = `Você é ${teacher.name}, um(a) professor(a) de inglês da Aula Click.

Sua personalidade:
- Estilo: ${teacher.personality_traits?.style || 'amigável'}
- Abordagem: ${teacher.personality_traits?.approach || 'didática'}
- Tom: ${teacher.personality_traits?.tone || 'encorajador'}
- Exemplos: ${teacher.personality_traits?.examples || 'práticos'}

Você vai postar uma dica educativa no grupo "${group.name}" (nível ${group.level}).
${group.description ? `Descrição do grupo: ${group.description}` : ''}

REGRAS:
1. Crie uma dica útil e interessante sobre inglês
2. A dica deve ser apropriada para o nível ${group.level}
3. Mantenha sua personalidade única
4. Use exemplos práticos
5. Seja conciso(a) - máximo 2 parágrafos
6. Inclua pelo menos um exemplo prático em inglês
7. Termine com uma pergunta ou chamada para engajamento
8. NÃO coloque seu nome no início, apenas a dica diretamente`;

          console.log(`[AI-POST] Calling AI for tip in ${group.name}`);

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Crie uma dica do dia sobre inglês para os alunos.' }
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error(`[AI-POST] AI API error: ${aiResponse.status} - ${errText}`);
            errorCount++;
            continue;
          }

          const aiData = await aiResponse.json();
          const tipContent = aiData.choices?.[0]?.message?.content;

          if (!tipContent) {
            console.error('[AI-POST] No content in AI response');
            errorCount++;
            continue;
          }

          // Format the post content (no header needed, will show from ai_teacher_id)
          const formattedContent = tipContent;

          // Insert the post with ai_teacher_id to identify the AI teacher
          const { data: postData, error: postError } = await supabase
            .from('group_posts')
            .insert({
              group_id: group.id,
              content: formattedContent,
              user_id: systemUserId,
              ai_teacher_id: teacher.id
            })
            .select('id')
            .single();

          if (postError) {
            console.error(`[AI-POST] Error inserting tip in ${group.name}:`, postError);
            errorCount++;
            continue;
          }

          console.log(`[AI-POST] Successfully posted tip in ${group.name}, post ID: ${postData?.id}`);
          successCount++;

          results.push({
            group: group.name,
            teacher: teacher.name,
            action: 'tip',
            postId: postData?.id,
            content: tipContent.substring(0, 200) + '...'
          });
        }
      } catch (groupError) {
        console.error(`[AI-POST] Error processing group ${group.name}:`, groupError);
        errorCount++;
      }
    }

    // Update last run timestamp
    const updateField = action === 'interact' ? 'last_interaction_run' : 'last_tip_run';
    const { error: updateError } = await supabase
      .from('ai_posting_settings')
      .update({
        [updateField]: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .limit(1);

    if (updateError) {
      console.error('[AI-POST] Error updating settings:', updateError);
    }

    console.log(`[AI-POST] Completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      processedGroups: groups.length,
      successCount,
      errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AI-POST] Critical error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
