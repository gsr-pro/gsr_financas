import type { PlanDetails, SubscriptionTier } from '../types/subscription.types';

export interface PlanComparisonFeature {
  name: string;
  category: 'Ambientes' | 'Finanças Pessoais' | 'Obras & Construção' | 'Negócios & PME' | 'Fiscal & Contabilidade' | 'Auditoria & Gestão';
  lite: boolean | string;
  business: boolean | string;
  contador: boolean | string;
}

export const PLAN_COMPARISON_FEATURES: PlanComparisonFeature[] = [
  // 1. Ambientes Nativos
  {
    name: 'Ambientes Nativos Inclusos',
    category: 'Ambientes',
    lite: '2 Ambientes (Obra + Pessoal)',
    business: '3 Ambientes (Obra + Pessoal + Negócio)',
    contador: 'Acesso Total (Multi-Ambiente + Hub Fiscal)',
  },
  {
    name: 'Multi-Projetos e Múltiplas Obras',
    category: 'Ambientes',
    lite: false,
    business: true,
    contador: true,
  },

  // 2. Finanças Pessoais
  {
    name: 'Controle de Receitas, Salários e Despesas Fixas',
    category: 'Finanças Pessoais',
    lite: true,
    business: true,
    contador: true,
  },
  {
    name: 'Extrato Financeiro e Categorização Dinâmica',
    category: 'Finanças Pessoais',
    lite: true,
    business: true,
    contador: true,
  },
  {
    name: 'Painel de Investimentos e Reserva de Emergência',
    category: 'Finanças Pessoais',
    lite: true,
    business: true,
    contador: true,
  },
  {
    name: 'Upload de Comprovantes e Notas no Storage',
    category: 'Finanças Pessoais',
    lite: true,
    business: true,
    contador: true,
  },

  // 3. Obras & Construção
  {
    name: 'Gestão de Obras, Terrenos, Lotes e Reformas',
    category: 'Obras & Construção',
    lite: true,
    business: true,
    contador: true,
  },
  {
    name: 'Custo por m² Construído e Evolução Financeira',
    category: 'Obras & Construção',
    lite: true,
    business: true,
    contador: true,
  },
  {
    name: 'Controle de Mão de Obra e Materiais da Construção',
    category: 'Obras & Construção',
    lite: true,
    business: true,
    contador: true,
  },

  // 4. Negócios & PME
  {
    name: 'Módulo Exclusivo para Empresas e Prestadores PME',
    category: 'Negócios & PME',
    lite: false,
    business: true,
    contador: true,
  },
  {
    name: 'Ficha Técnica com Insumos, Embalagens e Matéria-Prima',
    category: 'Negócios & PME',
    lite: false,
    business: true,
    contador: true,
  },
  {
    name: 'Calculadora de Precificação Inteligente & Markup Divisor',
    category: 'Negócios & PME',
    lite: false,
    business: true,
    contador: true,
  },
  {
    name: 'Cálculo de CMV e Ponto de Equilíbrio (Break-Even)',
    category: 'Negócios & PME',
    lite: false,
    business: true,
    contador: true,
  },
  {
    name: 'Controle de Estoque e Alerta de Nível Mínimo',
    category: 'Negócios & PME',
    lite: false,
    business: true,
    contador: true,
  },

  // 5. Fiscal & Contabilidade
  {
    name: 'Exportação para o Carnê-Leão Web (Rendimentos e-CAC)',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Exportação para o Carnê-Leão Web (Pagamentos / Livro Caixa)',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Layouts Oficiais RFB (Sem ponto de milhar, Módulo 11)',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Malha Fina Preventiva (Dígitos de CPF/CNPJ e Deduções)',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Relatório de Livro Caixa Digital com Memória do DARF (0190)',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Workspace Multi-Cliente do Contador & Outorgas Digitais',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Download em Lote de Comprovantes em ZIP com Manifesto',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
  {
    name: 'Modelos para Saúde (CRM/CRO), Obras e Motoristas de App',
    category: 'Fiscal & Contabilidade',
    lite: false,
    business: false,
    contador: true,
  },
];

// ==============================================================================
// 1. PLANO CONTROLE PESSOAL (R$ 7,45) — Antigo Lite
// Persona: Indivíduos e famílias organizando finanças pessoais
// ==============================================================================
const PLANO_CONTROLE_PESSOAL: PlanDetails = {
  id: 'lite',
  name: 'Plano Controle Pessoal',
  badge: 'Obras & Pessoal',
  description: 'Controle financeiro pessoal completo, despesas fixas, investimentos e custos de obras/reformas.',
  monthlyPrice: 7.45,
  yearlyPrice: 74.50,
  monthlyPriceId: 'price_1ULUVf5lB4YKiaC4GTHllWl9',
  yearlyPriceId: 'price_1ULUVn5lB4YKiaC4PYsS9S26',
  promoCouponId: 'PROMO50',
  monthlyPaymentLink: 'https://buy.stripe.com/aFafZacpO4rN9fM6ZvbII00',
  yearlyPaymentLink: 'https://buy.stripe.com/4gMaEQdtS2jFgIe2JfbII01',
  features: [
    { title: '2 Ambientes Nativos: Obras/Construção + Finanças Pessoais', included: true },
    { title: 'Gestão completa de Obras, Terrenos, Lotes e Reformas', included: true },
    { title: 'Controle de Mão de Obra, Materiais e Custo por m²', included: true },
    { title: 'Controle de Despesas Fixas, Parcelamentos e Faturas', included: true },
    { title: 'Painel de Investimentos & Reserva de Emergência', included: true },
    { title: 'Upload de Comprovantes e Recibos no Storage Seguro', included: true },
    { title: 'Extrato Financeiro com Filtro por Período e Relatórios', included: true },
    { title: 'Múltiplas Obras Simultâneas e Multi-Projetos', included: false },
    { title: 'Ambiente de Negócios, Precificação e Ficha Técnica PME', included: false },
    { title: 'Exportação para o Carnê-Leão Web & Livro Caixa', included: false },
    { title: 'Workspace e Acesso Exclusivo do Contador', included: false },
  ],
};

// ==============================================================================
// 2. PLANO GESTÃO DE OBRAS & NEGÓCIOS (R$ 14,95) — Antigo Business PME
// Persona: Quem constrói, reforma ou administra pequenas empresas e serviços
// ==============================================================================
const PLANO_OBRAS_NEGOCIOS: PlanDetails = {
  id: 'business',
  name: 'Plano Gestão de Obras & Negócios',
  badge: 'Mais Popular',
  description: 'Gestão de custos de obras, reformas, produtos PME, estoque, CMV e precificação.',
  monthlyPrice: 14.95,
  yearlyPrice: 149.50,
  monthlyPriceId: 'price_1ULvHq5lB4YKiaC4R7cJOLOB',
  yearlyPriceId: 'price_1ULvHx5lB4YKiaC4Dt9T2bfE',
  promoCouponId: 'PROMO50',
  monthlyPaymentLink: 'https://buy.stripe.com/5kQ14gblKe2ncrY3NjbII02',
  yearlyPaymentLink: 'https://buy.stripe.com/8x2fZaexW9M777EerXbII03',
  features: [
    { title: '3 Ambientes Nativos: Obras + Pessoal + Negócios/PME', included: true },
    { title: 'Tudo do Plano Controle Pessoal incluso', included: true },
    { title: 'Gestão de Obras, Terrenos, Reformas e Custo por m²', included: true },
    { title: 'Ficha Técnica de Produtos com Insumos e Matéria-Prima', included: true },
    { title: 'Calculadora de Precificação Inteligente & Markup Divisor', included: true },
    { title: 'Simulação de Ponto de Equilíbrio (Break-Even) e CMV', included: true },
    { title: 'Controle de Estoque de Mercadorias e Alerta de Nível Mínimo', included: true },
    { title: 'Margem Líquida Operacional em Tempo Real', included: true },
    { title: 'Exportação para o Carnê-Leão Web (e-CAC)', included: false },
    { title: 'Relatório de Livro Caixa Digital com Memória de DARF', included: false },
    { title: 'Workspace Multi-Cliente do Contador', included: false },
  ],
};

// ==============================================================================
// 3. PLANO CONTADOR + CARNÊ-LEÃO (R$ 49,90) — O Novo Plano
// Persona: Autônomos de alta demanda tributária e Escritórios de Contabilidade
// ==============================================================================
const PLANO_CONTADOR_CARNE_LEAO: PlanDetails = {
  id: 'contador',
  name: 'Plano Contador + Carnê-Leão',
  badge: 'Fiscal & Compliance',
  description: 'A solução fiscal definitiva para autônomos e contadores: Carnê-Leão Web, Livro Caixa e Workspace Multi-Cliente.',
  monthlyPrice: 49.90,
  yearlyPrice: 499.00,
  monthlyPriceId: 'price_1UOnnj5lB4YKiaC4PSZjP9jz',
  yearlyPriceId: 'price_1UOnnv5lB4YKiaC4AnU8GvoU',
  monthlyPaymentLink: 'https://buy.stripe.com/eVq4gs3TicYj3VserXbII04',
  yearlyPaymentLink: 'https://buy.stripe.com/5kQ6oA61q0bxcrY0B7bII05',
  features: [
    { title: 'Tudo dos Planos Controle Pessoal e Gestão de Obras & Negócios', included: true },
    { title: 'Exportação Oficial para o Carnê-Leão Web (Rendimentos e-CAC)', included: true },
    { title: 'Exportação Oficial para o Carnê-Leão Web (Pagamentos / Livro Caixa)', included: true },
    { title: 'Estrutura Homologada pela RFB (Sem ponto de milhar, Módulo 11)', included: true },
    { title: 'Malha Fina Preventiva com Auditoria de Inconsistências', included: true },
    { title: 'Livro Caixa Digital A4 com Memória de Cálculo do DARF (0190)', included: true },
    { title: 'Workspace do Contador: Gestão Multi-Cliente com Outorga Digital', included: true },
    { title: 'Download em Lote de Comprovantes em ZIP com Manifesto Probatório', included: true },
    { title: 'Modelos para Saúde (CRM/CRO), Obras e Motoristas de App', included: true },
    { title: 'Suporte Prioritário para Fechamento Fiscal Mensal', included: true },
  ],
};

export const PLANS: Record<SubscriptionTier, PlanDetails> = {
  lite: PLANO_CONTROLE_PESSOAL,
  pessoal: PLANO_CONTROLE_PESSOAL,
  business: PLANO_OBRAS_NEGOCIOS,
  obra: PLANO_OBRAS_NEGOCIOS,
  negocio: PLANO_OBRAS_NEGOCIOS,
  contador: PLANO_CONTADOR_CARNE_LEAO,
};
