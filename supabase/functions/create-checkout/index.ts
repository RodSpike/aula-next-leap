import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Supabase client with anon key is enough for auth.getUser when a JWT is provided
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Try to get authenticated user (but do not require it)
    let userEmail: string | null = null;
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data, error } = await supabaseClient.auth.getUser(token);
        if (!error && data.user?.email) {
          userEmail = data.user.email;
          userId = data.user.id;
        }
      } catch (_) {
        // Ignore auth errors – we support guest checkout
      }
    }

    // Optional email from request body (for guest checkout)
    let bodyEmail: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.email === "string") {
        bodyEmail = body.email;
      }
    } catch (_) {
      // no body provided
    }

    if (!userEmail && bodyEmail) userEmail = bodyEmail;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Look up existing customer if we have an email
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      // Attach customer or fallback to passing the email (or neither – Stripe will capture it in Checkout)
      customer: customerId,
      customer_email: customerId ? undefined : userEmail ?? undefined,
      line_items: [
        {
          price: "price_1SBEjRK2ADuy4IKKJHHgAHhY", // Aula Click Premium price (BRL 59.90/month)
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      locale: "pt-BR",
      billing_address_collection: "required",
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          ...(userId ? { user_id: userId } : {}),
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});