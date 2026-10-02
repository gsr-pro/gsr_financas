import React from 'react';
import { Menu, LogOut, RefreshCw, Plus, LayoutDashboard, ReceiptText, Settings } from 'lucide-react';
import { BrandLogo } from './brand/BrandLogo';
import { ThemeSelector } from './ThemeSelector';
import type { TabType } from '../types/app';

interface HeaderProps {
  userEmail: string | null;
  userName?: string | null;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  userName,
  onLogout,
  onRefresh,
  isRefreshing = false,
  currentTab,
  onChangeTab,
  onOpenSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md transition-colors duration-300 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 w-full">
        
        {/* Lado Esquerdo: Botão Menu Lateral e Identidade da Marca */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
          
          {/* Botão de Abrir o Menu Lateral (Drawer) - Oculto no Mobile pois já fica no BottomNav */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="hidden md:flex items-center space-x-2 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all active:scale-95 cursor-pointer shadow-sm group flex-shrink-0"
            title="Abrir menu lateral de navegação"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <span className="text-xs font-bold hidden md:inline">Menu</span>
          </button>

          {/* Logo do App & Nome */}
          <div
            onClick={() => onChangeTab('dashboard')}
            className="flex items-center space-x-2 cursor-pointer flex-shrink-0 group"
            title="Ir para o Dashboard"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 group-hover:border-emerald-500/40 transition-colors">
              <BrandLogo size={24} compact={true} animated={false} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight leading-tight flex items-center space-x-1">
                <span className="text-white">GSR</span>
                <span className="text-emerald-400">Finanças</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Centro (Telas Ultra-Largas 2XL): Atalhos de Abas sem espremer */}
        <nav className="hidden 2xl:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800 flex-shrink-0">
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

        {/* Lado Direito: Atalho "+ Novo Lançamento", Tema, Atualizar e Perfil */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          
          {/* Botão de Atalho Rápido para Novo Lançamento */}
          <button
            type="button"
            onClick={() => onChangeTab('novo')}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
              currentTab === 'novo'
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
            title="Criar novo lançamento"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo</span>
          </button>

          {/* Seletor de Tema */}
          <ThemeSelector />

          {/* Botão de Atualizar Dados */}
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

          {/* Usuário e Logout */}
          {userEmail && (
            <div className="flex items-center pl-1 border-l border-slate-800 space-x-1 sm:space-x-1.5 theme-user-section">
              <span
                className="text-[11px] max-w-[110px] lg:max-w-[160px] truncate font-medium text-slate-300 hidden md:inline-block"
                title={userName ? `${userName} (${userEmail})` : userEmail}
              >
                {userName || userEmail.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                aria-label="Sair da conta"
                title="Sair da conta"
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
