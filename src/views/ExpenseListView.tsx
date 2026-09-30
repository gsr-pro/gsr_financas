import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import type { DespesaRow } from '../types/app';
import { formatCurrency, formatDate, getCategoryBadgeStyle } from '../lib/formatters';
import { ComprovanteModal } from '../components/ComprovanteModal';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Search, FileImage, Trash2, AlertCircle, CheckCircle2, Clock, X, Pencil } from 'lucide-react';
import { EditExpenseModal } from '../components/EditExpenseModal';

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
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Comprovante e Modal de Edição
  const [activeComprovante, setActiveComprovante] = useState<{ url: string; descricao: string } | null>(null);
  const [editingExpense, setEditingExpense] = useState<DespesaRow | null>(null);

  // Exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const message = err instanceof Error ? err.message : 'Erro ao listar despesas.';
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
      const matchCategoria =
        selectedCategoria === 'Todas' || d.categoria === selectedCategoria;
      const matchSearch =
        d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.observacoes && d.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchCategoria && matchSearch;
    });
  }, [despesas, selectedCategoria, searchTerm]);

  const totalFiltrado = useMemo(() => {
    return filteredDespesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [filteredDespesas]);

  const categoriasFiltro = useMemo(() => {
    return ['Todas', ...categories.map((c) => c.nome)];
  }, [categories]);

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
            Ambiente ativo: <span className="font-semibold text-emerald-400">{currentWorkspace?.nome || (currentEnvironment === 'obra' ? 'Custo de Obra' : 'Finanças Pessoais')}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">Total Filtrado</span>
            <span className="text-sm font-extrabold text-emerald-400">{formatCurrency(totalFiltrado)}</span>
          </div>
        </div>
      </div>

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

        {/* Pílulas de Categoria Horizontais */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
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
            searchTerm || selectedCategoria !== 'Todas'
              ? 'Tente ajustar os filtros de categoria ou o termo de busca.'
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

            return (
              <div
                key={item.id}
                className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800 rounded-2xl p-3.5 transition-all shadow-md group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeStyle(item.categoria)}`}>
                      {item.categoria}
                    </span>
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

                  <h4 className="text-sm font-bold text-white truncate">{item.descricao}</h4>

                  {item.observacoes && (
                    <p className="text-xs text-slate-400 line-clamp-1">{item.observacoes}</p>
                  )}
                </div>

                {/* Valor e Ações */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-extrabold text-white block">
                      {formatCurrency(item.valor)}
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
    </div>
  );
};
