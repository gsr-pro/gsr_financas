import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { PLANS } from '../../config/plans';
import type { BillingInterval } from '../../types/subscription.types';
import { Check, Zap, CreditCard, Lock, LogOut, X, Sparkles, ShieldCheck } from 'lucide-react';
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
  const [submittingInterval, setSubmittingInterval] = useState<BillingInterval | null>(null);

  const plan = PLANS.obra; // Plano Gestão Completa Pro

  const handleCheckout = async (selectedInterval: BillingInterval) => {
    const priceId = selectedInterval === 'year' ? plan.yearlyPriceId : plan.monthlyPriceId;
    setSubmittingInterval(selectedInterval);
    try {
      await startCheckout(priceId, selectedInterval);
    } finally {
      setSubmittingInterval(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-viewport)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative">
      
      {/* Container Principal Centralizado */}
      <div className="max-w-4xl w-full mx-auto space-y-6 animate-fade-in my-auto relative">
        
        {/* Botão de Fechar Modal (se onClose for fornecido) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-2 right-0 sm:right-2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all z-20 cursor-pointer shadow-md"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Cabeçalho do Paywall */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
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
              ? 'Escolha seu Plano para Liberar os Módulos'
              : 'Desbloqueie todo o poder da sua gestão'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            {reason === 'trial_expired'
              ? 'Seu período de teste de 7 dias expirou. Todos os seus dados, notas e lançamentos continuam 100% preservados. Escolha entre o plano Mensal com 50% OFF ou o plano Anual com 2 meses grátis.'
              : 'Seus dados, notas e ambientes continuam 100% seguros. Assine o plano único completo com acesso ilimitado a Custo de Obras e Finanças Pessoais.'}
          </p>
        </div>

        {/* Grade de Planos: Mensal vs Anual Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Card 1: PLANO MENSAL COM 50% OFF */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-7 shadow-xl relative flex flex-col justify-between hover:border-emerald-400 transition-all">
            <div className="absolute -top-3 left-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center space-x-1">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              <span>50% OFF nos 2 primeiros meses</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 pt-1">
                <h3 className="text-xl font-black text-white">Plano Mensal</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Mais Flexível
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Assinatura mensal sem fidelidade. Cancele quando quiser.
              </p>

              {/* Preço Mensal */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">R$ 7,45</span>
                  <span className="text-xs text-slate-400">/mês</span>
                  <span className="text-xs text-slate-500 line-through">R$ 14,90</span>
                </div>
                <span className="text-[11px] text-emerald-300/90 font-mono block mt-1">
                  50% OFF nos meses 1 e 2 • R$ 14,90 a partir do mês 3
                </span>
              </div>

              {/* Recursos Inclusos */}
              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Acesso ilimitado a Custo de Obras</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Acesso ilimitado a Finanças Pessoais</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Múltiplos projetos e ambientes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Upload de recibos e notas fiscais</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={submittingInterval !== null}
              onClick={() => handleCheckout('month')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm font-black shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>
                {submittingInterval === 'month'
                  ? 'Iniciando checkout...'
                  : 'Assinar Mensal (R$ 7,45/mês)'}
              </span>
            </button>
          </div>

          {/* Card 2: PLANO ANUAL COM 2 MESES GRÁTIS */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-7 shadow-xl relative flex flex-col justify-between hover:border-amber-400 transition-all ring-2 ring-amber-500/10">
            <div className="absolute -top-3 left-6 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center space-x-1">
              <Zap className="w-3 h-3 fill-slate-950" />
              <span>Melhor Custo-Benefício • 2 Meses Grátis</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 pt-1">
                <h3 className="text-xl font-black text-white">Plano Anual</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Mais Popular
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Pagamento único anual para 12 meses completos de tranquilidade.
              </p>

              {/* Preço Anual */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400">R$ 149,00</span>
                  <span className="text-xs text-slate-400">/ano</span>
                </div>
                <span className="text-[11px] text-amber-300 font-mono block mt-1">
                  Equivalente a apenas R$ 12,41/mês (Economia de 2 meses)
                </span>
              </div>

              {/* Recursos Inclusos */}
              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Todos os recursos do plano Pro inclusos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Acesso garantido por 1 ano completo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Prioridade nos novos lançamentos do SaaS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Isolamento total de dados e segurança RLS</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={submittingInterval !== null}
              onClick={() => handleCheckout('year')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>
                {submittingInterval === 'year'
                  ? 'Iniciando checkout...'
                  : 'Assinar Anual (R$ 149,00/ano)'}
              </span>
            </button>
          </div>

        </div>

        {/* Rodapé de Confiança e Segurança */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Checkout Oficial Stripe (Criptografia SSL 256-Bit)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>Cartão de Crédito</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hover:underline text-slate-400 hover:text-white cursor-pointer"
              >
                Continuar no teste
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center space-x-1 text-rose-400 hover:underline cursor-pointer"
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
