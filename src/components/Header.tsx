import React from 'react';
import { Home, LogOut, RefreshCw } from 'lucide-react';

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
  isRefreshing = false
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700/80 border border-emerald-600/50 flex items-center justify-center text-emerald-200 shadow-inner">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              Obra Chácara
            </h1>
            <p className="text-[11px] font-medium text-emerald-200/90 leading-none">
              10x50m • 500m²
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Atualizar dados"
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/60 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {userEmail && (
            <div className="flex items-center pl-1 border-l border-emerald-700/60 space-x-1.5">
              <span className="text-[11px] max-w-[110px] truncate text-emerald-100" title={userEmail}>
                {userEmail.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                aria-label="Sair da conta"
                title="Sair"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-red-200 hover:bg-emerald-900/40 active:scale-95 transition-all"
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
