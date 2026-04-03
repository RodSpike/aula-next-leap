import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_MAP: Record<string, string> = {
  monthly: "price_1THvZ2K2ADuy4IKKTxSXljLX",   // R$99.90/month
  semester: "price_1THvaNK2ADuy4IKKAkmPdX84",   // R$479.52/6 months (20% off)
  annual: "price_1THvaoK2ADuy4IKKZdxdhxGy",     // R$838.44/year (30% off)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
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
      } catch (_) {}
    }

    let plan = "monthly";
    let bodyEmail: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.email === "string") {
        bodyEmail = body.email;
      }
      if (body && typeof body.plan === "string" && PRICE_MAP[body.plan]) {
        plan = body.plan;
      }
    } catch (_) {}

    if (!userEmail && bodyEmail) userEmail = bodyEmail;

    const priceId = PRICE_MAP[plan];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail ?? undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      locale: "pt-BR",
      billing_address_collection: "auto",
      phone_number_collection: {
        enabled: false,
      },
      subscription_data: {
        metadata: {
          ...(userId ? { user_id: userId } : {}),
          plan,
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
