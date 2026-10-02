import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { PLANS, PLAN_COMPARISON_FEATURES } from '../../config/plans';
import type { BillingInterval, SubscriptionTier } from '../../types/subscription.types';
import {
  Check,
  CreditCard,
  Lock,
  LogOut,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  Wallet,
  Briefcase,
  Layers,
  FileDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { exportCommercialPlansPDF } from '../../lib/exportCommercialPlansPDF';

interface PaywallViewProps {
  reason?: 'trial_expired' | 'feature_locked' | 'landing_page';
  lockedFeatureName?: string;
  onClose?: () => void;
  onSelectPlan?: (interval: BillingInterval, tier: SubscriptionTier) => void;
  isInline?: boolean;
}

export const PaywallView: React.FC<PaywallViewProps> = ({
  reason = 'trial_expired',
  lockedFeatureName,
  onClose,
  onSelectPlan,
  isInline = false,
}) => {
  const { startCheckout } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('year');
  const [submittingTier, setSubmittingTier] = useState<SubscriptionTier | null>(null);
  const [mobileActivePlan, setMobileActivePlan] = useState<'all' | 'lite' | 'business'>('all');

  const litePlan = PLANS.lite;
  const businessPlan = PLANS.business;

  // Extrai categorias únicas de recursos comparativos
  const comparisonCategories = Array.from(
    new Set(PLAN_COMPARISON_FEATURES.map((f) => f.category))
  );

  const handleCheckout = async (tier: 'lite' | 'business') => {
    if (onSelectPlan) {
      onSelectPlan(billingInterval, tier);
      return;
    }

    const plan = tier === 'business' ? businessPlan : litePlan;
    const priceId = billingInterval === 'year' ? plan.yearlyPriceId : plan.monthlyPriceId;

    setSubmittingTier(tier);
    try {
      await startCheckout(priceId, billingInterval, tier);
    } finally {
      setSubmittingTier(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div
      className={
        isInline
          ? 'w-full text-[var(--text-primary)] transition-colors duration-300 relative py-2'
          : 'min-h-screen bg-[var(--bg-viewport)] text-[var(--text-primary)] flex flex-col items-center justify-center p-3 sm:p-6 transition-colors duration-300 relative'
      }
    >
      {/* Container Principal */}
      <div className={`max-w-5xl w-full mx-auto space-y-5 sm:space-y-6 animate-fade-in relative ${isInline ? '' : 'my-auto'}`}>
        
        {/* Botão de Fechar Modal */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 sm:-top-2 sm:right-2 p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all z-20 cursor-pointer shadow-md"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Cabeçalho do Paywall */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto px-2">
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              reason === 'trial_expired'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : reason === 'feature_locked'
                ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {reason === 'trial_expired' ? (
              <Lock className="w-3.5 h-3.5" />
            ) : reason === 'feature_locked' ? (
              <Briefcase className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="truncate max-w-[280px] sm:max-w-none">
              {reason === 'trial_expired'
                ? 'Período de Testes Encerrado'
                : reason === 'feature_locked'
                ? `Exclusivo do Plano Business: ${lockedFeatureName || 'Negócios & PME'}`
                : 'Planos Transparentes • 7 Dias Grátis'}
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            {reason === 'trial_expired'
              ? 'Escolha seu Plano para Continuar'
              : reason === 'feature_locked'
              ? 'Desbloqueie o Módulo de Negócios & PME'
              : 'Gestão Inteligente ao Alcance do seu Negócio'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            {reason === 'trial_expired'
              ? 'Seus 7 dias gratuitos encerraram. Escolha o plano Lite (2 ambientes) ou Business (3 ambientes com precificação) para manter seus dados ativos.'
              : reason === 'feature_locked'
              ? 'O ambiente de Negócios & PME com Ficha Técnica e Markup faz parte do Plano Business (3 Ambientes). Faça o upgrade e acesse imediatamente.'
              : 'Comece com 7 dias grátis sem compromisso. Cancele a qualquer momento com total segurança.'}
          </p>

          {/* Seletor de Faturamento: Mensal vs Anual (100% Responsivo no Celular) */}
          <div className="pt-2 flex items-center justify-center w-full">
            <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 w-full max-w-xs sm:max-w-sm shadow-inner">
              <button
                type="button"
                onClick={() => setBillingInterval('month')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  billingInterval === 'month'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('year')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-center ${
                  billingInterval === 'year'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Anual</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-300">
                  2 Meses OFF
                </span>
              </button>
            </div>
          </div>

          {/* Botão Executivo: Download do Material Oficial dos Planos (PDF) */}
          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => exportCommercialPlansPDF()}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Baixar material comercial oficial dos planos e recursos em formato PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar Material dos Planos (PDF)</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SELETOR DE ABAS MOBILE PARA NAVEGAÇÃO DOS PLANOS (Visível apenas < md) */}
        {/* =================================================================== */}
        <div className="flex md:hidden items-center justify-center px-1">
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-1 text-xs font-bold w-full max-w-sm shadow-sm">
            <button
              type="button"
              onClick={() => setMobileActivePlan('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                mobileActivePlan === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ver Ambos
            </button>
            <button
              type="button"
              onClick={() => setMobileActivePlan('lite')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                mobileActivePlan === 'lite'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lite (2 Amb.)
            </button>
            <button
              type="button"
              onClick={() => setMobileActivePlan('business')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                mobileActivePlan === 'business'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-white'
              }`}
            >
              Business ★
            </button>
          </div>
        </div>

        {/* Cards dos Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          
          {/* CARD 1: PLANO LITE (2 Ambientes: Obra + Pessoal) */}
          <div
            className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative flex flex-col justify-between hover:border-slate-700 transition-all ${
              mobileActivePlan === 'business' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">Plano Lite</h3>
                  <span className="text-xs text-slate-400">Obras & Finanças Pessoais</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  2 Ambientes
                </span>
              </div>

              {/* Badges de Ambientes Inclusos */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Building2 className="w-3 h-3" />
                  <span>Obra</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Wallet className="w-3 h-3" />
                  <span>Pessoal</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-500 border border-slate-700 line-through">
                  <Briefcase className="w-3 h-3" />
                  <span>Negócio</span>
                </span>
              </div>

              {/* Preço */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-4 sm:mb-5">
                {billingInterval === 'month' ? (
                  <>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black text-white">R$ 7,45</span>
                      <span className="text-xs text-slate-400">/mês</span>
                      <span className="text-xs text-slate-500 line-through">R$ 14,90</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono block mt-1">
                      50% OFF nos 2 primeiros meses
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black text-white">R$ 149,00</span>
                      <span className="text-xs text-slate-400">/ano</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono block mt-1">
                      Apenas R$ 12,41/mês • Economize 2 meses
                    </span>
                  </>
                )}
              </div>

              {/* Resumo de Recursos */}
              <div className="space-y-2 mb-5 sm:mb-6 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Gestão completa de Obras, Lotes e Reformas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Finanças Pessoais, Receitas e Investimentos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Filtro por Período e Relatórios em PDF/Excel</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <X className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span>Sem acesso ao módulo de Negócios e PME</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={submittingTier !== null}
              onClick={() => handleCheckout('lite')}
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold border border-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>
                {submittingTier === 'lite'
                  ? 'Iniciando checkout...'
                  : onSelectPlan
                  ? 'Selecionar Plano Lite'
                  : billingInterval === 'month'
                  ? 'Assinar Lite (R$ 7,45/mês)'
                  : 'Assinar Lite Anual (R$ 149/ano)'}
              </span>
            </button>
          </div>

          {/* CARD 2: PLANO BUSINESS (3 Ambientes: Obra + Pessoal + Negócios) */}
          <div
            className={`bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border-2 border-indigo-500/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col justify-between hover:border-indigo-400 transition-all ring-2 ring-indigo-500/20 mt-3 sm:mt-0 ${
              mobileActivePlan === 'lite' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="absolute -top-3 left-4 sm:left-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center space-x-1">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>Recomendado para PME • 3 Ambientes</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 pt-1">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">Plano Business PME</h3>
                  <span className="text-xs text-indigo-300">Empresas, Obras & Finanças</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  3 Ambientes
                </span>
              </div>

              {/* Badges dos 3 Ambientes Inclusos */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Building2 className="w-3 h-3" />
                  <span>Obra</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Wallet className="w-3 h-3" />
                  <span>Pessoal</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  <Briefcase className="w-3 h-3" />
                  <span>Negócio (PME)</span>
                </span>
              </div>

              {/* Preço */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/30 mb-4 sm:mb-5">
                {billingInterval === 'month' ? (
                  <>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-300">R$ 14,95</span>
                      <span className="text-xs text-slate-400">/mês</span>
                      <span className="text-xs text-slate-500 line-through">R$ 29,90</span>
                    </div>
                    <span className="text-[11px] text-indigo-400 font-mono block mt-1">
                      50% OFF nos 2 primeiros meses
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-300">R$ 299,00</span>
                      <span className="text-xs text-slate-400">/ano</span>
                    </div>
                    <span className="text-[11px] text-indigo-400 font-mono block mt-1">
                      Apenas R$ 24,91/mês • 2 meses grátis
                    </span>
                  </>
                )}
              </div>

              {/* Resumo de Recursos */}
              <div className="space-y-2 mb-5 sm:mb-6 text-xs text-slate-200">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Tudo do Plano Lite incluso</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Módulo de Negócios & Pequenas Empresas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Ficha Técnica com Insumos e Custos de Produção</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Calculadora de Precificação & Markup Divisor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Simulação de Ponto de Equilíbrio & Margem Líquida</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={submittingTier !== null}
              onClick={() => handleCheckout('business')}
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>
                {submittingTier === 'business'
                  ? 'Iniciando checkout...'
                  : onSelectPlan
                  ? 'Selecionar Plano Business'
                  : billingInterval === 'month'
                  ? 'Assinar Business (R$ 14,95/mês)'
                  : 'Assinar Business Anual (R$ 299/ano)'}
              </span>
            </button>
          </div>

        </div>

        {/* ================================================================= */}
        {/* SEÇÃO COMPARATIVA: DESKTOP TABELA + MOBILE CARDS (Sem corte!)     */}
        {/* ================================================================= */}
        <div className="pt-6 border-t border-slate-800">
          <div className="text-center mb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center justify-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Comparativo Detalhado de Recursos</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Veja o que está incluso em cada plano.
            </p>
            <div className="mt-2.5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => exportCommercialPlansPDF()}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Baixar material comercial em PDF com a tabela comparativa completa"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Baixar Comparativo em PDF</span>
              </button>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 1. VISUALIZAÇÃO MOBILE FIRST: CARDS CATEGORIZADOS (md:hidden)     */}
          {/* =============================================================== */}
          <div className="block md:hidden space-y-3.5">
            {comparisonCategories.map((cat) => {
              const featuresOfCategory = PLAN_COMPARISON_FEATURES.filter((f) => f.category === cat);
              if (featuresOfCategory.length === 0) return null;

              return (
                <div
                  key={cat}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                >
                  {/* Cabeçalho da Categoria */}
                  <div className="bg-slate-950/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                      {cat}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {featuresOfCategory.length} {featuresOfCategory.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  {/* Lista de Recursos da Categoria */}
                  <div className="p-3 space-y-3 divide-y divide-slate-800/60">
                    {featuresOfCategory.map((feat, idx) => (
                      <div key={idx} className={idx > 0 ? 'pt-2.5' : ''}>
                        <p className="text-xs font-bold text-white mb-2 leading-snug">
                          {feat.name}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {/* Coluna Lite */}
                          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Lite:</span>
                            {typeof feat.lite === 'string' ? (
                              <span className="font-bold text-slate-200 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-right">
                                {feat.lite}
                              </span>
                            ) : feat.lite ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                                <Check className="w-3.5 h-3.5" />
                                <span>Sim</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-slate-500">
                                <X className="w-3.5 h-3.5 text-slate-600" />
                                <span>Não</span>
                              </span>
                            )}
                          </div>

                          {/* Coluna Business */}
                          <div className="bg-indigo-950/20 p-2 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                            <span className="text-indigo-300 font-semibold">Business:</span>
                            {typeof feat.business === 'string' ? (
                              <span className="font-bold text-indigo-300 text-[10px] bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded text-right">
                                {feat.business}
                              </span>
                            ) : feat.business ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                                <Check className="w-3.5 h-3.5" />
                                <span>Sim</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-slate-500">
                                <X className="w-3.5 h-3.5 text-slate-600" />
                                <span>Não</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* =============================================================== */}
          {/* 2. VISUALIZAÇÃO DESKTOP: TABELA LADO A LADO (hidden md:block)    */}
          {/* =============================================================== */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-3 px-4 font-semibold">Funcionalidade / Recurso</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-300 w-44">
                    Plano Lite
                    <span className="block text-[9px] text-slate-500 font-normal lowercase">2 ambientes</span>
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-indigo-300 w-48 bg-indigo-500/5">
                    Plano Business
                    <span className="block text-[9px] text-indigo-400 font-normal lowercase">3 ambientes</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {PLAN_COMPARISON_FEATURES.map((feat, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{feat.name}</span>
                        <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">
                          {feat.category}
                        </span>
                      </div>
                    </td>

                    {/* Coluna Lite */}
                    <td className="py-3 px-4 text-center">
                      {typeof feat.lite === 'string' ? (
                        <span className="font-semibold text-slate-300 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded">
                          {feat.lite}
                        </span>
                      ) : feat.lite ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-800/50 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>

                    {/* Coluna Business */}
                    <td className="py-3 px-4 text-center bg-indigo-500/5">
                      {typeof feat.business === 'string' ? (
                        <span className="font-bold text-indigo-300 text-[11px] bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">
                          {feat.business}
                        </span>
                      ) : feat.business ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-800/50 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rodapé de Confiança e Segurança */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-4">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Checkout Oficial Stripe (Criptografia SSL 256-Bit)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span>Cartão de Crédito sem fidelidade</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 pt-1 sm:pt-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hover:underline text-slate-400 hover:text-white cursor-pointer"
              >
                {reason === 'trial_expired' ? 'Fechar' : 'Voltar'}
              </button>
            )}
            {reason !== 'landing_page' && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1 text-rose-400 hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da conta</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
