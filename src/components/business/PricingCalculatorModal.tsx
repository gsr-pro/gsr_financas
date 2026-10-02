import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  DollarSign,
  TrendingUp,
  Scale,
  Sparkles,
  Info,
  Clock,
  Layers,
  Package,
  Save,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Check,
  Copy,
} from 'lucide-react';
import {
  calculateProductPricing,
  UNIDADES_LABELS,
} from '../../config/pricingRules';
import type {
  SimulacaoPrecificacaoSalva,
  InsumoSimulacaoState,
} from '../../types/business.types';
import type { Json } from '../../types/database.types';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  parseBrazilianNumber,
} from '../../lib/formatters';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase } from '../../lib/supabaseClient';
import {
  exportPricingReportPDF,
  exportPricingReportExcel,
} from '../../lib/exportReports';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentWorkspace, updateWorkspace } = useWorkspace();

  // Estados dos formulários de simulação
  const [nomeProduto, setNomeProduto] = useState<string>('Meu Novo Produto');
  const [insumos, setInsumos] = useState<InsumoSimulacaoState[]>([
    {
      id: 'ins-1',
      nome: 'Matéria-Prima Principal (Ex: Farinha/Madeira/Tecido)',
      quantidade: 1,
      unidade_medida: 'kg',
      custo_unitario: 10,
    },
    {
      id: 'ins-2',
      nome: 'Ingrediente/Acessório Secundário',
      quantidade: 2,
      unidade_medida: 'un',
      custo_unitario: 2.5,
    },
  ]);

  const [horasTrabalho, setHorasTrabalho] = useState<number>(1);
  const [valorHoraMaoObra, setValorHoraMaoObra] = useState<number>(25);
  const [custosFixosRateados, setCustosFixosRateados] = useState<number>(5);
  const [margemDesejada, setMargemDesejada] = useState<number>(40);
  const [custoFixoMensal, setCustoFixoMensal] = useState<number>(2000);

  // Estados de persistência e gerenciamento de simulações
  const [selectedSimulacaoId, setSelectedSimulacaoId] = useState<string | null>(null);
  const [simulacoesSalvas, setSimulacoesSalvas] = useState<SimulacaoPrecificacaoSalva[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name?: string | null; email?: string | null }>({});

  // Carrega informações do usuário logado para emissão dos relatórios
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserInfo({
          name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null,
          email: user.email || null,
        });
      }
    });
  }, []);

  // Carrega a lista de simulações do workspace atual ou do localStorage
  useEffect(() => {
    if (!isOpen) return;

    if (currentWorkspace) {
      const config = (currentWorkspace.configuracoes as Record<string, unknown>) || {};
      let lista: SimulacaoPrecificacaoSalva[] = [];

      if (Array.isArray(config.simulacoes_precificacao)) {
        lista = config.simulacoes_precificacao as SimulacaoPrecificacaoSalva[];
      } else {
        // Fallback para localStorage
        try {
          const local = localStorage.getItem(`gsr_simulacoes_precificacao_${currentWorkspace.id}`);
          if (local) {
            const parsed = JSON.parse(local) as SimulacaoPrecificacaoSalva[];
            if (Array.isArray(parsed)) {
              lista = parsed;
            }
          }
        } catch (e) {
          console.warn('Erro ao ler simulações salvas no localStorage', e);
        }
      }

      setSimulacoesSalvas(lista);
    }
  }, [isOpen, currentWorkspace]);

  // Função interna para persistir tanto no workspace Supabase quanto no localStorage
  const persistSimulacoes = useCallback(
    async (novaLista: SimulacaoPrecificacaoSalva[]) => {
      if (!currentWorkspace) return;

      // 1. Grava no localStorage imediatamente
      try {
        localStorage.setItem(
          `gsr_simulacoes_precificacao_${currentWorkspace.id}`,
          JSON.stringify(novaLista)
        );
      } catch (e) {
        console.warn('Erro ao salvar no localStorage:', e);
      }

      // 2. Grava no banco de dados Supabase via WorkspaceContext
      try {
        const rawConfig = (currentWorkspace.configuracoes as Record<string, unknown>) || {};
        const updatedConfig = {
          ...rawConfig,
          simulacoes_precificacao: novaLista,
        };
        await updateWorkspace(currentWorkspace.id, {
          configuracoes: updatedConfig as unknown as Json,
        });
      } catch (err) {
        console.error('Erro ao sincronizar simulação no Supabase:', err);
      }
    },
    [currentWorkspace, updateWorkspace]
  );

  // Adicionar novo insumo à lista
  const handleAddInsumo = () => {
    const newId = `ins-${Date.now()}`;
    setInsumos((prev) => [
      ...prev,
      {
        id: newId,
        nome: '',
        quantidade: 1,
        unidade_medida: 'un',
        custo_unitario: 0,
      },
    ]);
  };

  // Remover insumo
  const handleRemoveInsumo = (id: string) => {
    setInsumos((prev) => prev.filter((item) => item.id !== id));
  };

  // Atualizar campo de insumo
  const handleUpdateInsumo = (
    id: string,
    field: keyof InsumoSimulacaoState,
    value: string | number
  ) => {
    setInsumos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]:
            field === 'quantidade' || field === 'custo_unitario'
              ? typeof value === 'string'
                ? parseBrazilianNumber(value)
                : Number(value) || 0
              : value,
        };
      })
    );
  };

  // Carregar / Selecionar simulação salva
  const handleSelectSimulacao = (id: string) => {
    if (!id) {
      // Nova simulação do zero
      setSelectedSimulacaoId(null);
      setNomeProduto('Meu Novo Produto');
      setInsumos([
        {
          id: `ins-${Date.now()}`,
          nome: '',
          quantidade: 1,
          unidade_medida: 'un',
          custo_unitario: 0,
        },
      ]);
      setHorasTrabalho(1);
      setValorHoraMaoObra(25);
      setCustosFixosRateados(5);
      setMargemDesejada(40);
      setCustoFixoMensal(2000);
      return;
    }

    const sim = simulacoesSalvas.find((item) => item.id === id);
    if (sim) {
      setSelectedSimulacaoId(sim.id);
      setNomeProduto(sim.nome);
      setInsumos(
        sim.insumos && sim.insumos.length > 0
          ? sim.insumos
          : [
              {
                id: `ins-${Date.now()}`,
                nome: '',
                quantidade: 1,
                unidade_medida: 'un',
                custo_unitario: 0,
              },
            ]
      );
      setHorasTrabalho(sim.horasTrabalho ?? 1);
      setValorHoraMaoObra(sim.valorHoraMaoObra ?? 25);
      setCustosFixosRateados(sim.custosFixosRateados ?? 5);
      setMargemDesejada(sim.margemDesejada ?? 40);
      setCustoFixoMensal(sim.custoFixoMensal ?? 2000);

      setSaveSuccessMsg(`Simulação "${sim.nome}" carregada!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Salvar Simulação (cria ou atualiza)
  const handleSaveSimulacao = async (asNew: boolean = false) => {
    const nomeLimpo = nomeProduto.trim();
    if (!nomeLimpo) {
      alert('Por favor, informe o nome do produto ou serviço.');
      return;
    }

    setIsSaving(true);
    try {
      const targetId = asNew || !selectedSimulacaoId ? `sim-${Date.now()}` : selectedSimulacaoId;
      const targetNome = asNew && selectedSimulacaoId ? `${nomeLimpo} (Cópia)` : nomeLimpo;

      const itemSalvo: SimulacaoPrecificacaoSalva = {
        id: targetId,
        nome: targetNome,
        insumos,
        horasTrabalho,
        valorHoraMaoObra,
        custosFixosRateados,
        margemDesejada,
        custoFixoMensal,
        updated_at: new Date().toISOString(),
      };

      let novaLista: SimulacaoPrecificacaoSalva[];
      const jaExiste = simulacoesSalvas.some((s) => s.id === targetId);

      if (jaExiste) {
        novaLista = simulacoesSalvas.map((s) => (s.id === targetId ? itemSalvo : s));
      } else {
        novaLista = [itemSalvo, ...simulacoesSalvas];
      }

      setSimulacoesSalvas(novaLista);
      setSelectedSimulacaoId(targetId);
      if (asNew) setNomeProduto(targetNome);

      await persistSimulacoes(novaLista);

      setSaveSuccessMsg(asNew ? 'Nova simulação criada com sucesso!' : 'Simulação salva com sucesso!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao salvar simulação:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir simulação salva
  const handleDeleteSimulacao = async (id: string) => {
    const sim = simulacoesSalvas.find((s) => s.id === id);
    if (!sim) return;

    if (window.confirm(`Deseja excluir a simulação salva "${sim.nome}"?`)) {
      const novaLista = simulacoesSalvas.filter((s) => s.id !== id);
      setSimulacoesSalvas(novaLista);
      if (selectedSimulacaoId === id) {
        setSelectedSimulacaoId(null);
      }
      await persistSimulacoes(novaLista);
      setSaveSuccessMsg(`Simulação "${sim.nome}" excluída.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Executa o motor de cálculo puro
  const resultado = useMemo(() => {
    const formattedInsumos = insumos.map((i) => ({
      insumo_id: i.id,
      nome: i.nome || 'Insumo sem nome',
      quantidade: i.quantidade,
      unidade_medida: i.unidade_medida,
      custo_unitario: i.custo_unitario,
    }));

    return calculateProductPricing({
      nome: nomeProduto,
      insumos: formattedInsumos,
      horasTrabalho,
      valorHoraMaoObra,
      custosFixosRateados,
      margemLucroDesejadaPct: margemDesejada,
      custoFixoMensalTotal: custoFixoMensal,
    });
  }, [
    nomeProduto,
    insumos,
    horasTrabalho,
    valorHoraMaoObra,
    custosFixosRateados,
    margemDesejada,
    custoFixoMensal,
  ]);

  // Exportar Relatório PDF
  const handleExportPDF = () => {
    exportPricingReportPDF({
      nomeProduto: nomeProduto.trim() || 'Meu Produto',
      workspaceName: currentWorkspace?.nome || 'Minha Empresa',
      userName: userInfo.name,
      userEmail: userInfo.email,
      insumos,
      custoInsumos: resultado.custoInsumos,
      horasTrabalho,
      valorHoraMaoObra,
      custoMaoObra: resultado.custoMaoObra,
      custosFixosRateados,
      custoTotalProducao: resultado.custoTotalProducao,
      margemLucroDesejadaPct: margemDesejada,
      precoVendaSugerido: resultado.precoVendaSugerido,
      lucroBrutoUnitario: resultado.lucroBrutoUnitario,
      markupMultiplicador: resultado.markupMultiplicador,
      margemRealPct: resultado.margemRealPct,
      custoFixoMensalTotal: custoFixoMensal,
      pontoEquilibrioUnidades: resultado.pontoEquilibrioUnidades ?? 0,
    });
  };

  // Exportar Relatório Excel
  const handleExportExcel = () => {
    exportPricingReportExcel({
      nomeProduto: nomeProduto.trim() || 'Meu Produto',
      workspaceName: currentWorkspace?.nome || 'Minha Empresa',
      userName: userInfo.name,
      userEmail: userInfo.email,
      insumos,
      custoInsumos: resultado.custoInsumos,
      horasTrabalho,
      valorHoraMaoObra,
      custoMaoObra: resultado.custoMaoObra,
      custosFixosRateados,
      custoTotalProducao: resultado.custoTotalProducao,
      margemLucroDesejadaPct: margemDesejada,
      precoVendaSugerido: resultado.precoVendaSugerido,
      lucroBrutoUnitario: resultado.lucroBrutoUnitario,
      markupMultiplicador: resultado.markupMultiplicador,
      margemRealPct: resultado.margemRealPct,
      custoFixoMensalTotal: custoFixoMensal,
      pontoEquilibrioUnidades: resultado.pontoEquilibrioUnidades ?? 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* ================================================================= */}
        {/* CABEÇALHO DO MODAL                                                */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Calculadora de Precificação & Ficha Técnica
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                  Módulo Negócio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calcule o CMV, mão de obra, markup divisor e preço ideal para garantir lucro real.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Fechar calculadora"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* BARRA DE GERENCIAMENTO DE SIMULAÇÕES SALVAS                        */}
        {/* ================================================================= */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
            <FolderOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">
              Simulação:
            </span>
            <select
              value={selectedSimulacaoId || ''}
              onChange={(e) => handleSelectSimulacao(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 flex-1 max-w-xs cursor-pointer font-medium"
            >
              <option value="">+ Nova Simulação (Em branco)</option>
              {simulacoesSalvas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({new Date(s.updated_at).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>

            {selectedSimulacaoId && (
              <button
                type="button"
                onClick={() => handleDeleteSimulacao(selectedSimulacaoId)}
                title="Excluir esta simulação salva"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {saveSuccessMsg && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1 animate-fade-in bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Check className="w-3 h-3" />
                <span>{saveSuccessMsg}</span>
              </span>
            )}

            {selectedSimulacaoId && (
              <button
                type="button"
                onClick={() => handleSaveSimulacao(true)}
                disabled={isSaving}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
                title="Duplicar e salvar como nova cópia"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Salvar como Nova</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveSimulacao(false)}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{selectedSimulacaoId ? 'Salvar Alterações' : 'Salvar Simulação'}</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CORPO DO MODAL: ENTRADAS E PREVIEW                                */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Nome do Produto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Nome do Produto ou Serviço
              </label>
              {selectedSimulacaoId ? (
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                  Simulação Carregada
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">
                  Nova Simulação (Não salva)
                </span>
              )}
            </div>
            <input
              type="text"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex: Bolo de Cenoura com Ganache, Mesa Rústica 6 Lugares, Consultoria..."
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
            />
          </div>

          {/* 2. Seção de Insumos & Matérias-Primas (Ficha Técnica) */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Insumos & Matérias-Primas por Unidade
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddInsumo}
                className="px-2.5 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Insumo</span>
              </button>
            </div>

            {/* Lista de Insumos */}
            <div className="space-y-2">
              {insumos.map((item, index) => {
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-800"
                  >
                    {/* Nome do Insumo */}
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        value={item.nome}
                        onChange={(e) => handleUpdateInsumo(item.id, 'nome', e.target.value)}
                        placeholder={`Insumo #${index + 1}`}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>

                    {/* Quantidade */}
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.quantidade ? String(item.quantidade).replace('.', ',') : ''}
                        onChange={(e) => handleUpdateInsumo(item.id, 'quantidade', e.target.value)}
                        placeholder="Qtd"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                      />
                    </div>

                    {/* Unidade */}
                    <div className="col-span-4 sm:col-span-2">
                      <select
                        value={item.unidade_medida}
                        onChange={(e) =>
                          handleUpdateInsumo(item.id, 'unidade_medida', e.target.value)
                        }
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {Object.entries(UNIDADES_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custo Unitário */}
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.custo_unitario ? String(item.custo_unitario).replace('.', ',') : ''}
                        onChange={(e) =>
                          handleUpdateInsumo(item.id, 'custo_unitario', e.target.value)
                        }
                        placeholder="0,00"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>

                    {/* Botão Remover */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveInsumo(item.id)}
                        disabled={insumos.length <= 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30"
                        title="Remover insumo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total dos Insumos (CMV) */}
            <div className="flex justify-between items-center pt-2 px-1 text-xs">
              <span className="text-slate-400">Total Matéria-Prima (CMV):</span>
              <span className="font-extrabold text-white font-mono">
                {formatCurrency(resultado.custoInsumos)}
              </span>
            </div>
          </div>

          {/* 3. Mão de Obra e Custos Fixos Rateados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            {/* Horas de Produção */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horas de Mão de Obra</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={horasTrabalho ? String(horasTrabalho).replace('.', ',') : ''}
                onChange={(e) => setHorasTrabalho(parseBrazilianNumber(e.target.value))}
                placeholder="1"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Tempo gasto por unidade</span>
            </div>

            {/* Valor da Hora de Trabalho */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Valor da Sua Hora (R$)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={valorHoraMaoObra ? String(valorHoraMaoObra).replace('.', ',') : ''}
                onChange={(e) => setValorHoraMaoObra(parseBrazilianNumber(e.target.value))}
                placeholder="25,00"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Total Mão de Obra: {formatCurrency(resultado.custoMaoObra)}
              </span>
            </div>

            {/* Custos Indiretos / Embalagem / Energia */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Custos Fixos Rateados (R$)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={custosFixosRateados ? String(custosFixosRateados).replace('.', ',') : ''}
                onChange={(e) => setCustosFixosRateados(parseBrazilianNumber(e.target.value))}
                placeholder="0,00"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Embalagem, gás, energia, taxas</span>
            </div>
          </div>

          {/* 4. Margem de Lucro Desejada (Markup Base Divisor) */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Margem de Lucro Líquida Desejada (%)</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Porcentagem do faturamento que fica limpo de lucro após pagar todos os custos.
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {margemDesejada}%
                </span>
              </div>
            </div>

            {/* Slider de Margem */}
            <input
              type="range"
              min="5"
              max="80"
              step="1"
              value={margemDesejada}
              onChange={(e) => setMargemDesejada(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            {/* Botões Rápidos de Margem */}
            <div className="flex items-center space-x-2 pt-1">
              {[20, 30, 40, 50, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMargemDesejada(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    margemDesejada === m
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* =============================================================== */}
          {/* 5. PAINEL DE RESULTADO EXECUTIVO (CARDS NEON)                    */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            {/* Card 1: Custo Total de Produção */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                Custo de Produção (CMV)
              </span>
              <p className="text-xl font-black text-rose-400 font-mono">
                {formatCurrency(resultado.custoTotalProducao)}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Insumos + Mão de Obra + Fixos
              </p>
            </div>

            {/* Card 2: Preço de Venda Sugerido (EM DESTAQUE) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 space-y-1 relative overflow-hidden shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block font-bold">
                  Preço Sugerido de Venda
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(resultado.precoVendaSugerido)}
              </p>
              <p className="text-[10px] text-emerald-300/80 leading-tight">
                Markup Aplicado: {formatNumber(resultado.markupMultiplicador, 2, 2)}x
              </p>
            </div>

            {/* Card 3: Lucro Líquido por Venda */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                Lucro Líquido Unitário
              </span>
              <p className="text-xl font-black text-cyan-400 font-mono">
                +{formatCurrency(resultado.lucroBrutoUnitario)}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Margem Real de {formatPercent(resultado.margemRealPct, 1)} por unidade vendida
              </p>
            </div>
          </div>

          {/* 6. Ponto de Equilíbrio (Break-Even) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Scale className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Ponto de Equilíbrio (Break-Even)</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-slate-400 text-[11px]">Custos fixos da empresa: R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={custoFixoMensal ? String(custoFixoMensal).replace('.', ',') : ''}
                    onChange={(e) => setCustoFixoMensal(parseBrazilianNumber(e.target.value))}
                    placeholder="2000,00"
                    className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-slate-500 text-[11px]">/mês</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Você precisa vender:</span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black font-mono text-sm">
                {formatNumber(resultado.pontoEquilibrioUnidades || 0, 0, 0)} unidades/mês
              </span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 7. QUADRO DE EXPORTAÇÃO DE RELATÓRIOS EXECUTIVOS                 */}
          {/* =============================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 border border-slate-800 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Exportar Relatório da Simulação
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Gere um dossiê executivo completo com a Ficha Técnica de insumos, análise de custos, metodologia de Markup e meta de Ponto de Equilíbrio (Break-Even).
                </p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Baixar Relatório Executivo em PDF com explicações completas"
                >
                  <FileText className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Exportar dados e insumos para planilha Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Planilha Excel</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ================================================================= */}
        {/* RODAPÉ DO MODAL                                                   */}
        {/* ================================================================= */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="hidden sm:inline">Metodologia profissional de Markup Divisor aplicada: PV = Custo / (1 - Margem).</span>
            <span className="sm:hidden">Markup Divisor aplicado.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-500/20"
          >
            Concluir Simulação
          </button>
        </div>

      </div>
    </div>
  );
};
