import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import type { DespesaRow } from '../types/app';
import { formatCurrency, formatDate, getCategoryBadgeStyle, formatFormaPagamento } from '../lib/formatters';
import { ComprovanteModal } from '../components/ComprovanteModal';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Search,
  FileImage,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Pencil,
  TrendingUp,
  TrendingDown,
  FileDown,
  Tag,
} from 'lucide-react';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ManageCategoriesModal } from '../components/category/ManageCategoriesModal';
import { PeriodFilter, type PeriodFilterValue } from '../components/PeriodFilter';
import { ExportReportModal } from '../components/export/ExportReportModal';

interface ExpenseListViewProps {
  onNavigateToForm: () => void;
  refreshTrigger?: number;
  onExpenseUpdated?: () => void;
}

export const ExpenseListView: React.FC<ExpenseListViewProps> = ({
  onNavigateToForm,
  refreshTrigger,
  onExpenseUpdated,
}) => {
  const { currentEnvironment, currentWorkspace, categories } = useWorkspace();

  const [despesas, setDespesas] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({
    year: null,
    month: null,
  });

  // Modal de Exportação
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string }>({});

  // Modal de Comprovante e Modal de Edição
  const [activeComprovante, setActiveComprovante] = useState<{ url: string; descricao: string } | null>(null);
  const [editingExpense, setEditingExpense] = useState<DespesaRow | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState<boolean>(false);

  // Exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Carrega dados do usuário ativo para relatórios
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const metadataName = (user.user_metadata?.nome || user.user_metadata?.full_name || '') as string;
        setCurrentUser({ email: user.email, name: metadataName });
      }
    });
  }, []);



  const isItemReceita = useCallback((item: DespesaRow) => {
    return item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
  }, []);

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Filtra despesas pelo tipo de ambiente ativo ('obra' | 'pessoal')
      let query = supabase
        .from('despesas')
        .select('*')
        .order('data_gasto', { ascending: false })
        .order('created_at', { ascending: false });

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
      const message = err instanceof Error ? err.message : 'Erro ao listar lançamentos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentEnvironment, currentWorkspace]);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas, refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Tem certeza de que deseja excluir este lançamento?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error: deleteError } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDespesas((prev) => prev.filter((item) => item.id !== id));
      onExpenseUpdated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao excluir o lançamento.';
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDespesas = useMemo(() => {
    return despesas.filter((d) => {
      const isRec = isItemReceita(d);
      const matchTipo =
        currentEnvironment === 'obra' ||
        filterTipo === 'todos' ||
        (filterTipo === 'receita' && isRec) ||
        (filterTipo === 'despesa' && !isRec);

      const matchCategoria =
        selectedCategoria === 'Todas' || d.categoria === selectedCategoria;
      const matchSearch =
        d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.observacoes && d.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchPeriod = true;
      if (periodFilter.year !== null && periodFilter.month !== null) {
        const [ano, mes] = d.data_gasto.split('-').map(Number);
        matchPeriod = ano === periodFilter.year && mes === periodFilter.month;
      }

      return matchTipo && matchCategoria && matchSearch && matchPeriod;
    });
  }, [despesas, filterTipo, selectedCategoria, searchTerm, currentEnvironment, isItemReceita, periodFilter]);



  const totalCalculado = useMemo(() => {
    let rec = 0;
    let desp = 0;
    for (const item of filteredDespesas) {
      const val = Number(item.valor) || 0;
      if (isItemReceita(item)) {
        rec += val;
      } else {
        desp += val;
      }
    }
    return {
      receitas: rec,
      despesas: desp,
      saldo: rec - desp,
      totalGasto: desp,
      geral: filteredDespesas.reduce((acc, curr) => acc + Number(curr.valor), 0),
    };
  }, [filteredDespesas, isItemReceita]);

  const categoriasFiltro = useMemo(() => {
    const existingCats = Array.from(new Set(despesas.map((d) => d.categoria).filter(Boolean)));
    const workspaceCats = categories.map((c) => c.nome);
    const all = Array.from(new Set([...workspaceCats, ...existingCats]));
    return ['Todas', ...all];
  }, [categories, despesas]);

  return (
    <div className="space-y-4 pb-24 animate-fade-in max-w-4xl mx-auto">
      
      {/* Cabeçalho da Lista com identificador de Ambiente */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">Histórico de Lançamentos</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
              {filteredDespesas.length} {filteredDespesas.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ambiente ativo: <span className="font-semibold text-emerald-400">{currentWorkspace?.nome || (currentEnvironment === 'obra' ? 'Custo de Obra' : currentEnvironment === 'negocio' ? 'Gestão de Negócio' : 'Finanças Pessoais')}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            {currentEnvironment !== 'obra' ? (
              filterTipo === 'receita' ? (
                <>
                  <span className="text-[10px] font-mono text-emerald-400 block">Total Receitas</span>
                  <span className="text-sm font-extrabold text-emerald-400">+{formatCurrency(totalCalculado.receitas)}</span>
                </>
              ) : filterTipo === 'despesa' ? (
                <>
                  <span className="text-[10px] font-mono text-rose-400 block">Total Despesas</span>
                  <span className="text-sm font-extrabold text-rose-300">-{formatCurrency(totalCalculado.despesas)}</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-mono text-slate-400 block">Saldo do Filtro</span>
                  <span className={`text-sm font-extrabold ${totalCalculado.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalCalculado.saldo >= 0 ? '+' : ''}{formatCurrency(totalCalculado.saldo)}
                  </span>
                </>
              )
            ) : (
              <>
                <span className="text-[10px] font-mono text-slate-400 block">Total Filtrado</span>
                <span className="text-sm font-extrabold text-emerald-400">{formatCurrency(totalCalculado.geral)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtro de Período & Ações de Exportação GSR Finanças */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
        <PeriodFilter value={periodFilter} onChange={setPeriodFilter} />

        {/* Botão de Exportação Executiva com Seleção Avançada de Período & Formato */}
        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          disabled={despesas.length === 0}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
          title="Exportar dados com seleção de formato e período específico"
        >
          <FileDown className="w-4 h-4 text-emerald-400" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Filtro por Tipo de Movimentação (ambientes Pessoal e Negócio) */}
      {currentEnvironment !== 'obra' && (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setFilterTipo('todos')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
              filterTipo === 'todos'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({despesas.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTipo('receita')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              filterTipo === 'receita'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Receitas</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTipo('despesa')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              filterTipo === 'despesa'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm ring-1 ring-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Despesas</span>
          </button>
        </div>
      )}

      {/* Barra de Busca e Filtro de Categorias */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por descrição ou observação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pílulas de Categoria Horizontais com Acesso a Gestão */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setManageCategoriesOpen(true)}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-slate-700 flex items-center space-x-1.5 transition-all flex-shrink-0 cursor-pointer"
            title="Gerenciar categorias (Criar, Editar ou Excluir)"
          >
            <Tag className="w-3 h-3 text-emerald-400" />
            <span>Gerenciar</span>
          </button>

          {categoriasFiltro.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategoria === cat
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal: Lista / Skeleton / Erro */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-center text-xs text-rose-300 space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <p>{error}</p>
          <button
            onClick={fetchDespesas}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
          >
            Tentar Novamente
          </button>
        </div>
      ) : filteredDespesas.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento encontrado"
          description={
            searchTerm || selectedCategoria !== 'Todas' || filterTipo !== 'todos'
              ? 'Tente ajustar os filtros de categoria, tipo ou o termo de busca.'
              : `Ainda não há lançamentos cadastrados em ${currentEnvironment === 'obra' ? 'Obras' : 'Finanças Pessoais'}.`
          }
          actionText="Novo Lançamento"
          onAction={onNavigateToForm}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredDespesas.map((item) => {
            const isPago = item.status_pagamento === 'Pago';
            const isDeleting = deletingId === item.id;
            const isReceita = isItemReceita(item);
            const tituloLimpo = item.descricao.replace(/^\[RECEITA\]\s*/i, '');

            return (
              <div
                key={item.id}
                className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800 rounded-2xl p-3.5 transition-all shadow-md group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Badge Receita / Despesa nos ambientes pessoal e negócio */}
                    {currentEnvironment !== 'obra' && (
                      isReceita ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>Receita</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          <TrendingDown className="w-3 h-3 text-rose-400" />
                          <span>Despesa</span>
                        </span>
                      )
                    )}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeStyle(item.categoria)}`}>
                      {item.categoria}
                    </span>

                    {/* Badge Forma de Pagamento */}
                    {item.forma_pagamento && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 uppercase">
                        {formatFormaPagamento(item.forma_pagamento)}
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(item.data_gasto)}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isPago
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {isPago ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{item.status_pagamento}</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white truncate">{tituloLimpo}</h4>

                  {item.observacoes && (
                    <p className="text-xs text-slate-400 line-clamp-1">{item.observacoes}</p>
                  )}
                </div>

                {/* Valor e Ações */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base font-extrabold block ${
                        isReceita ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {isReceita
                        ? `+ ${formatCurrency(item.valor)}`
                        : currentEnvironment !== 'obra'
                        ? `- ${formatCurrency(item.valor)}`
                        : formatCurrency(item.valor)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {item.foto_comprovante_url && (
                      <button
                        onClick={() =>
                          setActiveComprovante({
                            url: item.foto_comprovante_url!,
                            descricao: item.descricao,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver comprovante"
                      >
                        <FileImage className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setEditingExpense(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar lançamento"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      {activeComprovante && (
        <ComprovanteModal
          url={activeComprovante.url}
          descricao={activeComprovante.descricao}
          onClose={() => setActiveComprovante(null)}
        />
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          isOpen={true}
          onClose={() => setEditingExpense(null)}
          onSuccess={(updated) => {
            setDespesas((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
            onExpenseUpdated?.();
          }}
        />
      )}

      {/* Modal Avançado de Exportação de Relatório (PDF / Excel com Período Customizável) */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        allDespesas={despesas}
        currentPeriodFilter={periodFilter}
        workspaceName={currentWorkspace?.nome || (currentEnvironment === 'obra' ? 'Custo de Obra' : currentEnvironment === 'negocio' ? 'Gestão de Negócio' : 'Finanças Pessoais')}
        workspaceType={currentEnvironment}
        userEmail={currentUser.email}
        userName={currentUser.name}
      />

      {/* Modal de Gestão Completa de Categorias (CRUD) */}
      <ManageCategoriesModal
        isOpen={manageCategoriesOpen}
        onClose={() => {
          setManageCategoriesOpen(false);
          fetchDespesas();
        }}
      />
    </div>
  );
};
