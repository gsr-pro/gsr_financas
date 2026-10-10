// @ts-nocheck
// Supabase Edge Function: stripe-webhook (Runtime: Deno)
// Sincroniza assinaturas e pagamentos da Stripe diretamente no banco PostgreSQL do Supabase
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Declaração de ambient types para compatibilidade com IDEs fora do ambiente Deno
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'whsec_bm7DYsOh9cKwKKRkP2JXZLuWd7pWKkRL';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Assinatura do Stripe ausente.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    // No Deno/Edge Runtime com SubtleCrypto, a validação de assinatura DEVE ser assíncrona
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na validação do webhook';
    console.error(`Erro ao validar evento Stripe: ${message}`);
    return new Response(`Erro de webhook: ${message}`, { status: 400 });
  }

  // Instancia client do Supabase com service_role_key para gravar ignorando RLS
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://qluewnanniwhcjlgvjof.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente.');
    return new Response('Configuração interna ausente', { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const userEmail = session.customer_details?.email || session.customer_email;

        console.log(`[Stripe Webhook] checkout.session.completed recebido para cliente: ${userEmail}, ref: ${userId}`);

        // Fallback: se client_reference_id não veio, localiza o usuário pelo e-mail
        if (!userId && userEmail) {
          const { data: perfisUser } = await supabaseAdmin
            .from('perfis')
            .select('id')
            .ilike('email', userEmail.trim())
            .maybeSingle();

          if (perfisUser?.id) {
            userId = perfisUser.id;
          }
        }

        // Se houver subscriptionId, buscamos os dados completos da assinatura no Stripe
        let currentPeriodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
        let stripePriceId: string | null = null;
        let subscriptionItemNickname = '';
        let subscriptionPriceMetadataPlan = '';

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            if (sub.current_period_end) {
              currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
            }
            const firstItem = sub.items?.data?.[0];
            stripePriceId = firstItem?.price?.id || null;
            subscriptionItemNickname = (firstItem?.price?.nickname || '').toLowerCase();
            subscriptionPriceMetadataPlan = (firstItem?.price?.metadata?.plan || '').toLowerCase();
          } catch (fetchSubErr) {
            console.warn('[Stripe Webhook] Aviso ao obter detalhes da assinatura:', fetchSubErr);
          }
        }

        // Determina se o plano é 'contador', 'business' ou 'lite'
        const metaTier = (session.metadata?.tier || '').toLowerCase();
        const metaPlan = (session.metadata?.plan || '').toLowerCase();
        const totalAmount = session.amount_total ?? 0;

        let planTier: 'contador' | 'business' | 'lite' = 'lite';
        if (
          metaTier === 'contador' ||
          metaPlan.includes('contador') ||
          subscriptionItemNickname.includes('contador') ||
          subscriptionPriceMetadataPlan.includes('contador') ||
          (stripePriceId && (stripePriceId.includes('contador') || stripePriceId.includes('4990') || stripePriceId.includes('1UOnn'))) ||
          totalAmount >= 4000
        ) {
          planTier = 'contador';
        } else if (
          metaTier === 'business' ||
          metaTier === 'negocio' ||
          metaPlan.includes('business') ||
          metaPlan.includes('negocio') ||
          subscriptionItemNickname.includes('business') ||
          subscriptionPriceMetadataPlan.includes('business') ||
          (stripePriceId && (stripePriceId.includes('1ULvH') || stripePriceId.includes('1ULvI') || stripePriceId.includes('1495'))) ||
          (totalAmount >= 1200 && totalAmount < 4000)
        ) {
          planTier = 'business';
        } else {
          planTier = 'lite';
        }

        if (userId) {
          const { error: upsertErr } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId || null,
              stripe_subscription_id: subscriptionId || null,
              stripe_price_id: stripePriceId || null,
              plan_tier: planTier,
              status: 'active',
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (upsertErr) {
            console.error('[Stripe Webhook] Erro ao gravar assinatura no Supabase:', upsertErr);
            throw upsertErr;
          }

          console.log(`[Stripe Webhook] Assinatura ativada com sucesso para usuário: ${userId}, plano: ${planTier}`);
        } else {
          console.warn('[Stripe Webhook] Usuário não identificado para a sessão:', session.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status === 'active'
          ? 'active'
          : subscription.status === 'past_due'
          ? 'past_due'
          : 'canceled';

        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        // Determina tier baseado nos itens do plano se disponível (Upgrade / Downgrade)
        const priceId = subscription.items?.data?.[0]?.price?.id || '';
        const nickname = (subscription.items?.data?.[0]?.price?.nickname || '').toLowerCase();
        const metaPlan = (subscription.items?.data?.[0]?.price?.metadata?.plan || '').toLowerCase();

        let planTier: 'contador' | 'business' | 'lite' | undefined;
        if (
          priceId.includes('contador') ||
          priceId.includes('4990') ||
          priceId.includes('1UOnn') ||
          nickname.includes('contador') ||
          metaPlan.includes('contador')
        ) {
          planTier = 'contador';
        } else if (
          priceId.includes('1ULvH') ||
          priceId.includes('1ULvI') ||
          priceId.includes('1495') ||
          nickname.includes('business') ||
          metaPlan.includes('business') ||
          metaPlan.includes('negocio')
        ) {
          planTier = 'business';
        } else if (
          priceId.includes('1ULU') ||
          priceId.includes('745') ||
          nickname.includes('lite') ||
          nickname.includes('pessoal') ||
          metaPlan.includes('lite') ||
          metaPlan.includes('pessoal')
        ) {
          planTier = 'lite';
        }

        const updateData: Record<string, unknown> = {
          status,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        };

        if (planTier) {
          updateData.plan_tier = planTier;
        }

        if (priceId) {
          updateData.stripe_price_id = priceId;
        }

        const { error: updateErr } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_customer_id', customerId);

        if (updateErr) {
          console.error('[Stripe Webhook] Erro ao atualizar subscription:', updateErr);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar webhook';
    console.error('[Stripe Webhook] Erro de execução:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
