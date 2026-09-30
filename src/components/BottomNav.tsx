import React from 'react';
import { LayoutDashboard, Plus, ReceiptText, Settings } from 'lucide-react';
import type { TabType } from '../types/app';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.25)] pb-safe transition-colors duration-300 theme-bottom-nav">
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-around">
        {/* Aba Dashboard */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'dashboard'
              ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">Visão Geral</span>
        </button>

        {/* Aba Histórico */}
        <button
          onClick={() => onChangeTab('historico')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'historico'
              ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptText className={`w-5 h-5 transition-transform ${currentTab === 'historico' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">Extrato</span>
        </button>

        {/* Botão Central de Novo Lançamento */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => onChangeTab('novo')}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
              currentTab === 'novo'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 ring-4 ring-emerald-500/30 scale-105 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/80 ring-2 ring-emerald-400/20'
            }`}
            aria-label="Adicionar Despesa"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Aba Configurações */}
        <button
          onClick={() => onChangeTab('configuracoes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'configuracoes'
              ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className={`w-5 h-5 transition-transform ${currentTab === 'configuracoes' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};
