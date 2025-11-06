import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get authorization header to verify caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with anon key to verify caller identity
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the caller's user
    const { data: { user: caller }, error: userError } = await authClient.auth.getUser();
    if (userError || !caller) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized: Invalid token');
    }

    console.log('[admin-create-free-user] Caller:', caller.id);

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin using the security definer function
    const { data: isAdmin, error: roleError } = await adminClient.rpc('user_has_admin_role', {
      user_uuid: caller.id,
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      throw new Error('Failed to verify admin role');
    }

    if (!isAdmin) {
      throw new Error('Forbidden: Only admins can create free user accounts');
    }

    // Parse request body
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      throw new Error('Missing required fields: email, name, password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[admin-create-free-user] Creating account for:', normalizedEmail);

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (userExists) {
      throw new Error('Um usuário com este email já existe. Use "Conceder Acesso" para adicionar à lista gratuita ou escolha outro email.');
    }

    // Create the user account with email already confirmed
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm so user can login immediately
      user_metadata: {
        full_name: name,
        username: normalizedEmail.split('@')[0],
      },
    });

    if (createError) {
      console.error('User creation error:', createError);
      throw new Error(`Erro ao criar usuário: ${createError.message}`);
    }

    console.log('[admin-create-free-user] User created:', newUser.user.id);

    // Ensure entry exists in admin_free_users (handle old method gracefully)
    const { data: existingFree, error: freeSelectError } = await adminClient
      .from('admin_free_users')
      .select('id, active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (freeSelectError) {
      console.error('Free user select error:', freeSelectError);
    }

    if (existingFree?.id) {
      const { error: freeUpdateError } = await adminClient
        .from('admin_free_users')
        .update({ active: true, granted_by: caller.id })
        .eq('id', existingFree.id);
      if (freeUpdateError) {
        console.error('Free user update error:', freeUpdateError);
      }
    } else {
      const { error: freeInsertError } = await adminClient
        .from('admin_free_users')
        .insert({ email: normalizedEmail, active: true, granted_by: caller.id });
      if (freeInsertError) {
        console.error('Free user insert error:', freeInsertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        email: normalizedEmail,
        message: 'Free user account created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[admin-create-free-user] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('Unauthorized') ? 401 : 
                error.message?.includes('Forbidden') ? 403 : 400,
      }
    );
  }
});
