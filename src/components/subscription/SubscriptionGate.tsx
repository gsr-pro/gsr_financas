import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { PaywallView } from './PaywallView';
import { Loader2, Clock, ArrowRight, X } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { isLoading, isPaywallActive, isTrialing, trialDaysRemaining } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('trial_banner_dismissed') === 'true';
  });

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('trial_banner_dismissed', 'true');
  };

  // 1. Estado de Carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-viewport)] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-semibold font-mono tracking-wider opacity-60">
          Validando permissões e período de testes...
        </p>
      </div>
    );
  }

  // 2. Bloqueio Completo dos Módulos (Paywall Ativo por Vencimento do Teste sem Contratação)
  if (isPaywallActive) {
    return <PaywallView reason="trial_expired" />;
  }

  // 3. Acesso Liberado (Durante a Fase de Testes com todos os módulos ou Assinatura Ativa)
  return (
    <>
      {isTrialing && !isBannerDismissed && (
        <aside
          aria-label="Aviso de período de testes e prazo de contratação"
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 px-3 py-1.5 sm:py-2 text-center text-xs font-bold flex items-center justify-between gap-2 sticky top-0 z-50 shadow-md border-b border-amber-600/30 animate-fade-in w-full max-w-full box-border"
        >
          <div className="flex-1 min-w-0 flex items-center justify-start sm:justify-center space-x-1.5 text-left sm:text-center text-[11px] sm:text-xs">
            <Clock className="w-3.5 h-3.5 fill-slate-950/20 text-slate-950 flex-shrink-0" />
            <span className="truncate">
              Fase de Testes: <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}</strong>
              <span className="hidden sm:inline"> para contratação</span>
            </span>
            <span className="hidden md:inline text-slate-900/80 font-medium">
              (Após o prazo, o acesso aos módulos será bloqueado).
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="bg-slate-950 hover:bg-slate-900 text-white px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold flex items-center space-x-1 transition-transform active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="sm:hidden">Planos</span>
              <span className="hidden sm:inline">Ver Planos (Mensal / Anual)</span>
              <ArrowRight className="w-3 h-3 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1 rounded-full text-slate-950/70 hover:text-slate-950 hover:bg-amber-600/20 transition-all cursor-pointer flex-shrink-0"
              title="Fechar aviso durante a navegação"
              aria-label="Fechar aviso de teste"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <PaywallView
            reason="feature_locked"
            lockedFeatureName="Gestão Completa Pro"
            onClose={() => setShowUpgradeModal(false)}
          />
        </div>
      )}

      {children}
    </>
  );
};
