export type SubscriptionTier = 'pessoal' | 'obra' | 'negocio' | 'lite' | 'business';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type BillingInterval = 'month' | 'year';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_ends_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  title: string;
  included: boolean;
}

export interface PlanDetails {
  id: SubscriptionTier;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  promoDiscountPercent?: number;
  promoDiscountMonths?: number;
  promoMonthlyPrice?: number;
  promoCouponId?: string;
  monthlyPaymentLink?: string;
  yearlyPaymentLink?: string;
  features: PlanFeature[];
}
