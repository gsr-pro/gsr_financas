import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { EstoqueItemRow, TipoNegocio } from '../../types/business.types';
import { formatCurrency, formatNumber, parseBrazilianNumber } from '../../lib/formatters';
import {
  X,
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  TrendingUp,
  DollarSign,
  Boxes,
  Store,
  Wrench,
  ChefHat,
  Check,
  Loader2,
  Minus,
  Info,
} from 'lucide-react';

interface EstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

import { STOCK_UNITS } from '../../config/businessRules';

const UNIDADES = STOCK_UNITS;

export const EstoqueModal: React.FC<EstoqueModalProps> = ({
  isOpen,
  onClose,
  onStockUpdated,
}) => {
  const { currentWorkspace } = useWorkspace();

  // Itens e Carregamento
  const [itens, setItens] = useState<EstoqueItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Segmento de Negócio (Comércio vs Serviço vs Híbrido)
  const [tipoNegocio, setTipoNegocio] = useState<TipoNegocio>('comercio');

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'critico' | 'zerado'>('todos');

  // Modal interno de Criação/Edição de Item
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<EstoqueItemRow | null>(null);

  // Form State
  const [formNome, setFormNome] = useState<string>('');
  const [formSku, setFormSku] = useState<string>('');
  const [formCategoria, setFormCategoria] = useState<string>('');
  const [formUnidade, setFormUnidade] = useState<string>('un');
  const [formQtd, setFormQtd] = useState<string>('0');
  const [formMin, setFormMin] = useState<string>('5');
  const [formCusto, setFormCusto] = useState<string>('0,00');
  const [formVenda, setFormVenda] = useState<string>('0,00');
  const [formFornecedor, setFormFornecedor] = useState<string>('');
  const [formLocalizacao, setFormLocalizacao] = useState<string>('');
  const [formObs, setFormObs] = useState<string>('');
  const [formTipoNegocio, setFormTipoNegocio] = useState<TipoNegocio>('comercio');

  // Carrega itens do estoque
  const fetchEstoque = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('estoque_itens')
        .select('*')
        .order('nome', { ascending: true });

      if (currentWorkspace?.id && !currentWorkspace.id.startsWith('virtual-')) {
        query = query.or(`workspace_id.eq.${currentWorkspace.id},workspace_id.is.null`);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      setItens((data as EstoqueItemRow[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar itens do estoque.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (isOpen) {
      fetchEstoque();
    }
  }, [isOpen, fetchEstoque]);

  // Carrega configuração de tipo_negocio salva no workspace se houver
  useEffect(() => {
    if (currentWorkspace?.configuracoes && typeof currentWorkspace.configuracoes === 'object') {
      const cfg = currentWorkspace.configuracoes as Record<string, unknown>;
      if (cfg.tipo_negocio === 'comercio' || cfg.tipo_negocio === 'servico' || cfg.tipo_negocio === 'producao') {
        setTipoNegocio(cfg.tipo_negocio as TipoNegocio);
      } else if (cfg.tipo_negocio === 'hibrido') {
        setTipoNegocio('producao');
      }
    }
  }, [currentWorkspace]);

  const handleSelectTipoNegocio = async (tipo: TipoNegocio) => {
    setTipoNegocio(tipo);
    if (currentWorkspace?.id && !currentWorkspace.id.startsWith('virtual-')) {
      try {
        const currentCfg = (currentWorkspace.configuracoes as Record<string, unknown>) || {};
        await supabase
          .from('workspaces')
          .update({
            configuracoes: { ...currentCfg, tipo_negocio: tipo },
          })
          .eq('id', currentWorkspace.id);
      } catch {
        // silencioso
      }
    }
  };

  // Contagem de itens por segmento do negócio
  const contadoresPorSegmento = useMemo(() => {
    return {
      comercio: itens.filter((i) => (i.tipo_negocio || 'comercio') === 'comercio').length,
      servico: itens.filter((i) => i.tipo_negocio === 'servico').length,
      producao: itens.filter((i) => i.tipo_negocio === 'producao').length,
    };
  }, [itens]);

  // Itens isolados estritamente pelo segmento ativo
  const itensDoSegmento = useMemo(() => {
    return itens.filter((item) => (item.tipo_negocio || 'comercio') === tipoNegocio);
  }, [itens, tipoNegocio]);

  // Métricas Consolidadas do Segmento Ativo
  const metricas = useMemo(() => {
    let valorCustoTotal = 0;
    let valorVendaTotal = 0;
    let itensCriticos = 0;
    let itensZerados = 0;

    for (const item of itensDoSegmento) {
      const qtd = Number(item.quantidade_atual) || 0;
      const custo = Number(item.custo_unitario) || 0;
      const venda = Number(item.preco_venda) || 0;
      const min = Number(item.estoque_minimo) || 0;

      valorCustoTotal += qtd * custo;
      valorVendaTotal += qtd * venda;

      if (qtd <= 0) {
        itensZerados++;
      } else if (qtd <= min) {
        itensCriticos++;
      }
    }

    const margemMedia =
      valorVendaTotal > 0
        ? ((valorVendaTotal - valorCustoTotal) / valorVendaTotal) * 100
        : 0;

    return {
      totalItens: itensDoSegmento.length,
      valorCustoTotal,
      valorVendaTotal,
      lucroProjetado: valorVendaTotal - valorCustoTotal,
      margemMedia,
      itensCriticos,
      itensZerados,
    };
  }, [itensDoSegmento]);

  // Itens filtrados do segmento ativo
  const filteredItens = useMemo(() => {
    return itensDoSegmento.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        item.nome.toLowerCase().includes(term) ||
        (item.sku && item.sku.toLowerCase().includes(term)) ||
        (item.fornecedor && item.fornecedor.toLowerCase().includes(term)) ||
        (item.categoria && item.categoria.toLowerCase().includes(term));

      const qtd = Number(item.quantidade_atual) || 0;
      const min = Number(item.estoque_minimo) || 0;

      let matchStatus = true;
      if (filterStatus === 'critico') {
        matchStatus = qtd <= min && qtd > 0;
      } else if (filterStatus === 'zerado') {
        matchStatus = qtd <= 0;
      }

      return matchSearch && matchStatus;
    });
  }, [itensDoSegmento, searchTerm, filterStatus]);

  // Abertura do Formulário de Criação/Edição
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormNome('');
    setFormSku('');
    setFormCategoria(
      tipoNegocio === 'producao'
        ? 'Matéria-Prima / Insumo'
        : tipoNegocio === 'servico'
        ? 'Peça / Insumo Operacional'
        : 'Mercadoria para Revenda'
    );
    setFormUnidade('un');
    setFormQtd('1');
    setFormMin('5');
    setFormCusto('0,00');
    setFormVenda('0,00');
    setFormFornecedor('');
    setFormLocalizacao('');
    setFormObs('');
    setFormTipoNegocio(tipoNegocio);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: EstoqueItemRow) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormSku(item.sku || '');
    setFormCategoria(item.categoria || '');
    setFormUnidade(item.unidade_medida || 'un');
    setFormQtd(String(item.quantidade_atual));
    setFormMin(String(item.estoque_minimo));
    setFormCusto(formatNumber(item.custo_unitario, 2, 2));
    setFormVenda(formatNumber(item.preco_venda, 2, 2));
    setFormFornecedor(item.fornecedor || '');
    setFormLocalizacao(item.localizacao || '');
    setFormObs(item.observacoes || '');
    setFormTipoNegocio((item.tipo_negocio as TipoNegocio) || 'comercio');
    setIsFormOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      alert('Por favor, informe o nome do item.');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const qtd = parseBrazilianNumber(formQtd);
      const min = parseBrazilianNumber(formMin);
      const custo = parseBrazilianNumber(formCusto);
      const venda = parseBrazilianNumber(formVenda);

      const payload = {
        user_id: user.id,
        workspace_id: currentWorkspace?.id && !currentWorkspace.id.startsWith('virtual-') ? currentWorkspace.id : null,
        nome: formNome.trim(),
        sku: formSku.trim() || null,
        categoria: formCategoria.trim() || null,
        unidade_medida: formUnidade,
        quantidade_atual: qtd,
        estoque_minimo: min,
        custo_unitario: custo,
        preco_venda: venda,
        fornecedor: formFornecedor.trim() || null,
        localizacao: formLocalizacao.trim() || null,
        observacoes: formObs.trim() || null,
        tipo_negocio: formTipoNegocio,
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        const { error: updErr } = await supabase
          .from('estoque_itens')
          .update(payload)
          .eq('id', editingItem.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('estoque_itens')
          .insert(payload);
        if (insErr) throw insErr;
      }

      setIsFormOpen(false);
      await fetchEstoque();
      onStockUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar item.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // Ajuste rápido de quantidade (+ ou -)
  const handleQuickAdjust = async (item: EstoqueItemRow, delta: number) => {
    const novaQtd = Math.max(0, Number(item.quantidade_atual) + delta);
    try {
      const { error: updErr } = await supabase
        .from('estoque_itens')
        .update({
          quantidade_atual: novaQtd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (updErr) throw updErr;

      setItens((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantidade_atual: novaQtd } : i))
      );
      onStockUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ajustar estoque.';
      alert(msg);
    }
  };

  // Exclusão
  const handleDeleteItem = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir o item "${nome}" do estoque?`)) {
      return;
    }
    try {
      const { error: delErr } = await supabase
        .from('estoque_itens')
        .delete()
        .eq('id', id);
      if (delErr) throw delErr;

      setItens((prev) => prev.filter((i) => i.id !== id));
      onStockUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir item.';
      alert(msg);
    }
  };

  // Cálculo de Margem em tempo real no formulário
  const previewCusto = parseBrazilianNumber(formCusto);
  const previewVenda = parseBrazilianNumber(formVenda);
  const previewLucro = previewVenda - previewCusto;
  const previewMargem = previewVenda > 0 ? (previewLucro / previewVenda) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* 1. Header Superior com Destaque e Seletor de Modelo */}
        <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-lg shadow-indigo-500/10">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Controle de Estoque & Mercadorias
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 uppercase">
                  PME & Negócio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Valoração patrimonial, reposição de estoque e gestão de insumos para Comércio, Serviços e Produção.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Seletor de Modelo do Negócio */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => handleSelectTipoNegocio('comercio')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  tipoNegocio === 'comercio'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Comércio: foco em mercadorias para revenda e giro de estoque"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Comércio ({contadoresPorSegmento.comercio})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipoNegocio('servico')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  tipoNegocio === 'servico'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Serviços: foco em peças, ferramentas e insumos para prestação de serviços"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Serviço ({contadoresPorSegmento.servico})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipoNegocio('producao')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  tipoNegocio === 'producao'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Produção / Insumos: matéria-prima e ingredientes para confecção própria (ex: hambúrguer artesanal, doces, manufatura)"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Produção ({contadoresPorSegmento.producao})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Painel de Indicadores de Estoque */}
        <div
          className={`grid ${
            tipoNegocio === 'comercio' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
          } gap-3 p-4 sm:p-6 bg-slate-950/40 border-b border-slate-800 flex-shrink-0`}
        >
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block flex items-center space-x-1.5">
              <Boxes className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {tipoNegocio === 'producao'
                  ? 'Insumos & Ingredientes'
                  : tipoNegocio === 'servico'
                  ? 'Peças & Materiais'
                  : 'Itens Cadastrados'}
              </span>
            </span>
            <span className="text-lg font-black text-white font-mono block">
              {metricas.totalItens}{' '}
              <span className="text-xs text-slate-500 font-normal">
                {tipoNegocio === 'producao'
                  ? 'insumos'
                  : tipoNegocio === 'servico'
                  ? 'materiais'
                  : 'produtos'}
              </span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {tipoNegocio === 'producao'
                  ? 'Custo em Insumos'
                  : tipoNegocio === 'servico'
                  ? 'Custo em Peças/Insumos'
                  : 'Custo Imobilizado'}
              </span>
            </span>
            <span className="text-lg font-black text-indigo-400 font-mono block">
              {formatCurrency(metricas.valorCustoTotal)}
            </span>
          </div>

          {/* Potencial de Venda exclusivo para Comércio de Revenda (Oculto em Serviço e Produção) */}
          {tipoNegocio === 'comercio' && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Potencial de Venda</span>
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono block">
                {formatCurrency(metricas.valorVendaTotal)}
              </span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Reposição Necessária</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-black font-mono ${metricas.itensCriticos + metricas.itensZerados > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {metricas.itensCriticos + metricas.itensZerados}
              </span>
              {(metricas.itensCriticos > 0 || metricas.itensZerados > 0) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {metricas.itensZerados > 0 ? `${metricas.itensZerados} zerados` : 'abaixo do mín'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Barra de Ações: Busca, Filtros de Status e Botão Novo */}
        <div className="p-4 sm:px-6 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, SKU, fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === 'todos'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({itensDoSegmento.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('critico')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === 'critico'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Baixo Estoque ({metricas.itensCriticos})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('zerado')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === 'zerado'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Zerados ({metricas.itensZerados})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {tipoNegocio === 'producao'
                ? 'Novo Insumo / Matéria-Prima'
                : tipoNegocio === 'servico'
                ? 'Nova Peça / Insumo'
                : 'Novo Item de Estoque'}
            </span>
          </button>
        </div>

        {/* 4. Lista / Tabela de Itens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 min-h-[220px]">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Carregando catálogo de estoque...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-300 text-xs space-y-2">
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchEstoque}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredItens.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <Package className="w-12 h-12 text-slate-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">
                  {searchTerm || filterStatus !== 'todos'
                    ? 'Nenhum item encontrado com os filtros aplicados'
                    : `Nenhum item cadastrado em ${
                        tipoNegocio === 'producao'
                          ? 'Produção / Insumos'
                          : tipoNegocio === 'servico'
                          ? 'Serviços'
                          : 'Comércio'
                      }`}
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  {searchTerm || filterStatus !== 'todos'
                    ? 'Tente ajustar sua busca ou limpar os filtros de status.'
                    : tipoNegocio === 'producao'
                    ? 'Cadastre ingredientes e matérias-primas (ex: carne moída, pães, molhos) para controlar ponto de reposição e custos de produção.'
                    : tipoNegocio === 'servico'
                    ? 'Cadastre ferramentas, peças sobressalentes e insumos operacionais utilizados na execução dos seus serviços.'
                    : 'Cadastre suas mercadorias acabadas para revenda para monitorar estoque mínimo, giro e margem de lucro.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {tipoNegocio === 'producao'
                    ? 'Cadastrar Primeiro Insumo'
                    : tipoNegocio === 'servico'
                    ? 'Cadastrar Primeira Peça'
                    : 'Cadastrar Primeiro Item'}
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredItens.map((item) => {
                const qtd = Number(item.quantidade_atual) || 0;
                const min = Number(item.estoque_minimo) || 0;
                const custo = Number(item.custo_unitario) || 0;
                const venda = Number(item.preco_venda) || 0;
                const isZerado = qtd <= 0;
                const isCritico = qtd > 0 && qtd <= min;
                const margemItem = venda > 0 ? ((venda - custo) / venda) * 100 : 0;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    {/* Informações Principais */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isZerado ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Esgotado</span>
                          </span>
                        ) : isCritico ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Reposição ({qtd} / mín {min})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Em Estoque</span>
                          </span>
                        )}

                        {item.categoria && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                            {item.categoria}
                          </span>
                        )}

                        {item.sku && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{item.nome}</h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                        <span>
                          Custo:{' '}
                          <strong className="text-slate-300 font-mono">
                            {formatCurrency(custo)}
                          </strong>
                        </span>
                        {tipoNegocio === 'comercio' ? (
                          <>
                            <span>
                              Venda:{' '}
                              <strong className="text-emerald-400 font-mono">
                                {formatCurrency(venda)}
                              </strong>
                            </span>
                            {venda > 0 && (
                              <span className="text-slate-400">
                                Margem:{' '}
                                <span
                                  className={`font-semibold font-mono ${
                                    margemItem >= 30 ? 'text-emerald-400' : 'text-amber-400'
                                  }`}
                                >
                                  {formatNumber(margemItem, 1, 1)}%
                                </span>
                              </span>
                            )}
                          </>
                        ) : tipoNegocio === 'producao' ? (
                          <span className="text-slate-400">
                            {venda > 0 ? (
                              <>
                                Ref. Venda:{' '}
                                <strong className="text-slate-300 font-mono">
                                  {formatCurrency(venda)}
                                </strong>
                              </>
                            ) : (
                              <span className="text-amber-400/90 font-medium">Insumo / Matéria-Prima</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {venda > 0 ? (
                              <>
                                Repasse:{' '}
                                <strong className="text-slate-300 font-mono">
                                  {formatCurrency(venda)}
                                </strong>
                              </>
                            ) : (
                              <span className="text-slate-500 italic">Insumo / Peça Operacional</span>
                            )}
                          </span>
                        )}
                        {item.fornecedor && (
                          <span className="text-slate-500">Fornec: {item.fornecedor}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantidade e Ajustes Rápidos */}
                    <div className="flex items-center justify-between md:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, -1)}
                          disabled={qtd <= 0}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 flex items-center justify-center transition-colors"
                          title="Baixa de 1 unidade (Venda/Uso)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="px-2 text-center min-w-[50px]">
                          <span className="text-sm font-extrabold text-white font-mono block">
                            {qtd}
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase font-mono block">
                            {item.unidade_medida}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                          title="Entrada de 1 unidade (Reposição)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Ações de Edição e Exclusão */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Editar item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.nome)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Excluir item"
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
        </div>

        {/* 5. Submodal / Painel de Cadastro e Edição */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4">
              <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {editingItem ? 'Editar Item de Estoque' : 'Cadastrar Item no Estoque'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Seleção do Segmento de Destino do Item */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Área / Segmento do Item
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormTipoNegocio('comercio');
                        if (!editingItem) setFormCategoria('Mercadoria para Revenda');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        formTipoNegocio === 'comercio'
                          ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Comércio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormTipoNegocio('servico');
                        if (!editingItem) setFormCategoria('Peça / Insumo Operacional');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        formTipoNegocio === 'servico'
                          ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Serviço</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormTipoNegocio('producao');
                        if (!editingItem) setFormCategoria('Matéria-Prima / Insumo');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        formTipoNegocio === 'producao'
                          ? 'bg-amber-600/25 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Produção</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {formTipoNegocio === 'producao'
                      ? 'Nome do Insumo / Matéria-Prima *'
                      : formTipoNegocio === 'servico'
                      ? 'Nome da Peça / Insumo Operacional *'
                      : 'Nome do Item / Produto *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formTipoNegocio === 'producao'
                        ? 'Ex: Blend de Carne 180g, Pão Brioche, Queijo Cheddar, Embalagem Kraft...'
                        : formTipoNegocio === 'servico'
                        ? 'Ex: Óleo Motor 5W30, Pastilha de Freio, Broca Aço Rápido...'
                        : 'Ex: Camiseta Algodão, Fone Bluetooth, Garrafa Térmica...'
                    }
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Código / SKU (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: PROD-001"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Unidade de Medida
                    </label>
                    <select
                      value={formUnidade}
                      onChange={(e) => setFormUnidade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {UNIDADES.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Quantidade Atual *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={formQtd}
                      onChange={(e) => setFormQtd(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                      <span>Estoque Mínimo</span>
                      <span title="Gera aviso de reposição quando a quantidade estiver igual ou menor a este valor." className="cursor-help inline-flex">
                        <Info className="w-3 h-3 text-slate-500" />
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="5"
                      value={formMin}
                      onChange={(e) => setFormMin(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Custo Unitário (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={formCusto}
                      onChange={(e) => setFormCusto(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {formTipoNegocio === 'comercio'
                        ? 'Preço de Venda (R$)'
                        : formTipoNegocio === 'producao'
                        ? 'Preço de Venda / Ref. (R$ - opcional)'
                        : 'Preço de Repasse (R$ - opcional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={formVenda}
                      onChange={(e) => setFormVenda(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {/* Card de Simulação de Margem em Tempo Real (Exclusivo para Comércio de Revenda Direta) */}
                {previewVenda > 0 && formTipoNegocio === 'comercio' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Lucro Bruto Unitário</span>
                      <span className={`font-mono font-bold ${previewLucro >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(previewLucro)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Margem Bruta</span>
                      <span className={`font-mono font-bold ${previewMargem >= 30 ? 'text-emerald-400' : previewMargem >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {formatNumber(previewMargem, 1, 1)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Categoria / Grupo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Revenda, Peça, Embalagem"
                      value={formCategoria}
                      onChange={(e) => setFormCategoria(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Fornecedor (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Distribuidora ABC"
                      value={formFornecedor}
                      onChange={(e) => setFormFornecedor(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar Item</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
