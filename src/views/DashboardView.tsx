import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import type { DespesaRow, InvestimentoItem } from '../types/app';
import { MetricCard } from '../components/MetricCard';
import { CategoryProgress } from '../components/CategoryProgress';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { InvestmentDashboard } from '../components/investments/InvestmentDashboard';
import { formatCurrency, formatPercent, formatDate, getCategoryBadgeStyle } from '../lib/formatters';
import {
  Trees,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
  Building2,
  ArrowRight,
  Layers,
  MapPin,
  Maximize2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Briefcase,
  Calculator,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { PeriodFilter, type PeriodFilterValue } from '../components/PeriodFilter';
import { PricingCalculatorModal } from '../components/business/PricingCalculatorModal';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';

const TIPO_IMOVEL_LABELS: Record<string, string> = {
  terreno: 'Terreno / Lote',
  casa: 'Casa Residencial',
  apartamento: 'Apartamento',
  chacara: 'Chácara / Sítio',
  comercial: 'Ponto Comercial',
  reforma: 'Reforma',
  outro: 'Projeto',
};

interface DashboardViewProps {
  onNavigateToForm: () => void;
  onNavigateToHistory?: () => void;
  refreshTrigger?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToForm,
  onNavigateToHistory,
  refreshTrigger,
}) => {
  const { currentEnvironment, currentWorkspace } = useWorkspace();

  const [despesas, setDespesas] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('despesas')
        .select('*')
        .order('data_gasto', { ascending: false });

      const hasRealWorkspace = Boolean(currentWorkspace?.id && !currentWorkspace.id.startsWith('virtual-'));

      if (hasRealWorkspace && currentWorkspace) {
        if (currentWorkspace.tipo === 'obra') {
          query = query.or(`workspace_id.eq.${currentWorkspace.id},and(tipo_ambiente.eq.obra,workspace_id.is.null)`);
        } else {
          query = query.or(`workspace_id.eq.${currentWorkspace.id},and(tipo_ambiente.eq.${currentEnvironment},workspace_id.is.null)`);
        }
      } else {
        query = query.eq('tipo_ambiente', currentEnvironment);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setDespesas(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentEnvironment, currentWorkspace?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const isObra = currentEnvironment === 'obra';
  const isNegocio = currentEnvironment === 'negocio';
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isEditWorkspaceModalOpen, setIsEditWorkspaceModalOpen] = useState<boolean>(false);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    year: null,
    month: null,
  });

  const filteredDespesas = useMemo(() => {
    if (periodFilter.year === null || periodFilter.month === null) {
      return despesas;
    }
    return despesas.filter((d) => {
      const [ano, mes] = d.data_gasto.split('-').map(Number);
      return ano === periodFilter.year && mes === periodFilter.month;
    });
  }, [despesas, periodFilter]);

  const periodLabel = useMemo(() => {
    if (periodFilter.year === null || periodFilter.month === null) {
      return 'Todo o Histórico';
    }
    const MONTHS = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${MONTHS[periodFilter.month - 1]} de ${periodFilter.year}`;
  }, [periodFilter]);

  // Finanças Pessoais e Negócio: Separação de Receitas vs Despesas
  const receitasList = useMemo(() => {
    return filteredDespesas.filter(
      (d) => d.tipo_movimentacao === 'receita' || d.descricao.startsWith('[RECEITA]')
    );
  }, [filteredDespesas]);

  const despesasList = useMemo(() => {
    return isObra
      ? filteredDespesas
      : filteredDespesas.filter(
          (d) => d.tipo_movimentacao !== 'receita' && !d.descricao.startsWith('[RECEITA]')
        );
  }, [filteredDespesas, isObra]);

  const totalReceitas = useMemo(() => {
    return receitasList.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [receitasList]);

  const totalDespesas = useMemo(() => {
    return despesasList.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [despesasList]);

  const saldoLiquido = totalReceitas - totalDespesas;

  const totalPago = useMemo(() => {
    return despesasList
      .filter((d) => d.status_pagamento === 'Pago')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [despesasList]);

  const totalPendente = useMemo(() => {
    return despesasList
      .filter((d) => d.status_pagamento === 'Pendente')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [despesasList]);

  // Investimentos do workspace de Finanças Pessoais
  const workspaceConfig = (currentWorkspace?.configuracoes as Record<string, unknown>) || {};
  const investimentos = Array.isArray(workspaceConfig.investimentos)
    ? (workspaceConfig.investimentos as InvestimentoItem[])
    : [];

  const totalInvestido = useMemo(() => {
    return investimentos.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [investimentos]);

  // Métricas específicas de Obra
  const valorAquisicao = Number(currentWorkspace?.valor_aquisicao || 0);
  const hasAquisicao = isObra && valorAquisicao > 0;
  const custoTotalGeral = hasAquisicao ? valorAquisicao + totalDespesas : totalDespesas;
  const dimensoesImovel = currentWorkspace?.dimensoes_terreno || 'Terreno / Imóvel';

  // Agrupamento por Categoria Dinâmico das Despesas
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of despesasList) {
      map[d.categoria] = (map[d.categoria] || 0) + Number(d.valor);
    }

    const colors = [
      'bg-sky-500',
      'bg-amber-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-rose-500',
      'bg-teal-500',
      'bg-cyan-500',
    ];

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], idx) => ({
        name,
        amount,
        color: colors[idx % colors.length],
      }));
  }, [despesasList]);

  // Últimos lançamentos recentes para exibição desktop
  const recentExpenses = useMemo(() => despesas.slice(0, 5), [despesas]);

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
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      
      {/* Barra de Identificação Contextual do Projeto / Ambiente Ativo */}
      <div className="bg-slate-900/90 rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isObra
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : isNegocio
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {isObra ? (
              <Building2 className="w-5 h-5" />
            ) : isNegocio ? (
              <Briefcase className="w-5 h-5" />
            ) : (
              <Wallet className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Projeto Ativo:
              </span>
              <span className="text-sm font-extrabold text-white truncate">
                {currentWorkspace?.nome ||
                  (isObra
                    ? 'Controle de Obra Principal'
                    : isNegocio
                    ? 'Gestão de Negócio'
                    : 'Minhas Finanças Pessoais')}
              </span>
              {isObra && currentWorkspace?.tipo_imovel && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {TIPO_IMOVEL_LABELS[currentWorkspace.tipo_imovel] || currentWorkspace.tipo_imovel}
                </span>
              )}
            </div>

            {/* Informações detalhadas do imóvel quando em obra */}
            {isObra && (currentWorkspace?.dimensoes_terreno || currentWorkspace?.localizacao) ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                {currentWorkspace.dimensoes_terreno && (
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Maximize2 className="w-3 h-3 text-emerald-400" />
                    <span>{currentWorkspace.dimensoes_terreno}</span>
                  </span>
                )}
                {currentWorkspace.localizacao && (
                  <span className="flex items-center space-x-1 text-slate-400 truncate max-w-[280px]">
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{currentWorkspace.localizacao}</span>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                {isObra
                  ? 'Painel de custos diretos, evolução física e aquisição de imóveis.'
                  : isNegocio
                  ? 'Painel executivo da empresa, insumos, fluxo de caixa e ponto de equilíbrio.'
                  : 'Painel orçamentário pessoal, receitas, despesas e investimentos.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center flex-shrink-0">
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
              isObra
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : isNegocio
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40'
                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isObra ? 'Ambiente de Obra' : isNegocio ? 'Ambiente de Negócio' : 'Ambiente Pessoal'}
          </span>
        </div>
      </div>

      {/* Barra de Filtro de Período do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
        <PeriodFilter value={periodFilter} onChange={setPeriodFilter} />
        <span className="text-xs text-slate-400 px-2 font-medium">
          {periodFilter.year === null || periodFilter.month === null
            ? 'Exibindo indicadores consolidados de todo o histórico'
            : `Exibindo indicadores filtrados de ${periodLabel}`}
        </span>
      </div>

      {/* Grid Superior de Métricas: Obra vs Pessoal */}
      {isObra ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Geral Acumulado */}
          <div className="sm:col-span-2 lg:col-span-2">
            <MetricCard
              variant="highlight"
              title={
                hasAquisicao
                  ? 'Investimento Total Geral'
                  : 'Total Acumulado da Obra'
              }
              value={formatCurrency(custoTotalGeral)}
              subtitle={
                hasAquisicao
                  ? `Aquisição (${formatCurrency(valorAquisicao)}) + Despesas da Obra`
                  : `${despesas.length} lançamentos registrados na obra`
              }
              icon={<Trees className="w-6 h-6" />}
            />
          </div>

          {/* Card 2: Total Pago / Quitado */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5 theme-card-status">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 theme-status-icon-pago">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Quitado</span>
              <span className="text-lg font-extrabold text-emerald-400 theme-status-val-pago font-mono">
                {formatCurrency(totalPago)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Pagamentos liquidados</span>
            </div>
          </div>

          {/* Card 3: Total Pendente / A Pagar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5 theme-card-status">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 theme-status-icon-pendente">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">A Pagar / Pendente</span>
              <span className="text-lg font-extrabold text-amber-400 theme-status-val-pendente font-mono">
                {formatCurrency(totalPendente)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Contas em aberto</span>
            </div>
          </div>
        </div>
      ) : (
        /* Painel Consolidado de Finanças Pessoais: Saldo Líquido, Receitas, Despesas e Investimentos */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Saldo Líquido (Receitas - Despesas) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Saldo Líquido do Período
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  saldoLiquido >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {saldoLiquido >= 0 ? 'Superávit' : 'Déficit'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2 mt-1.5">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  saldoLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(saldoLiquido)}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 block font-mono">
              Receitas ({formatCurrency(totalReceitas)}) - Despesas ({formatCurrency(totalDespesas)})
            </span>
          </div>

          {/* Card 2: Total de Receitas (Entradas) */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Receitas</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {formatCurrency(totalReceitas)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {receitasList.length} entradas registradas
              </span>
            </div>
          </div>

          {/* Card 3: Total de Despesas (Saídas) */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Despesas</span>
              <span className="text-lg font-black text-rose-400 font-mono">
                {formatCurrency(totalDespesas)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {despesasList.length} saídas registradas
              </span>
            </div>
          </div>

          {/* Card 4: Margem Líquida (Negócio) OU Investimentos & Reserva (Pessoal) */}
          {isNegocio ? (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Margem Líquida</span>
                <span className="text-lg font-black text-indigo-400 font-mono">
                  {totalReceitas > 0 ? formatPercent((saldoLiquido / totalReceitas) * 100, 1) : '0,0%'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {totalReceitas > 0
                    ? saldoLiquido >= 0
                      ? 'Lucro operacional saudável'
                      : 'Margem negativa no período'
                    : 'Sem faturamento no período'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Investimentos & Reserva</span>
                <span className="text-lg font-black text-cyan-400 font-mono">
                  {formatCurrency(totalInvestido)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {investimentos.length} aplicações (CDB, Poupança...)
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* DASHBOARD DE INVESTIMENTOS E RESERVA (Exclusivo para Finanças Pessoais) */}
      {currentEnvironment === 'pessoal' && (
        <InvestmentDashboard
          investimentos={investimentos}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* BANNER ESTRATÉGICO DE PRECIFICAÇÃO (Exclusivo para Negócio & PME) */}
      {isNegocio && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Módulo PME
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">Calculadora de Precificação & Markup</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Simule o preço de venda ideal com base nos insumos, mão de obra, embalagens e impostos para nunca vender no prejuízo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPricingModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-center flex-shrink-0"
          >
            <Calculator className="w-4 h-4" />
            <span>Calcular Preço de Venda</span>
          </button>
        </div>
      )}

      {/* Grid Médio Desktop: Distribuição por Categorias + Lançamentos Recentes Simultâneos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Gráfico e Detalhamento de Categorias */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card Aquisição (se Obra) - Interativo e com CTA amigável quando zerado */}
          {isObra && hasAquisicao && (
            <div
              onClick={() => setIsEditWorkspaceModalOpen(true)}
              className="bg-emerald-950/20 hover:bg-emerald-950/35 rounded-2xl p-4 border border-emerald-500/30 hover:border-emerald-500/50 shadow-md flex items-center justify-between cursor-pointer transition-all group"
              title="Clique para editar especificações do terreno/imóvel"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-emerald-400">Aquisição do Terreno / Lote</span>
                  <span className="text-[10px] text-emerald-400/70 group-hover:text-emerald-300 flex items-center space-x-0.5 transition-colors">
                    <Edit3 className="w-3 h-3" />
                    <span className="font-medium">Editar</span>
                  </span>
                </div>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  {formatCurrency(valorAquisicao)}
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-xl">
                {dimensoesImovel}
              </span>
            </div>
          )}

          {isObra && !hasAquisicao && (
            <div
              onClick={() => setIsEditWorkspaceModalOpen(true)}
              className="bg-slate-900/90 hover:bg-slate-900 border border-dashed border-emerald-500/40 hover:border-emerald-500/70 rounded-2xl p-3.5 sm:p-4 shadow-md flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Trees className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    Adicionar Valor do Terreno / Imóvel
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                    Componha o custo total da obra somando o valor de aquisição
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center space-x-1 flex-shrink-0 ml-2">
                <span>+ Definir</span>
              </span>
            </div>
          )}

          {/* Progresso de Categorias */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>
                  {isObra ? 'Distribuição por Etapa da Obra' : 'Despesas por Categoria Pessoal'}
                </span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {categoryBreakdown.length} categorias ativas
              </span>
            </div>

            <CategoryProgress
              categories={categoryBreakdown}
              totalExpenses={totalDespesas}
            />
          </div>

          {/* Banner de Ação Rápida */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg theme-action-banner">
            <div>
              <h4 className="text-sm font-bold leading-tight text-white">
                {isObra ? 'Novo Gasto na Construção?' : 'Novo Lançamento Financeiro?'}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {isObra
                  ? 'Cadastre recibos, notas fiscais e controle o custo por m².'
                  : 'Cadastre receitas, salários, despesas ou contas mensais.'}
              </p>
            </div>
            <button
              onClick={onNavigateToForm}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              {isObra ? 'Lançar Gasto' : 'Novo Lançamento'}
            </button>
          </div>
        </div>

        {/* Coluna Direita: Lançamentos Recentes Simultâneos */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Últimos Lançamentos</span>
              </h3>
              {onNavigateToHistory && (
                <button
                  onClick={onNavigateToHistory}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Ver Todos</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {recentExpenses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <FileText className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs">Nenhum lançamento recente neste ambiente.</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {recentExpenses.map((exp) => {
                  const isReceita = exp.tipo_movimentacao === 'receita' || exp.descricao.startsWith('[RECEITA]');
                  return (
                    <div
                      key={exp.id}
                      className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5 truncate mr-2">
                        <div className="flex items-center space-x-1.5">
                          {isReceita && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              Receita
                            </span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getCategoryBadgeStyle(exp.categoria)}`}>
                            {exp.categoria}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatDate(exp.data_gasto)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white truncate">
                          {exp.descricao.replace(/^\[RECEITA\]\s*/, '')}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-black block font-mono ${
                          isReceita ? 'text-emerald-400' : 'text-white'
                        }`}>
                          {isReceita ? `+ ${formatCurrency(exp.valor)}` : formatCurrency(exp.valor)}
                        </span>
                        <span className={`text-[9px] font-bold ${exp.status_pagamento === 'Pago' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isReceita
                            ? exp.status_pagamento === 'Pago'
                              ? 'Recebido'
                              : 'A Receber'
                            : exp.status_pagamento}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Precificação PME */}
      <PricingCalculatorModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Modal de Edição Rápida do Workspace / Imóvel da Obra */}
      {isEditWorkspaceModalOpen && currentWorkspace && (
        <WorkspaceModal
          isOpen={isEditWorkspaceModalOpen}
          onClose={() => setIsEditWorkspaceModalOpen(false)}
          workspaceToEdit={currentWorkspace}
        />
      )}
    </div>
  );
};
