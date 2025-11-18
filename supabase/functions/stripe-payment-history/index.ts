import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PAYMENT-HISTORY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is master admin
    if (user.email !== "rodspike2k8@gmail.com") {
      throw new Error("Unauthorized: Only master admin can access payment history");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch payment intents
    logStep("Fetching payment intents");
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      expand: ['data.customer', 'data.invoice'],
    });

    // Fetch charges for more details
    logStep("Fetching charges");
    const charges = await stripe.charges.list({
      limit: 100,
      expand: ['data.customer', 'data.invoice'],
    });

    // Fetch invoices
    logStep("Fetching invoices");
    const invoices = await stripe.invoices.list({
      limit: 100,
      expand: ['data.customer', 'data.subscription'],
    });

    // Combine and format the data
    const transactions = [];

    // Add payment intents
    for (const pi of paymentIntents.data) {
      transactions.push({
        id: pi.id,
        type: 'payment_intent',
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        customer_email: typeof pi.customer === 'object' && pi.customer ? pi.customer.email : null,
        customer_id: typeof pi.customer === 'string' ? pi.customer : (typeof pi.customer === 'object' && pi.customer ? pi.customer.id : null),
        description: pi.description,
        invoice_url: typeof pi.invoice === 'object' && pi.invoice ? pi.invoice.hosted_invoice_url : null,
      });
    }

    // Add charges that aren't already covered by payment intents
    for (const charge of charges.data) {
      if (!transactions.find(t => t.id === charge.payment_intent)) {
        transactions.push({
          id: charge.id,
          type: 'charge',
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          created: charge.created,
          customer_email: typeof charge.customer === 'object' && charge.customer ? charge.customer.email : null,
          customer_id: typeof charge.customer === 'string' ? charge.customer : (typeof charge.customer === 'object' && charge.customer ? charge.customer.id : null),
          description: charge.description,
          invoice_url: typeof charge.invoice === 'object' && charge.invoice ? charge.invoice.hosted_invoice_url : null,
          receipt_url: charge.receipt_url,
        });
      }
    }

    // Add invoices
    for (const invoice of invoices.data) {
      transactions.push({
        id: invoice.id,
        type: 'invoice',
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        customer_email: typeof invoice.customer === 'object' && invoice.customer ? invoice.customer.email : null,
        customer_id: typeof invoice.customer === 'string' ? invoice.customer : (typeof invoice.customer === 'object' && invoice.customer ? invoice.customer.id : null),
        description: invoice.description,
        invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : (typeof invoice.subscription === 'object' && invoice.subscription ? invoice.subscription.id : null),
      });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => b.created - a.created);

    logStep("Payment history fetched successfully", { count: transactions.length });

    return new Response(JSON.stringify({ 
      success: true,
      transactions,
      total_count: transactions.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-payment-history", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
