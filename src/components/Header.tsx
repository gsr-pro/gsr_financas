import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { BrandLogo } from './brand/BrandLogo';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  userEmail: string | null;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onLogout,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {/* Logo da Marca */}
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden">
            <BrandLogo size={32} compact={true} animated={false} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight leading-tight flex items-center space-x-1">
              <span>Obra</span>
              <span className="text-emerald-500 dark:text-emerald-400">Chácara</span>
            </h1>
            <p className="text-[10px] font-mono text-sky-500 dark:text-sky-400/90 leading-none">
              10x50m • 500m²
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Seletor de Tema (Leitura, Escuro, Claro) com salvamento no Supabase */}
          <ThemeSelector />

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Atualizar dados"
              title="Atualizar dados"
              className="p-1.5 rounded-xl border border-transparent text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 theme-icon-btn"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {userEmail && (
            <div className="flex items-center pl-1 border-l border-slate-800 space-x-1.5 theme-user-section">
              <span className="text-[11px] max-w-[95px] truncate font-medium text-slate-300" title={userEmail}>
                {userEmail.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                aria-label="Sair da conta"
                title="Sair"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all theme-icon-btn"
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
