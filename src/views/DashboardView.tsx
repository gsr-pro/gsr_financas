import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSubscription } from '../context/SubscriptionContext';
import { PaywallView } from '../components/subscription/PaywallView';
import type { DespesaRow } from '../types/app';
import { MetricCard } from '../components/MetricCard';
import { CategoryProgress } from '../components/CategoryProgress';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate, getCategoryBadgeStyle } from '../lib/formatters';
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
} from 'lucide-react';

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
  const { isTrialing, trialDaysRemaining } = useSubscription();

  const [despesas, setDespesas] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('despesas')
        .select('*')
        .order('data_gasto', { ascending: false });

      if (currentWorkspace?.id) {
        if (currentWorkspace.tipo === 'obra') {
          query = query.or(`workspace_id.eq.${currentWorkspace.id},and(tipo_ambiente.eq.obra,workspace_id.is.null)`);
        } else {
          query = query.eq('workspace_id', currentWorkspace.id);
        }
      } else {
        query = query.eq('tipo_ambiente', currentEnvironment);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setDespesas(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar dados do painel.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentEnvironment, currentWorkspace]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  // Cálculos consolidados dinâmicos
  const totalDespesas = useMemo(() => {
    return despesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [despesas]);

  const totalPago = useMemo(() => {
    return despesas
      .filter((d) => d.status_pagamento === 'Pago')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [despesas]);

  const totalPendente = useMemo(() => {
    return despesas
      .filter((d) => d.status_pagamento === 'Pendente')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [despesas]);

  // Métricas específicas de Obra
  const isObra = currentEnvironment === 'obra';
  const valorAquisicao = Number(currentWorkspace?.valor_aquisicao || 0);
  const hasAquisicao = isObra && valorAquisicao > 0;
  const custoTotalGeral = hasAquisicao ? valorAquisicao + totalDespesas : totalDespesas;
  const dimensoesImovel = currentWorkspace?.dimensoes_terreno || 'Terreno / Imóvel';

  // Agrupamento por Categoria Dinâmico
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of despesas) {
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
  }, [despesas]);

  // Últimos 4 lançamentos recentes para exibição desktop
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
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
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
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {isObra ? <Building2 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Projeto Ativo:
              </span>
              <span className="text-sm font-extrabold text-white truncate">
                {currentWorkspace?.nome || (isObra ? 'Controle de Obra Principal' : 'Minhas Finanças Pessoais')}
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
                  : 'Painel orçamentário pessoal, contas fixas, variáveis e reservas.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center flex-shrink-0">
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
              isObra
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isObra ? 'Ambiente de Obra' : 'Ambiente Pessoal'}
          </span>
        </div>
      </div>

      {/* Banner Informativo de Fase de Testes & Prazo de Contratação */}
      {isTrialing && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                  Fase de Testes Ativa
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  Restam {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
                Você está com todos os recursos e módulos liberados. <strong>Contrate o plano Gestão Completa Pro</strong> antes do término para não ter o acesso aos módulos bloqueado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5 flex-shrink-0 self-start sm:self-center cursor-pointer"
          >
            <span>Contratar (R$ 14,90/mês)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid Superior de Métricas - 1 a 4 colunas dependendo do breakpoint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Geral Acumulado */}
        <div className="sm:col-span-2 lg:col-span-2">
          <MetricCard
            variant="highlight"
            title={
              isObra
                ? hasAquisicao
                  ? 'Investimento Total Geral'
                  : 'Total Acumulado da Obra'
                : 'Total de Gastos Pessoais'
            }
            value={formatCurrency(custoTotalGeral)}
            subtitle={
              isObra
                ? hasAquisicao
                  ? `Aquisição (${formatCurrency(valorAquisicao)}) + Despesas da Obra`
                  : `${despesas.length} lançamentos registrados na obra`
                : `${despesas.length} despesas registradas no ambiente pessoal`
            }
            icon={isObra ? <Trees className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
          />
        </div>

        {/* Card 2: Total Pago / Quitado */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center space-x-3.5 theme-card-status">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 theme-status-icon-pago">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Quitado</span>
            <span className="text-lg font-extrabold text-emerald-400 theme-status-val-pago">
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
            <span className="text-lg font-extrabold text-amber-400 theme-status-val-pendente">
              {formatCurrency(totalPendente)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Contas em aberto</span>
          </div>
        </div>
      </div>

      {/* Grid Médio Desktop: Distribuição por Categorias + Lançamentos Recentes Simultâneos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda (7 colunas no Desktop): Gráfico e Detalhamento de Categorias */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card Aquisição (se Obra) ou Resumo do Ambiente */}
          {isObra && hasAquisicao && (
            <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/30 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-400">Aquisição do Terreno / Lote</span>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  {formatCurrency(valorAquisicao)}
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-xl">
                {dimensoesImovel}
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
                {isObra ? 'Novo Gasto na Construção?' : 'Novo Gasto Pessoal?'}
              </h4>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                {isObra
                  ? 'Cadastre notas de cimento, pedreiros e maquinário no ato.'
                  : 'Registre despesas diárias, contas fixas ou investimentos.'}
              </p>
            </div>
            <button
              onClick={onNavigateToForm}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Lançar Gasto
            </button>
          </div>
        </div>

        {/* Coluna Direita (5 colunas no Desktop): Lançamentos Recentes Simultâneos */}
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
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
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
                {recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-0.5 truncate mr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getCategoryBadgeStyle(exp.categoria)}`}>
                          {exp.categoria}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDate(exp.data_gasto)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{exp.descricao}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-white block">
                        {formatCurrency(exp.valor)}
                      </span>
                      <span className={`text-[9px] font-bold ${exp.status_pagamento === 'Pago' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {exp.status_pagamento}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {paywallOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <PaywallView
            reason="feature_locked"
            lockedFeatureName="Gestão Completa Pro"
            onClose={() => setPaywallOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
