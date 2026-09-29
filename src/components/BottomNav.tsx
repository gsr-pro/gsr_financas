import React from 'react';
import { LayoutDashboard, Plus, ReceiptText } from 'lucide-react';
import type { TabType } from '../types/app';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {/* Aba Dashboard */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'dashboard'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1">Visão Geral</span>
        </button>

        {/* Botão Central de Novo Lançamento */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => onChangeTab('novo')}
            className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              currentTab === 'novo'
                ? 'bg-emerald-600 ring-4 ring-emerald-100 scale-105'
                : 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-900/20'
            }`}
            aria-label="Adicionar Despesa"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Aba Histórico */}
        <button
          onClick={() => onChangeTab('historico')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'historico'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ReceiptText className={`w-5 h-5 transition-transform ${currentTab === 'historico' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1">Lançamentos</span>
        </button>
      </div>
    </nav>
  );
};
