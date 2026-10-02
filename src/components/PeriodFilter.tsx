import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

export interface PeriodFilterValue {
  year: number | null; // null significa "Todos os Períodos"
  month: number | null; // 1 a 12 ou null
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (newValue: PeriodFilterValue) => void;
  className?: string;
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

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1 a 12

  // Anos disponíveis para seleção (ano atual - 3 até ano atual + 2)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isAllPeriods = value.year === null || value.month === null;

  // Navegar para o mês anterior
  const handlePrevMonth = () => {
    const y = value.year ?? currentYear;
    const m = value.month ?? currentMonth;

    if (m === 1) {
      onChange({ year: y - 1, month: 12 });
    } else {
      onChange({ year: y, month: m - 1 });
    }
  };

  // Navegar para o próximo mês
  const handleNextMonth = () => {
    const y = value.year ?? currentYear;
    const m = value.month ?? currentMonth;

    if (m === 12) {
      onChange({ year: y + 1, month: 1 });
    } else {
      onChange({ year: y, month: m + 1 });
    }
  };

  // Selecionar mês atual
  const handleSelectCurrentMonth = () => {
    onChange({ year: currentYear, month: currentMonth });
    setIsOpen(false);
  };

  // Selecionar todos os períodos
  const handleSelectAllPeriods = () => {
    onChange({ year: null, month: null });
    setIsOpen(false);
  };

  // Selecionar mês e ano específicos
  const handleSelectSpecific = (selectedYear: number, selectedMonth: number) => {
    onChange({ year: selectedYear, month: selectedMonth });
    setIsOpen(false);
  };

  // Label formatado para exibição
  const displayLabel = useMemo(() => {
    if (isAllPeriods) {
      return 'Todos os Períodos';
    }
    const monthName = MONTH_NAMES[(value.month as number) - 1];
    return `${monthName} de ${value.year}`;
  }, [isAllPeriods, value.month, value.year]);

  return (
    <div className={`relative inline-flex items-center select-none ${className}`} ref={dropdownRef}>
      <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-sm transition-all hover:border-slate-700">
        
        {/* Botão Mês Anterior (ativo quando não for todos os períodos ou para iniciar navegação) */}
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
          title="Mês Anterior"
          aria-label="Mês Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botão Central: Exibe o período ativo e abre o seletor */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAllPeriods
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20'
          }`}
          title="Clique para alternar o período"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[180px]">{displayLabel}</span>
          {!isAllPeriods && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Botão Próximo Mês */}
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
          title="Próximo Mês"
          aria-label="Próximo Mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Popover / Dropdown com Seletor Detalhado */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 animate-fade-in space-y-3.5">
          
          {/* Cabeçalho do Dropdown */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Filtrar por Período</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSelectCurrentMonth}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
                value.year === currentYear && value.month === currentMonth
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" />
              <span>Mês Atual</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAllPeriods}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
                isAllPeriods
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>Todos (Geral)</span>
              {isAllPeriods && <Check className="w-3 h-3 text-emerald-400" />}
            </button>
          </div>

          {/* Grade de Seleção de Mês e Ano */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Ano: {value.year ?? currentYear}
              </span>
              <div className="flex space-x-1">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      const m = value.month ?? currentMonth;
                      onChange({ year: yr, month: m });
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      (value.year ?? currentYear) === yr
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Meses em Grid 3x4 */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {MONTH_NAMES.map((name, idx) => {
                const monthNum = idx + 1;
                const isSelected =
                  !isAllPeriods &&
                  (value.year ?? currentYear) === (value.year ?? currentYear) &&
                  value.month === monthNum;
                const isCurrent =
                  currentYear === (value.year ?? currentYear) && currentMonth === monthNum;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectSpecific(value.year ?? currentYear, monthNum)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all text-center relative cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80'
                    }`}
                  >
                    {name.slice(0, 3)}
                    {isCurrent && !isSelected && (
                      <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
