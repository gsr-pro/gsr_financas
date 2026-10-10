import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  FileDown,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Loader2,
  Printer,
  Archive,
  FileSpreadsheet,
} from 'lucide-react';
import type { DespesaRow } from '../../types/app';
import type { OcupacaoAutonomo } from '../../types/fiscal.types';
import { auditPeriodoFiscal } from '../../lib/fiscalEngine';
import { baixarArquivoCarneLeaoWeb } from '../../lib/exportCarneLeao';
import { printLivroCaixaReport, exportLivroCaixaCSV } from '../../lib/exportLivroCaixa';
import { exportComprovantesZip } from '../../lib/exportComprovantesZip';
import { formatCurrency } from '../../lib/formatters';
import { formatarCPF, validarCPF } from '../../lib/fiscalValidators';
import { supabase } from '../../lib/supabaseClient';

interface MalhaFinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lancamentos: DespesaRow[];
  ano: number;
  mes: number;
  ocupacao?: OcupacaoAutonomo;
  onDespesaUpdated?: () => void;
  userCpf?: string;
  userName?: string;
}

export const MalhaFinaModal: React.FC<MalhaFinaModalProps> = ({
  isOpen,
  onClose,
  lancamentos,
  ano,
  mes,
  ocupacao = 'autonomo_construcao',
  onDespesaUpdated,
  userCpf = '',
  userName = '',
}) => {
  const [cpfTitular, setCpfTitular] = useState<string>(() => {
    const saved = localStorage.getItem('gsr_cpf_titular');
    return saved || userCpf || '';
  });
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);

  // Estados de exportação do ZIP de Comprovantes
  const [zipLoading, setZipLoading] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; status: string } | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  // Executa o motor de malha fina preventiva
  const auditReport = useMemo(() => {
    return auditPeriodoFiscal(lancamentos, ocupacao);
  }, [lancamentos, ocupacao]);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const competenciaFormatada = `${mesesNomes[mes - 1] || mes} de ${ano}`;

  // Desmarca dedutibilidade de despesa suspeita com 1 clique
  const handleDesmarcarDedutibilidade = async (despesaId: string) => {
    try {
      setFixingId(despesaId);
      const { error } = await supabase
        .from('despesas')
        .update({ is_dedutivel_livro_caixa: false } as any)
        .eq('id', despesaId);

      if (error) throw error;
      if (onDespesaUpdated) onDespesaUpdated();
    } catch (err) {
      console.error('Erro ao ajustar dedutibilidade:', err);
    } finally {
      setFixingId(null);
    }
  };

  const handleExportarCarneLeao = () => {
    setCpfError(null);
    if (!cpfTitular.trim() || !validarCPF(cpfTitular)) {
      setCpfError('Por favor, informe um CPF válido para o titular do Carnê-Leão.');
      return;
    }

    localStorage.setItem('gsr_cpf_titular', cpfTitular);

    baixarArquivoCarneLeaoWeb({
      lancamentos,
      ano,
      mes,
      cpfTitular,
    });
  };

  const handleImprimirLivroCaixa = () => {
    printLivroCaixaReport(lancamentos, {
      nomeContribuinte: userName || 'Contribuinte Titular',
      cpfCnpjContribuinte: cpfTitular || '',
      ocupacaoPrincipal: ocupacao === 'autonomo_construcao' ? 'Autônomo da Construção Civil' : 'Motorista / Entregador Autônomo',
      mes,
      ano,
    });
  };

  const handleExportarLivroCaixaCSV = () => {
    exportLivroCaixaCSV(lancamentos, {
      nomeContribuinte: userName || 'Contribuinte Titular',
      cpfCnpjContribuinte: cpfTitular || '',
      ocupacaoPrincipal: ocupacao,
      mes,
      ano,
    });
  };

  const handleBaixarComprovantesZip = async () => {
    try {
      setZipError(null);
      setZipLoading(true);
      await exportComprovantesZip(lancamentos, {
        mes,
        ano,
        nomeContribuinte: userName || 'Contribuinte',
        onProgress: (percent, statusText) => {
          setZipProgress({ percent, status: statusText });
        },
      });
    } catch (err: any) {
      setZipError(err.message || 'Erro ao gerar pacote de comprovantes.');
    } finally {
      setZipLoading(false);
      setTimeout(() => setZipProgress(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-scale-up">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  Malha Fina Preventiva • Carnê-Leão Web
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {competenciaFormatada}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Auditoria antecipada dos lançamentos antes de gerar o arquivo para o e-CAC.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          
          {/* Card Resumo da Apuração do Carnê-Leão */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Receita Bruta PF</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                {formatCurrency(auditReport.totalReceitas)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Livro Caixa Dedutível</span>
              <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono">
                - {formatCurrency(auditReport.totalDespesasDedutiveis)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Base Tributável</span>
              <span className="text-xs sm:text-sm font-black text-white font-mono">
                {formatCurrency(auditReport.baseCalculoTributavel)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-mono">DARF Mensal Estimado</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                {formatCurrency(auditReport.darfEstimado)}
              </span>
            </div>
          </div>

          {/* Status Geral de Validação */}
          {auditReport.prontoParaExportacao ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-300">
              <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Nenhuma inconsistência impeditiva encontrada!</h4>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed mt-0.5">
                  Todas as receitas possuem CPF válido e as despesas do Livro Caixa possuem comprovante anexo.
                  Você está liberado para exportar o arquivo do Carnê-Leão Web.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-rose-300">
              <AlertCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Atenção: Existem pendências a corrigir</h4>
                <p className="text-[11px] text-rose-300/90 leading-relaxed mt-0.5">
                  O layout de importação do e-CAC rejeitará o arquivo se existirem receitas sem CPF ou despesas dedutíveis sem comprovante. Corrija abaixo para habilitar o download.
                </p>
              </div>
            </div>
          )}

          {/* Lista de Inconsistências / Alertas */}
          {auditReport.inconsistencias.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white block">
                Itens Identificados na Malha Fina ({auditReport.inconsistencias.length}):
              </span>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {auditReport.inconsistencias.map((item) => (
                  <div
                    key={item.despesaId}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate max-w-[280px]">
                        {item.descricao}
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {formatCurrency(item.valor)}
                      </span>
                    </div>

                    {item.problemas.map((prob, idx) => (
                      <div
                        key={idx}
                        className={`text-[11px] p-2 rounded-lg flex items-start justify-between gap-2 ${
                          prob.severidade === 'erro'
                            ? 'bg-rose-500/15 text-rose-200 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-start space-x-1.5 min-w-0">
                          {prob.severidade === 'erro' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="leading-snug">{prob.mensagem}</span>
                        </div>

                        {prob.codigo === 'DEDUTIBILIDADE_DUVIDOSA' && (
                          <button
                            type="button"
                            disabled={fixingId === item.despesaId}
                            onClick={() => handleDesmarcarDedutibilidade(item.despesaId)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95 disabled:opacity-50"
                          >
                            {fixingId === item.despesaId ? 'Ajustando...' : 'Desmarcar Dedutível'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo CPF do Titular */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>CPF do Titular do Carnê-Leão (Obrigatório para o cabeçalho e-CAC)</span>
            </label>
            <input
              type="text"
              value={formatarCPF(cpfTitular)}
              onChange={(e) => {
                setCpfTitular(e.target.value);
                setCpfError(null);
              }}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full sm:w-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {cpfError && (
              <span className="text-[11px] text-rose-400 block">{cpfError}</span>
            )}
            <span className="text-[10px] text-slate-500 block">
              O CPF do titular é gravado na linha do arquivo CSV para validação no portal e-CAC.
            </span>
          </div>

          {/* Feedback de Progresso do ZIP de Comprovantes */}
          {zipProgress && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
                  <Archive className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>{zipProgress.status}</span>
                </span>
                <span className="font-mono font-bold text-indigo-400">{zipProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${zipProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {zipError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{zipError}</span>
            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-3">
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400">
              <span>Layout homologado conforme </span>
              <a
                href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao/manual/formato-arquivo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline inline-flex items-center space-x-0.5 hover:text-emerald-300"
              >
                <span>Manual Carnê-Leão RFB</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </div>

            {/* Grupo de Ações Contábeis & Auditoria */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Imprimir / Salvar Livro Caixa PDF */}
              <button
                type="button"
                onClick={handleImprimirLivroCaixa}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer border border-slate-700 hover:border-slate-600"
                title="Visualizar e imprimir o Livro Caixa Digital formatado em padrão A4"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Livro Caixa (PDF A4)</span>
              </button>

              {/* 1.1 Baixar Livro Caixa CSV */}
              <button
                type="button"
                onClick={handleExportarLivroCaixaCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer border border-slate-700 hover:border-slate-600"
                title="Baixar planilha CSV com memória de cálculo do Livro Caixa"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Planilha (.csv)</span>
              </button>

              {/* 2. Baixar Pacote de Comprovantes .ZIP */}
              <button
                type="button"
                disabled={zipLoading}
                onClick={handleBaixarComprovantesZip}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer border border-slate-700 hover:border-slate-600 disabled:opacity-50"
                title="Baixar todas as fotos e PDFs dos comprovantes do mês renomeados e compactados"
              >
                {zipLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{zipLoading ? 'Empacotando...' : 'Comprovantes (.zip)'}</span>
              </button>

              {/* 3. Exportar Carnê-Leão Web (.csv) */}
              <button
                type="button"
                disabled={!auditReport.prontoParaExportacao}
                onClick={handleExportarCarneLeao}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                title={
                  !auditReport.prontoParaExportacao
                    ? 'Corrija os erros impeditivos na lista antes de exportar'
                    : 'Baixar arquivo pronto para importar no e-CAC'
                }
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar Carnê-Leão Web (.csv)</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
