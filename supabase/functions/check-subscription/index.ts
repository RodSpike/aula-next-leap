import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin first - admins bypass all subscription checks
    const { data: hasAdminRole, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!roleError && hasAdminRole) {
      logStep("User is admin - bypassing subscription checks");
      return new Response(JSON.stringify({ subscribed: true, admin: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking database for trial");
      
      // Check if user has trial in database
      const { data: subscription } = await supabaseClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (subscription) {
        const now = new Date();
        const trialEnd = new Date(subscription.trial_ends_at);
        const isInTrial = trialEnd > now;
        
        logStep("Database subscription found", { 
          isInTrial, 
          trialEnd: subscription.trial_ends_at,
          status: subscription.subscription_status 
        });
        
        return new Response(JSON.stringify({
          subscribed: subscription.subscription_status === 'active',
          in_trial: isInTrial,
          trial_ends_at: subscription.trial_ends_at,
          product_id: null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("No subscription found");
      return new Response(JSON.stringify({ subscribed: false, in_trial: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    // Check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });
    
    const hasActiveSub = activeSubscriptions.data.length > 0;
    const hasTrialSub = trialingSubscriptions.data.length > 0;
    
    let productId = null;
    let subscriptionEnd = null;
    let trialEnd = null;

    if (hasActiveSub) {
      const subscription = activeSubscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
    } else if (hasTrialSub) {
      const subscription = trialingSubscriptions.data[0];
      trialEnd = new Date(subscription.trial_end ? subscription.trial_end * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      logStep("Trial subscription found", { subscriptionId: subscription.id, trialEnd });
    } else {
      // Check database for trial info
      const { data: dbSubscription } = await supabaseClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (dbSubscription) {
        const now = new Date();
        const dbTrialEnd = new Date(dbSubscription.trial_ends_at);
        const isInTrial = dbTrialEnd > now;
        
        logStep("Database subscription found", { isInTrial, trialEnd: dbSubscription.trial_ends_at });
        
        return new Response(JSON.stringify({
          subscribed: dbSubscription.subscription_status === 'active',
          in_trial: isInTrial,
          trial_ends_at: dbSubscription.trial_ends_at,
          product_id: productId
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("No active or trial subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      in_trial: hasTrialSub,
      trial_ends_at: trialEnd,
      subscription_end: subscriptionEnd,
      product_id: productId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});