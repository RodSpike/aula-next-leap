import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referral_code, referred_email } = await req.json();
    if (!referral_code || !referred_email) {
      return new Response(JSON.stringify({ error: "Missing referral_code or referred_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find teacher affiliate by referral code
    const { data: affiliate, error: affError } = await supabaseClient
      .from("teacher_affiliates")
      .select("id, status")
      .eq("referral_code", referral_code)
      .eq("status", "approved")
      .maybeSingle();

    if (affError || !affiliate) {
      return new Response(JSON.stringify({ error: "Invalid or inactive referral code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if referral already exists for this email
    const { data: existing } = await supabaseClient
      .from("teacher_referrals")
      .select("id")
      .eq("teacher_id", affiliate.id)
      .eq("referred_email", referred_email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Referral already tracked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create referral record
    const { error: insertError } = await supabaseClient
      .from("teacher_referrals")
      .insert({
        teacher_id: affiliate.id,
        referred_email: referred_email.toLowerCase(),
        status: "pending",
      });

    if (insertError) throw insertError;

    // Increment teacher's total_referrals
    await supabaseClient.rpc("increment_teacher_referrals" as any, { _teacher_id: affiliate.id });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("track-teacher-referral error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
