import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { PLANS } from '../../config/plans';
import type { BillingInterval } from '../../types/subscription.types';
import { Check, Zap, CreditCard, Lock, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface PaywallViewProps {
  reason?: 'trial_expired' | 'feature_locked';
  lockedFeatureName?: string;
  onClose?: () => void;
}

export const PaywallView: React.FC<PaywallViewProps> = ({
  reason = 'trial_expired',
  lockedFeatureName,
  onClose,
}) => {
  const { startCheckout } = useSubscription();
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const plan = PLANS.obra; // Plano Gestão Completa Pro

  const handleSelectPlan = async () => {
    const priceId = interval === 'year' ? plan.yearlyPriceId : plan.monthlyPriceId;
    setSubmitting(true);
    try {
      await startCheckout(priceId, interval);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-viewport)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      
      {/* Container Principal Centralizado */}
      <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in my-auto">
        
        {/* Cabeçalho do Paywall */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            reason === 'trial_expired'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
          }`}>
            <Lock className="w-3.5 h-3.5" />
            <span>
              {reason === 'trial_expired'
                ? 'Módulos Bloqueados • Teste Encerrado'
                : `Recurso Exclusivo: ${lockedFeatureName || 'Plano Pro'}`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {reason === 'trial_expired'
              ? 'Contrate para Desbloquear os Módulos'
              : 'Desbloqueie todo o poder da sua gestão'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {reason === 'trial_expired'
              ? 'Seu período de teste gratuito de 7 dias encerrou e o acesso aos módulos de Obras e Finanças Pessoais foi bloqueado. Seus dados e notas continuam 100% seguros. Realize a contratação para restaurar o acesso instantaneamente.'
              : 'Seus dados, notas e ambientes continuam 100% seguros. Assine o plano único completo com acesso ilimitado a Custo de Obras e Finanças Pessoais.'}
          </p>

          {/* Toggle Mensal / Anual */}
          <div className="pt-2 flex items-center justify-center">
            <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setInterval('month')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  interval === 'month'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensal (R$ 14,90)
              </button>

              <button
                type="button"
                onClick={() => setInterval('year')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  interval === 'year'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Anual (R$ 149,00)</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                  2 meses grátis
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Card do Plano Único Completo */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden ring-4 ring-emerald-500/10 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-extrabold text-white">
                  {plan.name}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center space-x-1 shadow-sm">
                  <Zap className="w-3 h-3 fill-slate-950" />
                  <span>{interval === 'month' ? '50% OFF - 2 Meses' : plan.badge}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {plan.description}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="flex items-baseline space-x-1 sm:justify-end">
                {interval === 'month' && (
                  <span className="text-xs text-slate-500 line-through mr-1 font-mono">
                    R$ 14,90
                  </span>
                )}
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  R$ {interval === 'year' ? '12,41' : '7,45'}
                </span>
                <span className="text-xs text-slate-400">/mês</span>
              </div>
              <span className="text-[11px] text-amber-300 font-mono block">
                {interval === 'year'
                  ? 'Cobrança anual de R$ 149,00 (2 meses grátis)'
                  : '50% OFF nos 2 primeiros meses (R$ 14,90 a partir do 3º)'}
              </span>
            </div>
          </div>

          {/* Grade de Recursos Inclusos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6">
            {plan.features.map((feat, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200 font-medium">{feat.title}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSelectPlan}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm font-black shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>
                {submitting
                  ? 'Iniciando checkout seguro...'
                  : interval === 'year'
                  ? 'Assinar Plano Anual (R$ 149/ano)'
                  : 'Garantir 50% OFF (R$ 7,45 nos 2 primeiros meses)'}
              </span>
            </button>
          </div>
        </div>

        {/* Rodapé de Confiança e Segurança */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Checkout Seguro Stripe (SSL 256-Bit)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>PIX & Cartão de Crédito</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {onClose && (
              <button onClick={onClose} className="hover:underline">
                Voltar
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-rose-400 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
