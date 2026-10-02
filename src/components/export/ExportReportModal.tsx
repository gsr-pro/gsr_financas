import React, { useState, useMemo } from 'react';
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  Calendar,
  X,
} from 'lucide-react';
import type { DespesaRow } from '../../types/app';
import type { PeriodFilterValue } from '../PeriodFilter';
import { exportToPDF, exportToExcel, type ExportReportOptions } from '../../lib/exportReports';
import { formatCurrency, formatDate } from '../../lib/formatters';

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDespesas: DespesaRow[];
  currentPeriodFilter: PeriodFilterValue;
  workspaceName: string;
  workspaceType: string;
  userEmail?: string | null;
  userName?: string | null;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  allDespesas,
  currentPeriodFilter,
  workspaceName,
  workspaceType,
  userEmail,
  userName,
}) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [periodMode, setPeriodMode] = useState<'current' | 'all' | 'month' | 'custom'>('current');

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentPeriodFilter.year ?? currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentPeriodFilter.month ?? currentMonth);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // primeiro dia do mês atual
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Lista de anos para seleção
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Cálculo dos dados filtrados para a exportação
  const exportData = useMemo(() => {
    let list = [...allDespesas];

    // Filtro por tipo de movimentação (para Pessoal e Negócio)
    if (workspaceType !== 'obra' && filterTipo !== 'todos') {
      list = list.filter((d) => {
        const isRec = d.tipo_movimentacao === 'receita' || d.descricao.startsWith('[RECEITA]');
        return filterTipo === 'receita' ? isRec : !isRec;
      });
    }

    let calculatedPeriodLabel = '';
    let calculatedDateRange = '';

    if (periodMode === 'current') {
      if (currentPeriodFilter.year === null || currentPeriodFilter.month === null) {
        calculatedPeriodLabel = 'Todo o Histórico';
      } else {
        const mName = MONTH_NAMES[currentPeriodFilter.month - 1];
        calculatedPeriodLabel = `${mName} de ${currentPeriodFilter.year}`;
        const lastDay = new Date(currentPeriodFilter.year, currentPeriodFilter.month, 0).getDate();
        calculatedDateRange = `01/${String(currentPeriodFilter.month).padStart(2, '0')}/${currentPeriodFilter.year} a ${lastDay}/${String(currentPeriodFilter.month).padStart(2, '0')}/${currentPeriodFilter.year}`;
        list = list.filter((d) => {
          const [ano, mes] = d.data_gasto.split('-').map(Number);
          return ano === currentPeriodFilter.year && mes === currentPeriodFilter.month;
        });
      }
    } else if (periodMode === 'all') {
      calculatedPeriodLabel = 'Todo o Histórico';
    } else if (periodMode === 'month') {
      const mName = MONTH_NAMES[selectedMonth - 1];
      calculatedPeriodLabel = `${mName} de ${selectedYear}`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      calculatedDateRange = `01/${String(selectedMonth).padStart(2, '0')}/${selectedYear} a ${lastDay}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
      list = list.filter((d) => {
        const [ano, mes] = d.data_gasto.split('-').map(Number);
        return ano === selectedYear && mes === selectedMonth;
      });
    } else if (periodMode === 'custom') {
      calculatedPeriodLabel = 'Período Personalizado';
      if (startDate && endDate) {
        calculatedDateRange = `${formatDate(startDate)} a ${formatDate(endDate)}`;
        list = list.filter((d) => d.data_gasto >= startDate && d.data_gasto <= endDate);
      }
    }

    // Se o período for 'Todo o Histórico' e houver lançamentos, calcula as datas extremas reais
    if (calculatedPeriodLabel === 'Todo o Histórico' && list.length > 0) {
      const dates = list.map((d) => d.data_gasto).sort();
      calculatedDateRange = `${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])}`;
    }

    // Ordenação cronológica decrescente
    list.sort((a, b) => b.data_gasto.localeCompare(a.data_gasto));

    // Totais financeiros
    const totalGeral = list.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const totalPago = list
      .filter((d) => d.status_pagamento === 'Pago')
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const totalPendente = list
      .filter((d) => d.status_pagamento === 'Pendente')
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    const totalReceitas = list
      .filter((d) => d.tipo_movimentacao === 'receita' || d.descricao.startsWith('[RECEITA]'))
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const totalDespesas = list
      .filter((d) => d.tipo_movimentacao !== 'receita' && !d.descricao.startsWith('[RECEITA]'))
      .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    return {
      list,
      periodLabel: calculatedPeriodLabel,
      dateRange: calculatedDateRange,
      totalGeral,
      totalPago,
      totalPendente,
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
    };
  }, [
    allDespesas,
    workspaceType,
    filterTipo,
    periodMode,
    currentPeriodFilter,
    selectedYear,
    selectedMonth,
    startDate,
    endDate,
  ]);

  if (!isOpen) return null;

  const handleExecuteExport = () => {
    setIsExporting(true);
    try {
      const options: ExportReportOptions = {
        despesas: exportData.list,
        workspaceName,
        workspaceType,
        periodLabel: exportData.periodLabel,
        periodDateRange: exportData.dateRange,
        userEmail,
        userName,
      };

      if (format === 'pdf') {
        exportToPDF(options);
      } else {
        exportToExcel(options);
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error('Falha ao exportar relatório:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 text-slate-100">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Exportar Relatório Financeiro</h3>
              <p className="text-xs text-slate-400">
                Selecione o formato e o período desejado para exportação executiva.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Escolha do Formato */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            1. Formato do Arquivo
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                format === 'pdf'
                  ? 'bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500/30 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Documento PDF</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Layout executivo formatado para impressão e apresentação
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('excel')}
              className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                format === 'excel'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Planilha Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Tabela estruturada com totais, cabeçalho e auto-filtro nativo
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Seleção do Período */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-slate-300">
            2. Período a Exportar
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setPeriodMode('current')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                periodMode === 'current'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              Filtro Atual
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('all')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                periodMode === 'all'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              Todo o Histórico
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('month')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                periodMode === 'month'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              Mês Específico
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('custom')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                periodMode === 'custom'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Seletor quando "Mês Específico" */}
          {periodMode === 'month' && (
            <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Ano</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Seletor quando "Personalizado" */}
          {periodMode === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Data Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Filtro de Tipo (se não for Obra) */}
        {workspaceType !== 'obra' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              3. Tipo de Movimentação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFilterTipo('todos')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  filterTipo === 'todos'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterTipo('receita')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  filterTipo === 'receita'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-emerald-400'
                }`}
              >
                Apenas Receitas
              </button>
              <button
                type="button"
                onClick={() => setFilterTipo('despesa')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  filterTipo === 'despesa'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-rose-400'
                }`}
              >
                Apenas Despesas
              </button>
            </div>
          </div>
        )}

        {/* Prévia dos Dados Filtrados */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Período Identificado no Relatório:</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {exportData.periodLabel}
            </span>
          </div>

          {exportData.dateRange && (
            <p className="text-[11px] text-slate-400 font-mono">
              Intervalo coberto: <span className="text-slate-200">{exportData.dateRange}</span>
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Lançamentos</span>
              <span className="text-xs font-extrabold text-white font-mono">
                {exportData.list.length} item(ns)
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total Geral</span>
              <span className="text-xs font-extrabold text-emerald-400 font-mono">
                {formatCurrency(exportData.totalGeral)}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Quitado</span>
              <span className="text-xs font-extrabold text-emerald-400 font-mono">
                {formatCurrency(exportData.totalPago)}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Pendente</span>
              <span className="text-xs font-extrabold text-amber-400 font-mono">
                {formatCurrency(exportData.totalPendente)}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting || exportData.list.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg transition-all cursor-pointer ${
              format === 'pdf'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            } disabled:opacity-50`}
          >
            <FileDown className="w-4 h-4" />
            <span>
              {isExporting
                ? 'Gerando...'
                : format === 'pdf'
                ? `Baixar Relatório em PDF (${exportData.list.length})`
                : `Baixar Planilha Excel (${exportData.list.length})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
