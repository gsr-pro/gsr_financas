import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { DespesaRow, CategoriaDespesa } from '../types/app';
import { formatCurrency, formatDate, getCategoryBadgeStyle } from '../lib/formatters';
import { ComprovanteModal } from '../components/ComprovanteModal';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Search, FileImage, Trash2, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';

interface ExpenseListViewProps {
  onNavigateToForm: () => void;
  refreshTrigger?: number;
}

const CATEGORIAS_FILTRO: (CategoriaDespesa | 'Todas')[] = [
  'Todas',
  'Materiais',
  'Mão de Obra',
  'Documentação',
  'Ferramentas',
  'Outros',
];

export const ExpenseListView: React.FC<ExpenseListViewProps> = ({
  onNavigateToForm,
  refreshTrigger,
}) => {
  const [despesas, setDespesas] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaDespesa | 'Todas'>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Comprovante
  const [activeComprovante, setActiveComprovante] = useState<{ url: string; descricao: string } | null>(null);

  // Exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('despesas')
        .select('*')
        .order('data_gasto', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDespesas(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao listar despesas da obra.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas, refreshTrigger]);

  const handleDelete = async (id: string, descricao: string) => {
    if (!window.confirm(`Deseja realmente excluir a despesa "${descricao}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const { error: deleteError } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Remove da lista local
      setDespesas((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir despesa.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtragem combinada em memória para resposta instantânea
  const filteredDespesas = useMemo(() => {
    return despesas.filter((item) => {
      const matchCategoria =
        selectedCategoria === 'Todas' || item.categoria === selectedCategoria;
      const matchSearch =
        searchTerm.trim() === '' ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.observacoes && item.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategoria && matchSearch;
    });
  }, [despesas, selectedCategoria, searchTerm]);

  if (loading) {
    return <ListSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center my-4 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h4 className="text-sm font-bold text-rose-900">Erro ao carregar lista</h4>
        <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
        <button
          onClick={fetchDespesas}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* 1. Barra de Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Chips Horizontais de Categoria */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIAS_FILTRO.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategoria(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategoria === cat
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Indicador de Quantidade e Total Filtrado */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
        <span>
          {filteredDespesas.length} {filteredDespesas.length === 1 ? 'lançamento' : 'lançamentos'}
        </span>
        <span className="font-semibold text-slate-700">
          Total: {formatCurrency(filteredDespesas.reduce((acc, curr) => acc + Number(curr.valor), 0))}
        </span>
      </div>

      {/* 4. Lista de Despesas */}
      {filteredDespesas.length === 0 ? (
        <EmptyState
          title="Nenhuma despesa encontrada"
          description={
            despesas.length === 0
              ? 'Ainda não há lançamentos cadastrados na obra da chácara.'
              : 'Nenhum lançamento corresponde ao filtro ou busca selecionada.'
          }
          actionText={despesas.length === 0 ? 'Fazer Primeiro Lançamento' : 'Limpar Filtros'}
          onAction={
            despesas.length === 0
              ? onNavigateToForm
              : () => {
                  setSelectedCategoria('Todas');
                  setSearchTerm('');
                }
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredDespesas.map((item) => {
            const badgeStyle = getCategoryBadgeStyle(item.categoria);
            const isPago = item.status_pagamento === 'Pago';

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-2"
              >
                {/* Linha 1: Categoria, Data e Botão de Excluir */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                    >
                      {item.categoria}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(item.data_gasto)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {item.foto_comprovante_url && (
                      <button
                        onClick={() =>
                          setActiveComprovante({
                            url: item.foto_comprovante_url as string,
                            descricao: item.descricao,
                          })
                        }
                        title="Ver comprovante"
                        className="p-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <FileImage className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id, item.descricao)}
                      disabled={deletingId === item.id}
                      title="Excluir despesa"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Linha 2: Descrição */}
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {item.descricao}
                </p>

                {item.observacoes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    {item.observacoes}
                  </p>
                )}

                {/* Linha 3: Valor e Status */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    {isPago ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 mr-1 text-amber-600" />
                        Pendente
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Comprovante */}
      {activeComprovante && (
        <ComprovanteModal
          url={activeComprovante.url}
          descricao={activeComprovante.descricao}
          onClose={() => setActiveComprovante(null)}
        />
      )}
    </div>
  );
};
