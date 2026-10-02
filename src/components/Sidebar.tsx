import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Plus,
  ReceiptText,
  Settings,
  X,
  LogOut,
  ShieldCheck,
  Clock,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { BrandLogo } from './brand/BrandLogo';
import { EnvironmentSelector } from './workspace/EnvironmentSelector';
import { PricingCalculatorModal } from './business/PricingCalculatorModal';
import { useSubscription } from '../context/SubscriptionContext';
import type { TabType } from '../types/app';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  userEmail: string | null;
  userName?: string | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  onChangeTab,
  userEmail,
  userName,
  onLogout,
}) => {
  const { isTrialing, trialDaysRemaining } = useSubscription();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  // Fecha o drawer ao pressionar a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Evita scroll da página de fundo quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelectTab = (tab: TabType) => {
    onChangeTab(tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in" aria-modal="true" role="dialog">
      
      {/* Backdrop com Blur suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Painel Lateral Deslizante */}
      <aside className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-80 sm:w-84 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-right transition-colors duration-300">
          
          {/* 1. TOPO DA SIDEBAR: Logo & Botão Fechar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 group-hover:border-emerald-500/50 transition-colors">
                <BrandLogo size={32} compact={true} animated={false} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold tracking-tight leading-tight flex items-center space-x-1">
                  <span className="text-white">GSR</span>
                  <span className="text-emerald-400">Finanças</span>
                </h2>
                <p className="text-[10px] font-mono text-emerald-400/90 leading-none mt-0.5">
                  Gestão Financeira Facilitada
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              title="Fechar menu lateral"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. CORPO DA SIDEBAR: Ambiente Ativo & Menu de Navegação */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* Seletor Dinâmico de Ambientes & Projetos (Obra vs Pessoal) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1 font-bold block">
                Ambiente & Projeto Ativo
              </span>
              <EnvironmentSelector compact={false} fullWidth={true} />
            </div>

            {/* Links Principais de Navegação */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 block mb-2 font-bold">
                Navegação
              </span>

              <nav className="space-y-1">
                {/* 1. Dashboard */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('dashboard')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-slate-950' : 'text-emerald-400'}`} />
                    <span>Visão Geral (Dashboard)</span>
                  </div>
                  {currentTab === 'dashboard' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  )}
                </button>

                {/* 2. Novo Lançamento */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('novo')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentTab === 'novo'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Plus className={`w-4 h-4 ${currentTab === 'novo' ? 'text-slate-950' : 'text-emerald-400'}`} />
                    <span>Novo Lançamento</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    currentTab === 'novo' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/15 text-emerald-300'
                  }`}>
                    + Criar
                  </span>
                </button>

                {/* 3. Lançamentos / Histórico */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('historico')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentTab === 'historico'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ReceiptText className={`w-4 h-4 ${currentTab === 'historico' ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span>Extrato & Histórico</span>
                  </div>
                  {currentTab === 'historico' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  )}
                </button>

                {/* 4. Configurações & Ambientes */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('configuracoes')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentTab === 'configuracoes'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Settings className={`w-4 h-4 ${currentTab === 'configuracoes' ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>Ajustes & Configurações</span>
                  </div>
                  {currentTab === 'configuracoes' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  )}
                </button>

                {/* 5. Calculadora de Precificação (Ficha Técnica & Markup) */}
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(true)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800/70 group"
                  title="Abrir Calculadora de Precificação e Ficha Técnica de Produtos"
                >
                  <div className="flex items-center space-x-3">
                    <Calculator className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>Calculadora de Preço & CMV</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PME
                  </span>
                </button>
              </nav>
            </div>

            {/* Card Informativo do Plano / Período de Testes */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white">Plano Gestão Pro</span>
              </div>
              {isTrialing ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-amber-300 font-semibold flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>Fase de Testes: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Acesso a múltiplos ambientes e relatórios completos.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Assinatura Ativa & Ilimitada</span>
                </p>
              )}
            </div>

          </div>

          {/* 3. RODAPÉ DA SIDEBAR: Usuário & Logout */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-extrabold text-emerald-400 flex-shrink-0">
                {(userName || userEmail || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate" title={userName || userEmail || ''}>
                  {userName || (userEmail ? userEmail.split('@')[0] : 'Usuário')}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate" title={userEmail || ''}>
                  {userEmail || ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              title="Sair da conta"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* Modal da Calculadora de Precificação PME */}
      <PricingCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};
