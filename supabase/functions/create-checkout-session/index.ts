// @ts-nocheck
// Supabase Edge Function: create-checkout-session (Runtime: Deno)
// Cria uma sessão de checkout do Stripe com suporte a cupom de 50% nos 2 primeiros meses
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, interval, couponId, userId, email, returnUrl, tier } = await req.json();

    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes: priceId ou userId.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configuração de descontos: se for plano mensal promocional, aplica o cupom de 50%
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (interval === 'month' && couponId) {
      discounts.push({ coupon: couponId });
    }

    const planTier = tier || 'lite';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts: discounts.length > 0 ? discounts : undefined,
      allow_promotion_codes: interval === 'month',
      customer_email: email || undefined,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          user_id: userId,
          tier: planTier,
          plan: planTier,
        },
      },
      metadata: {
        user_id: userId,
        tier: planTier,
        plan: planTier,
      },
      success_url: `${returnUrl || 'http://localhost:5173'}?session_id={CHECKOUT_SESSION_ID}&checkout=success`,
      cancel_url: `${returnUrl || 'http://localhost:5173'}?checkout=cancel`,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
