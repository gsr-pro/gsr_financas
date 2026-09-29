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
        <div className="bg-white rounded-xl p-4 border border-emerald-200/80 bg-emerald-50/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Terreno</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              10x50m
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 tracking-tight">
            {formatCurrency(valorTerreno)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Pago em 10/04/2022
          </p>
        </div>

        {/* Card Despesas Obra */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Despesas Obra</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
              {totais?.total_lancamentos ?? 0} {totais?.total_lancamentos === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalDespesas)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Total em lançamentos
          </p>
        </div>
      </div>

      {/* 3. Status de Pagamento (Pago vs Pendente) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Total Quitado</span>
            <span className="text-sm font-bold text-slate-900">{formatCurrency(totalPago)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">A Pagar / Pendente</span>
            <span className="text-sm font-bold text-amber-800">{formatCurrency(totalPendente)}</span>
          </div>
        </div>
      </div>

      {/* 4. Métricas por Categoria Principal */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center shadow-sm">
          <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1.5">
            <Hammer className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-500 block">Materiais</span>
          <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
            {formatCurrency(totalMateriais)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center shadow-sm">
          <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mx-auto mb-1.5">
            <HardHat className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-500 block">Mão de Obra</span>
          <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
            {formatCurrency(totalMaoDeObra)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center shadow-sm">
          <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-1.5">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-500 block">Outros</span>
          <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
            {formatCurrency(totalDocumentacao + totalFerramentas + totalOutros)}
          </span>
        </div>
      </div>

      {/* 5. Progresso e Detalhamento Percentual */}
      <CategoryProgress categories={categories} totalExpenses={totalDespesas} />

      {/* 6. Card de Ação Rápida */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-4 text-white flex items-center justify-between shadow-md">
        <div>
          <h4 className="text-sm font-bold leading-tight">Novo Gasto na Chácara?</h4>
          <p className="text-[11px] text-emerald-100 mt-0.5">
            Registre notas fiscais e comprovantes no ato.
          </p>
        </div>
        <button
          onClick={onNavigateToForm}
          className="px-3.5 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow transition-all active:scale-95"
        >
          Lançar Gasto
        </button>
      </div>
    </div>
  );
};
