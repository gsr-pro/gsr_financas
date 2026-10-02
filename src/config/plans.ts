import type { PlanDetails, SubscriptionTier } from '../types/subscription.types';

export interface PlanComparisonFeature {
  name: string;
  category: 'Ambientes' | 'Obras & Construção' | 'Finanças Pessoais' | 'Negócios & PME' | 'Auditoria & Geral';
  lite: boolean | string;
  business: boolean | string;
}

export const PLAN_COMPARISON_FEATURES: PlanComparisonFeature[] = [
  {
    name: 'Total de Ambientes Nativos',
    category: 'Ambientes',
    lite: '2 Ambientes (Obra + Pessoal)',
    business: '3 Ambientes (Obra + Pessoal + Negócio)',
  },
  {
    name: 'Gestão de Obras, Terrenos e Reformas',
    category: 'Obras & Construção',
    lite: true,
    business: true,
  },
  {
    name: 'Custo por m² e Acompanhamento de Custos',
    category: 'Obras & Construção',
    lite: true,
    business: true,
  },
  {
    name: 'Finanças Pessoais, Receitas e Extrato',
    category: 'Finanças Pessoais',
    lite: true,
    business: true,
  },
  {
    name: 'Investimentos & Reserva de Emergência',
    category: 'Finanças Pessoais',
    lite: true,
    business: true,
  },
  {
    name: 'Upload de Comprovantes & Notas no Storage',
    category: 'Auditoria & Geral',
    lite: true,
    business: true,
  },
  {
    name: 'Filtro por Período e Relatórios PDF/Excel',
    category: 'Auditoria & Geral',
    lite: true,
    business: true,
  },
  {
    name: 'Ambiente Exclusivo de Negócios & PME',
    category: 'Negócios & PME',
    lite: false,
    business: true,
  },
  {
    name: 'Ficha Técnica com Insumos e Matéria-Prima',
    category: 'Negócios & PME',
    lite: false,
    business: true,
  },
  {
    name: 'Calculadora de Precificação & Markup Divisor',
    category: 'Negócios & PME',
    lite: false,
    business: true,
  },
  {
    name: 'Cálculo de CMV e Ponto de Equilíbrio (Break-Even)',
    category: 'Negócios & PME',
    lite: false,
    business: true,
  },
  {
    name: 'Margem Líquida Operacional da Empresa',
    category: 'Negócios & PME',
    lite: false,
    business: true,
  },
];

const LITE_PLAN: PlanDetails = {
  id: 'lite',
  name: 'Plano Lite (Obras & Pessoal)',
  badge: 'Mais Popular',
  description: 'Controle completo para construção civil, reformas residenciais e finanças pessoais (2 ambientes inclusos).',
  monthlyPrice: 14.90,
  yearlyPrice: 149.00,
  monthlyPriceId: 'price_1ULUVf5lB4YKiaC4GTHllWl9',
  yearlyPriceId: 'price_1ULUVn5lB4YKiaC4PYsS9S26',
  promoDiscountPercent: 50,
  promoDiscountMonths: 2,
  promoMonthlyPrice: 7.45,
  promoCouponId: 'PROMO50_2M',
  monthlyPaymentLink: 'https://buy.stripe.com/aFafZacpO4rN9fM6ZvbII00',
  yearlyPaymentLink: 'https://buy.stripe.com/4gMaEQdtS2jFgIe2JfbII01',
  features: [
    { title: '2 Ambientes Nativos: Custo de Obra + Finanças Pessoais', included: true },
    { title: 'Criação de múltiplos projetos e obras ilimitadas', included: true },
    { title: 'Upload de Comprovantes e Notas no Storage', included: true },
    { title: 'Filtro por Período e Exportação de Relatórios PDF & Excel', included: true },
    { title: 'Painel de Investimentos e Controle de Despesas Fixas', included: true },
    { title: 'Ambiente de Negócios & PME', included: false },
    { title: 'Ficha Técnica de Produtos e Custos de Produção', included: false },
    { title: 'Calculadora de Precificação Inteligente & Markup', included: false },
  ],
};

const BUSINESS_PLAN: PlanDetails = {
  id: 'business',
  name: 'Plano Business PME (3 Ambientes)',
  badge: 'Mais Completo',
  description: 'Acesso total aos 3 ecossistemas: Obras, Pessoal e Negócios com Precificação e Ficha Técnica.',
  monthlyPrice: 29.90,
  yearlyPrice: 299.00,
  monthlyPriceId: 'price_1ULvHq5lB4YKiaC4R7cJOLOB',
  yearlyPriceId: 'price_1ULvHx5lB4YKiaC4Dt9T2bfE',
  promoDiscountPercent: 50,
  promoDiscountMonths: 2,
  promoMonthlyPrice: 14.95,
  promoCouponId: 'PROMO50_2M',
  monthlyPaymentLink: 'https://buy.stripe.com/5kQ14gblKe2ncrY3NjbII02',
  yearlyPaymentLink: 'https://buy.stripe.com/8x2fZaexW9M777EerXbII03',
  features: [
    { title: '3 Ambientes Nativos: Obras + Pessoal + Negócios/PME', included: true },
    { title: 'Tudo do Plano Lite incluso com acesso total', included: true },
    { title: 'Módulo Exclusivo para Pequenas Empresas e Prestadores', included: true },
    { title: 'Ficha Técnica com Insumos, Embalagens e Matéria-Prima', included: true },
    { title: 'Calculadora de Precificação com Markup Divisor Automático', included: true },
    { title: 'Simulação de Ponto de Equilíbrio (Break-Even) e CMV', included: true },
    { title: 'Margem Líquida Operacional em Tempo Real', included: true },
    { title: 'Relatórios de Auditoria Gerenciais em PDF e Excel', included: true },
  ],
};

export const PLANS: Record<SubscriptionTier, PlanDetails> = {
  lite: LITE_PLAN,
  business: BUSINESS_PLAN,
  // Aliases para retrocompatibilidade
  obra: LITE_PLAN,
  pessoal: LITE_PLAN,
  negocio: BUSINESS_PLAN,
};
