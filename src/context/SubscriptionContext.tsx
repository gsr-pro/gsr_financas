import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Subscription, SubscriptionTier, BillingInterval } from '../types/subscription.types';
import type { WorkspaceType } from '../types/app';
import { PLANS } from '../config/plans';

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number;
  isSubscriptionActive: boolean;
  hasAccess: boolean;
  isPaywallActive: boolean;
  canManageObra: boolean;
  canAccessNegocio: boolean;
  canAccessEnvironment: (env: WorkspaceType) => boolean;
  currentPlanTier: SubscriptionTier;
  refreshSubscription: () => Promise<void>;
  startCheckout: (priceId: string, interval: BillingInterval, tier?: SubscriptionTier) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Tabela subscriptions não acessível ou sem dados, aplicando cálculo por auth.users:', error.message);
        const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : Date.now();
        const trialEndMs = userCreatedAt + 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const isStillTrial = now <= trialEndMs;

        setSubscription({
          id: 'auth-trial',
          user_id: user.id,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          stripe_price_id: null,
          plan_tier: 'lite',
          status: isStillTrial ? 'trialing' : 'canceled',
          trial_ends_at: new Date(trialEndMs).toISOString(),
          current_period_end: null,
          cancel_at_period_end: false,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

      if (data) {
        setSubscription(data as Subscription);
      } else {
        // Inicializa o trial de 7 dias
        const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : Date.now();
        const trialEndsAt = new Date(userCreatedAt + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: created, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_tier: 'lite',
            status: 'trialing',
            trial_ends_at: trialEndsAt,
          })
          .select()
          .single();

        if (!insertError && created) {
          setSubscription(created as Subscription);
        }
      }
    } catch (err) {
      console.error('Falha de rede ao consultar assinatura:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasCheckoutSuccess = searchParams.get('checkout') === 'success' || Boolean(searchParams.get('session_id'));

    if (hasCheckoutSuccess) {
      window.history.replaceState({}, document.title, window.location.pathname);
      // Busca imediatamente e agenda retentativas para cobrir a latência de processamento do webhook
      fetchSubscription();
      const t1 = setTimeout(fetchSubscription, 1500);
      const t2 = setTimeout(fetchSubscription, 3500);
      const t3 = setTimeout(fetchSubscription, 6000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      fetchSubscription();
    }

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchSubscription();
      } else if (event === 'SIGNED_OUT') {
        setSubscription(null);
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, [fetchSubscription]);

  // Cálculos de Validade, Regra dos 3 Ambientes e Paywall
  const {
    isTrialing,
    trialDaysRemaining,
    isSubscriptionActive,
    hasAccess,
    isPaywallActive,
    canManageObra,
    canAccessNegocio,
    canAccessEnvironment,
    currentPlanTier,
  } = useMemo(() => {
    if (!subscription) {
      return {
        isTrialing: false,
        trialDaysRemaining: 0,
        isSubscriptionActive: false,
        hasAccess: false,
        isPaywallActive: true,
        canManageObra: false,
        canAccessNegocio: false,
        canAccessEnvironment: () => false,
        currentPlanTier: 'lite' as SubscriptionTier,
      };
    }

    const now = Date.now();
    const trialEndMs = new Date(subscription.trial_ends_at).getTime();
    const isWithinTrial = subscription.status === 'trialing' && now <= trialEndMs;
    const remainingDays = isWithinTrial
      ? Math.max(0, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24)))
      : 0;

    const isActive = subscription.status === 'active';
    const accessAllowed = isActive || isWithinTrial;
    const isPaywallBlocked = !accessAllowed;

    // Regra de Ouro do Modelo SaaS:
    // 1. Durante o Trial (7 dias): acesso aos 3 ambientes liberado para experimentação completa.
    // 2. Pós-Trial / Assinatura Ativa:
    //    - Plano Lite: Acesso a 2 Ambientes (Obra e Pessoal).
    //    - Plano Business: Acesso a 3 Ambientes (Obra, Pessoal e Negócio).
    const hasBusinessPlan =
      subscription.plan_tier === 'business' || subscription.plan_tier === 'negocio';

    const negocioAllowed = isWithinTrial || (isActive && hasBusinessPlan);
    const obraAllowed = isWithinTrial || isActive;

    const envChecker = (env: WorkspaceType): boolean => {
      if (isWithinTrial) return true;
      if (!isActive) return false;
      if (env === 'negocio') return hasBusinessPlan;
      return true; // Obra e Pessoal são liberados em qualquer plano contratado
    };

    return {
      isTrialing: isWithinTrial,
      trialDaysRemaining: remainingDays,
      isSubscriptionActive: isActive,
      hasAccess: accessAllowed,
      isPaywallActive: isPaywallBlocked,
      canManageObra: obraAllowed,
      canAccessNegocio: negocioAllowed,
      canAccessEnvironment: envChecker,
      currentPlanTier: subscription.plan_tier,
    };
  }, [subscription]);

  // Checkout Dinâmico com suporte aos planos Lite e Business
  const startCheckout = async (
    priceId: string,
    interval: BillingInterval,
    tier: SubscriptionTier = 'lite'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const targetPlan = PLANS[tier] || (priceId.includes('1ULvH') ? PLANS.business : PLANS.lite);

      // Tentativa 1: Supabase Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            priceId,
            interval,
            couponId: interval === 'month' ? targetPlan.promoCouponId : undefined,
            userId: user.id,
            email: user.email,
            returnUrl: window.location.origin,
          },
        });

        if (!error && data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch (invokeErr) {
        console.warn('Edge Function indisponível, redirecionando via Stripe Payment Link nativo:', invokeErr);
      }

      // Tentativa 2: Stripe Payment Link nativo em modo Live
      const baseUrl = interval === 'year'
        ? targetPlan.yearlyPaymentLink
        : targetPlan.monthlyPaymentLink;

      if (baseUrl) {
        const checkoutUrl = new URL(baseUrl);
        checkoutUrl.searchParams.set('client_reference_id', user.id);
        if (user.email) {
          checkoutUrl.searchParams.set('prefilled_email', user.email);
        }
        if (interval === 'month' && targetPlan.promoCouponId) {
          checkoutUrl.searchParams.set('prefilled_promo_code', targetPlan.promoCouponId);
        }
        window.location.href = checkoutUrl.toString();
        return;
      }

      throw new Error('Nenhum link de pagamento disponível.');
    } catch (err) {
      console.error('Erro ao iniciar checkout Stripe:', err);
      alert('Não foi possível iniciar o checkout no momento. Tente novamente em instantes.');
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isTrialing,
        trialDaysRemaining,
        isSubscriptionActive,
        hasAccess,
        isPaywallActive,
        canManageObra,
        canAccessNegocio,
        canAccessEnvironment,
        currentPlanTier,
        refreshSubscription: fetchSubscription,
        startCheckout,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser utilizado dentro de um SubscriptionProvider');
  }
  return context;
};
