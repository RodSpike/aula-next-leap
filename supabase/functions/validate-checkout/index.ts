import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("Session ID is required");
    }
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Checkout session retrieved", { 
      payment_status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription 
    });

    if (session.payment_status !== 'paid' && session.mode === 'payment') {
      throw new Error('Payment not completed');
    }

    if (session.mode === 'subscription' && !session.subscription) {
      throw new Error('Subscription not found');
    }

    // Update user subscription in database
    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      throw new Error('Customer email not found in session');
    }
    logStep("Customer email found", { email: customerEmail });

    // Get user by email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
    if (userError) throw userError;

    const user = userData.users.find(u => u.email === customerEmail);
    if (!user) {
      throw new Error('User not found');
    }
    logStep("User found", { userId: user.id });

    // Update subscription in database
    const subscriptionData = {
      user_id: user.id,
      plan: 'premium',
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      current_period_end: session.mode === 'subscription' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days for subscription
        : null
    };

    // Upsert user subscription
    const { error: upsertError } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      logStep("Database upsert error", upsertError);
      throw upsertError;
    }

    logStep("Subscription updated successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Subscription activated successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-checkout", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});