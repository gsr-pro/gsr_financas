import React, { useState } from 'react';
import type { InvestimentoItem, TipoInvestimento } from '../../types/app';
import type { Json } from '../../types/database.types';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { InvestmentModal } from './InvestmentModal';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Coins,
} from 'lucide-react';

interface InvestmentDashboardProps {
  investimentos: InvestimentoItem[];
  onRefresh: () => void;
}

const TIPO_COLORS: Record<TipoInvestimento, { bg: string; text: string; badge: string }> = {
  'CDB': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  'Poupança': { bg: 'bg-sky-500/15', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  'Tesouro Direto': { bg: 'bg-amber-500/15', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  'LCI/LCA': { bg: 'bg-teal-500/15', text: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  'Ações/FIIs': { bg: 'bg-purple-500/15', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  'Cripto': { bg: 'bg-orange-500/15', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  'Outro': { bg: 'bg-slate-500/15', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
};

export const InvestmentDashboard: React.FC<InvestmentDashboardProps> = ({
  investimentos,
  onRefresh,
}) => {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InvestimentoItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalInvestido = investimentos.reduce((acc, curr) => acc + Number(curr.valor), 0);

  // Agrupamento por Tipo
  const breakdownByTipo = investimentos.reduce((acc, curr) => {
    acc[curr.tipo] = (acc[curr.tipo] || 0) + Number(curr.valor);
    return acc;
  }, {} as Record<string, number>);

  const handleDelete = async (id: string) => {
    if (!currentWorkspace?.id) return;
    if (!window.confirm('Tem certeza que deseja remover este investimento?')) return;

    setDeletingId(id);
    try {
      const currentConfig = (currentWorkspace.configuracoes as { [key: string]: Json | undefined }) || {};
      const currentList = Array.isArray(currentConfig.investimentos)
        ? (currentConfig.investimentos as unknown as InvestimentoItem[])
        : [];

      const updatedList = currentList.filter((item) => item.id !== id);

      const updatedConfig: { [key: string]: Json | undefined } = {
        ...currentConfig,
        investimentos: updatedList,
      };

      const { error } = await supabase
        .from('workspaces')
        .update({
          configuracoes: updatedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWorkspace.id);

      if (error) throw error;

      // Opcional: tenta apagar da tabela dedicada caso exista
      try {
        await supabase.from('investimentos').delete().eq('id', id);
      } catch (e) {
        // Ignora caso a tabela ainda não exista
      }

      await refreshWorkspaces();
      onRefresh();
    } catch (err) {
      console.error('Erro ao excluir investimento:', err);
      alert('Não foi possível excluir o investimento.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5 animate-fade-in">
      
      {/* Cabeçalho do Bloco de Investimentos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-white tracking-tight">
                Patrimônio & Investimentos
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                {investimentos.length} {investimentos.length === 1 ? 'aplicação' : 'aplicações'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Controle de CDBs, Poupança, Liquidez Diária e Reserva Financeira.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Adicionar Investimento</span>
          </button>
        </div>
      </div>

      {/* Card de Destaque: Total Investido e Barra de Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        
        {/* Total Consolidado */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-center">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Total em Aplicações
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
            {formatCurrency(totalInvestido)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Patrimônio protegido e individualizado</span>
          </span>
        </div>

        {/* Barra de Distribuição Visual */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Alocação de Recursos</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {Object.keys(breakdownByTipo).length} classes ativas
            </span>
          </div>

          {totalInvestido > 0 ? (
            <>
              {/* Barra de progresso colorida */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                {Object.entries(breakdownByTipo).map(([t, amount]) => {
                  const pct = (amount / totalInvestido) * 100;
                  const colorConfig = TIPO_COLORS[t as TipoInvestimento] || TIPO_COLORS.Outro;
                  return (
                    <div
                      key={t}
                      style={{ width: `${pct}%` }}
                      className={`h-full ${colorConfig.bg.replace('/15', '')} transition-all`}
                      title={`${t}: ${formatCurrency(amount)} (${formatPercent(pct, 1)})`}
                    />
                  );
                })}
              </div>

              {/* Legenda compacta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px]">
                {Object.entries(breakdownByTipo).map(([t, amount]) => {
                  const pct = (amount / totalInvestido) * 100;
                  const colorConfig = TIPO_COLORS[t as TipoInvestimento] || TIPO_COLORS.Outro;
                  return (
                    <div key={t} className="flex items-center space-x-1.5">
                      <div className={`w-2 h-2 rounded-full ${colorConfig.text.replace('text-', 'bg-')}`} />
                      <span className="text-slate-300 font-medium">{t}:</span>
                      <span className="font-mono text-white font-bold">{formatCurrency(amount)}</span>
                      <span className="text-slate-500 font-mono">({formatPercent(pct, 0)})</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 py-1">
              Nenhuma aplicação cadastrada ainda. Clique em "Adicionar Investimento" para começar.
            </p>
          )}
        </div>
      </div>

      {/* Lista de Investimentos Cadastrados */}
      {investimentos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {investimentos.map((item) => {
            const colorConfig = TIPO_COLORS[item.tipo] || TIPO_COLORS.Outro;
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${colorConfig.badge}`}>
                        {item.tipo}
                      </span>
                      {item.instituicao && (
                        <span className="text-[11px] text-slate-400 font-medium truncate">
                          {item.instituicao}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-white mt-1 truncate" title={item.nome}>
                      {item.nome}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Editar saldo/detalhes"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      title="Excluir investimento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-baseline justify-between">
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {formatCurrency(item.valor)}
                  </span>
                  {item.rentabilidade && (
                    <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      {item.rentabilidade}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          onRefresh();
        }}
        investmentToEdit={editingItem}
      />
    </div>
  );
};
