import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { DashboardTotaisRow } from '../types/app';
import { MetricCard } from '../components/MetricCard';
import { CategoryProgress } from '../components/CategoryProgress';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../lib/formatters';
import { Trees, Hammer, HardHat, FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface DashboardViewProps {
  onNavigateToForm: () => void;
  refreshTrigger?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToForm, refreshTrigger }) => {
  const [totais, setTotais] = useState<DashboardTotaisRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotais = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vw_dashboard_totais')
        .select('*')
        .maybeSingle();

      if (fetchError) throw fetchError;
      setTotais(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados consolidados da obra.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotais();
  }, [fetchTotais, refreshTrigger]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center my-4 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h4 className="text-sm font-bold text-rose-900">Falha na sincronização</h4>
        <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
        <button
          onClick={fetchTotais}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const custoTotalGeral = totais?.custo_total_geral ?? 50000;
  const valorTerreno = totais?.valor_aquisicao_terreno ?? 50000;
  const totalDespesas = totais?.total_despesas ?? 0;
  const totalMateriais = totais?.total_materiais ?? 0;
  const totalMaoDeObra = totais?.total_mao_de_obra ?? 0;
  const totalDocumentacao = totais?.total_documentacao ?? 0;
  const totalFerramentas = totais?.total_ferramentas ?? 0;
  const totalOutros = totais?.total_outros ?? 0;
  const totalPago = totais?.total_pago ?? 0;
  const totalPendente = totais?.total_pendente ?? 0;

  const categories = [
    { name: 'Materiais', amount: totalMateriais, color: 'bg-blue-500' },
    { name: 'Mão de Obra', amount: totalMaoDeObra, color: 'bg-amber-500' },
    { name: 'Documentação', amount: totalDocumentacao, color: 'bg-purple-500' },
    { name: 'Ferramentas', amount: totalFerramentas, color: 'bg-orange-500' },
    { name: 'Outros', amount: totalOutros, color: 'bg-slate-400' },
  ];

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. Card de Destaque: Custo Total Geral */}
      <MetricCard
        variant="highlight"
        title="Investimento Total Geral"
        value={formatCurrency(custoTotalGeral)}
        subtitle="Terreno (R$ 50.000,00) + Despesas da Obra"
        icon={<Trees className="w-6 h-6" />}
      />

      {/* 2. Grid Terreno Fixo & Despesas da Obra */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card Terreno Fixo */}
        <div className="bg-emerald-950/30 rounded-2xl p-4 border border-emerald-500/30 shadow-md theme-card-terreno">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 theme-terreno-label">Terreno</span>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded theme-terreno-badge">
              10x50m
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-white tracking-tight theme-terreno-val">
            {formatCurrency(valorTerreno)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 theme-terreno-sub">
            Pago em 10/04/2022
          </p>
        </div>

        {/* Card Despesas Obra */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md theme-card-despesas">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Despesas Obra</span>
            <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded theme-despesas-badge">
              {totais?.total_lancamentos ?? 0} {totais?.total_lancamentos === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-white tracking-tight">
            {formatCurrency(totalDespesas)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Total em lançamentos
          </p>
        </div>
      </div>

      {/* 3. Status de Pagamento (Pago vs Pendente) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-md flex items-center space-x-3 theme-card-status">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 theme-status-icon-pago">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Total Quitado</span>
            <span className="text-sm font-bold text-emerald-400 theme-status-val-pago">{formatCurrency(totalPago)}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-md flex items-center space-x-3 theme-card-status">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0 theme-status-icon-pendente">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">A Pagar / Pendente</span>
            <span className="text-sm font-bold text-amber-400 theme-status-val-pendente">{formatCurrency(totalPendente)}</span>
          </div>
        </div>
      </div>

      {/* 4. Métricas por Categoria Principal */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-center shadow-md theme-card-categoria">
          <div className="w-7 h-7 bg-sky-500/15 text-sky-400 border border-sky-500/25 rounded-lg flex items-center justify-center mx-auto mb-1.5 theme-cat-icon-mat">
            <Hammer className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-400 block">Materiais</span>
          <span className="text-xs font-bold text-white mt-0.5 block truncate">
            {formatCurrency(totalMateriais)}
          </span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-center shadow-md theme-card-categoria">
          <div className="w-7 h-7 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-lg flex items-center justify-center mx-auto mb-1.5 theme-cat-icon-mao">
            <HardHat className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-400 block">Mão de Obra</span>
          <span className="text-xs font-bold text-white mt-0.5 block truncate">
            {formatCurrency(totalMaoDeObra)}
          </span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-center shadow-md theme-card-categoria">
          <div className="w-7 h-7 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-lg flex items-center justify-center mx-auto mb-1.5 theme-cat-icon-out">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-400 block">Outros</span>
          <span className="text-xs font-bold text-white mt-0.5 block truncate">
            {formatCurrency(totalDocumentacao + totalFerramentas + totalOutros)}
          </span>
        </div>
      </div>

      {/* 5. Progresso e Detalhamento Percentual */}
      <CategoryProgress categories={categories} totalExpenses={totalDespesas} />

      {/* 6. Card de Ação Rápida */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg theme-action-banner">
        <div>
          <h4 className="text-sm font-bold leading-tight text-white">Novo Gasto na Chácara?</h4>
          <p className="text-[11px] text-emerald-300 mt-0.5">
            Registre notas fiscais e comprovantes no ato.
          </p>
        </div>
        <button
          onClick={onNavigateToForm}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95"
        >
          Lançar Gasto
        </button>
      </div>
    </div>
  );
};
