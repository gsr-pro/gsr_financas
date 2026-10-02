import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  calculateProductPricing,
  UNIDADES_LABELS,
} from '../../config/pricingRules';
import type { UnidadeMedida } from '../../types/business.types';
import { formatCurrency } from '../../lib/formatters';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InsumoFormState {
  id: string;
  nome: string;
  quantidade: number;
  unidade_medida: UnidadeMedida;
  custo_unitario: number;
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [nomeProduto, setNomeProduto] = useState<string>('Meu Novo Produto');
  const [insumos, setInsumos] = useState<InsumoFormState[]>([
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
    field: keyof InsumoFormState,
    value: string | number
  ) => {
    setInsumos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]: field === 'quantidade' || field === 'custo_unitario' ? Number(value) || 0 : value,
        };
      })
    );
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
                Calcule o CMV, mão de obra, markup e o preço de venda ideal para garantir lucro real.
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
        {/* CORPO DO MODAL: ENTRADAS E PREVIEW                                */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Nome do Produto */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nome do Produto ou Serviço
            </label>
            <input
              type="text"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex: Bolo de Cenoura com Ganache, Mesa Rústica 6 Lugares..."
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
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantidade}
                        onChange={(e) => handleUpdateInsumo(item.id, 'quantidade', e.target.value)}
                        placeholder="Qtd"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                        type="number"
                        step="any"
                        min="0"
                        value={item.custo_unitario}
                        onChange={(e) =>
                          handleUpdateInsumo(item.id, 'custo_unitario', e.target.value)
                        }
                        placeholder="R$ / un"
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
                type="number"
                step="0.25"
                min="0"
                value={horasTrabalho}
                onChange={(e) => setHorasTrabalho(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                type="number"
                step="1"
                min="0"
                value={valorHoraMaoObra}
                onChange={(e) => setValorHoraMaoObra(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                type="number"
                step="0.5"
                min="0"
                value={custosFixosRateados}
                onChange={(e) => setCustosFixosRateados(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                Markup Aplicado: {resultado.markupMultiplicador}x
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
                Margem Real de {resultado.margemRealPct}% por unidade vendida
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
                    type="number"
                    min="0"
                    step="100"
                    value={custoFixoMensal}
                    onChange={(e) => setCustoFixoMensal(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-slate-500 text-[11px]">/mês</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Você precisa vender:</span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black font-mono text-sm">
                {resultado.pontoEquilibrioUnidades || 0} unidades/mês
              </span>
            </div>
          </div>

        </div>

        {/* ================================================================= */}
        {/* RODAPÉ DO MODAL                                                   */}
        {/* ================================================================= */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Fórmula profissional de Markup Divisor aplicada.</span>
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
