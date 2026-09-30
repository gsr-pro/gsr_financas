import React from 'react';
import { LogOut, RefreshCw, LayoutDashboard, Plus, ReceiptText, Settings } from 'lucide-react';
import { BrandLogo } from './brand/BrandLogo';
import { ThemeSelector } from './ThemeSelector';
import { EnvironmentSelector } from './workspace/EnvironmentSelector';
import type { TabType } from '../types/app';

interface HeaderProps {
  userEmail: string | null;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onLogout,
  onRefresh,
  isRefreshing = false,
  currentTab,
  onChangeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Lado Esquerdo: Marca & Seletor de Ambientes */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <div
            onClick={() => onChangeTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
              <BrandLogo size={32} compact={true} animated={false} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight leading-tight flex items-center space-x-1">
                <span>Gestão</span>
                <span className="text-emerald-500 dark:text-emerald-400">Financeira</span>
              </h1>
              <p className="text-[10px] font-mono text-sky-500 dark:text-sky-400/90 leading-none">
                SaaS Multi-Ambiente
              </p>
            </div>
          </div>

          {/* Seletor Dinâmico de Ambientes (Obra vs Pessoal) */}
          <EnvironmentSelector compact={true} />
        </div>

        {/* Centro (Desktop): Navegação Persistente de Abas */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-950/50 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => onChangeTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              currentTab === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onChangeTab('novo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              currentTab === 'novo'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>

          <button
            onClick={() => onChangeTab('historico')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              currentTab === 'historico'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Lançamentos</span>
          </button>

          <button
            onClick={() => onChangeTab('configuracoes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              currentTab === 'configuracoes'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>
        </nav>

        {/* Lado Direito: Ações, Tema e Perfil */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Seletor de Tema */}
          <ThemeSelector />

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Atualizar dados"
              title="Atualizar dados"
              className="p-1.5 rounded-xl border border-transparent text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 theme-icon-btn cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {userEmail && (
            <div className="flex items-center pl-1 border-l border-slate-800 space-x-1.5 theme-user-section">
              <span
                className="text-[11px] max-w-[110px] truncate font-medium text-slate-300 hidden sm:inline-block"
                title={userEmail}
              >
                {userEmail.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                aria-label="Sair da conta"
                title="Sair"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all theme-icon-btn cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
