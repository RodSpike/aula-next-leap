import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REVOKE-FREE-ACCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin
    const { data: hasAdminRole, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (roleError || !hasAdminRole) {
      throw new Error("Unauthorized: Only admins can revoke free access");
    }
    logStep("Admin access verified");

    const { email } = await req.json();
    if (!email) throw new Error("Email is required");
    logStep("Email received", { email });

    // First, find the user by email (if they have an account)
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
    if (listError) throw listError;
    
    const userToDelete = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userToDelete) {
      logStep("User account found, deleting", { userId: userToDelete.id });
      
      // Delete the user account (this will cascade delete profile, subscriptions, etc.)
      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userToDelete.id);
      if (deleteError) throw deleteError;
      
      logStep("User account deleted successfully", { userId: userToDelete.id });
    } else {
      logStep("No user account found for this email, continuing with revoke", { email });
    }

    // Update free user access to inactive
    const { data, error } = await supabaseClient
      .from('admin_free_users')
      .update({ active: false })
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error) throw error;
    logStep("Free access revoked successfully", { email });

    return new Response(JSON.stringify({ 
      success: true, 
      message: userToDelete 
        ? "Free access revoked and user account deleted. User must register again as a paying customer."
        : "Free access revoked successfully. User had not registered yet.",
      data,
      account_deleted: !!userToDelete
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in revoke-free-access", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});