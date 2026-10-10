import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Briefcase,
  Users,
  Search,
  Calendar,
  FileDown,
  Printer,
  Archive,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { DespesaRow } from '../../types/app';
import type { ContadorVinculoRow } from '../../types/fiscal.types';
import { auditPeriodoFiscal } from '../../lib/fiscalEngine';
import { baixarArquivoCarneLeaoWeb } from '../../lib/exportCarneLeao';
import { printLivroCaixaReport, exportLivroCaixaCSV } from '../../lib/exportLivroCaixa';
import { exportComprovantesZip } from '../../lib/exportComprovantesZip';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { formatarCPF, validarCPF } from '../../lib/fiscalValidators';
import { useSubscription } from '../../context/SubscriptionContext';
import { PaywallView } from '../subscription/PaywallView';

interface ContadorWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClienteVinculadoInfo {
  vinculo: ContadorVinculoRow;
  nomeCliente: string;
  cpfCliente?: string;
  emailCliente: string;
}

export const ContadorWorkspaceModal: React.FC<ContadorWorkspaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { canAccessFiscal } = useSubscription();

  // Período selecionado
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Estados de dados
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [clientes, setClientes] = useState<ClienteVinculadoInfo[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteVinculadoInfo | null>(null);
  const [despesasCliente, setDespesasCliente] = useState<DespesaRow[]>([]);
  
  // Estados de carregamento
  const [loadingClientes, setLoadingClientes] = useState<boolean>(true);
  const [loadingDespesas, setLoadingDespesas] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Estados de download ZIP
  const [zipLoading, setZipLoading] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; status: string } | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  // CPF para exportação do Carnê-Leão
  const [cpfTitular, setCpfTitular] = useState<string>('');
  const [cpfError, setCpfError] = useState<string | null>(null);

  // 1. Carrega dados do usuário atual e seus clientes outorgantes
  const fetchClientesVinculados = useCallback(async () => {
    try {
      setLoadingClientes(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserEmail(user.email || '');

      // Busca vínculos onde o usuário é o contador convidado
      const { data: vinculos, error: vinculoErr } = await supabase
        .from('contador_vinculos')
        .select('*')
        .or(`contador_email.eq.${user.email},contador_id.eq.${user.id}`)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (vinculoErr) {
        console.warn('Erro ao carregar clientes do contador:', vinculoErr.message);
        setClientes([]);
        return;
      }

      if (!vinculos || vinculos.length === 0) {
        setClientes([]);
        setSelectedCliente(null);
        return;
      }

      // Busca dados cadastrais dos clientes outorgantes na tabela perfis
      const clienteIds = vinculos.map((v) => v.cliente_id);
      const { data: rawPerfis } = await supabase
        .from('perfis')
        .select('id, nome, cpf_cnpj')
        .in('id', clienteIds);

      const perfis = (rawPerfis || []) as Array<{ id: string; nome: string; cpf_cnpj?: string | null }>;
      const perfisMap = new Map(perfis.map((p) => [p.id, p]));

      const listaClientes: ClienteVinculadoInfo[] = vinculos.map((v) => {
        const perfil = perfisMap.get(v.cliente_id);
        return {
          vinculo: v as ContadorVinculoRow,
          nomeCliente: perfil?.nome || 'Cliente Autônomo',
          cpfCliente: perfil?.cpf_cnpj || undefined,
          emailCliente: v.contador_email,
        };
      });

      setClientes(listaClientes);
      if (!selectedCliente && listaClientes.length > 0) {
        setSelectedCliente(listaClientes[0]);
      }
    } catch (err) {
      console.warn('Falha geral ao buscar clientes do contador:', err);
    } finally {
      setLoadingClientes(false);
    }
  }, [selectedCliente]);

  useEffect(() => {
    if (isOpen) {
      fetchClientesVinculados();
    }
  }, [isOpen, fetchClientesVinculados]);

  // 2. Ao selecionar cliente ou período, busca os lançamentos do cliente
  useEffect(() => {
    if (!selectedCliente) {
      setDespesasCliente([]);
      return;
    }

    const fetchDespesasDoCliente = async () => {
      try {
        setLoadingDespesas(true);
        const clienteId = selectedCliente.vinculo.cliente_id;

        // Limites de data da competência
        const dataInicio = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const ultimoDia = new Date(selectedYear, selectedMonth, 0).getDate();
        const dataFim = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

        const { data, error } = await supabase
          .from('despesas')
          .select('*')
          .eq('user_id', clienteId)
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .order('data', { ascending: true });

        if (error) {
          console.warn('Erro ao carregar despesas do cliente:', error.message);
          setDespesasCliente([]);
        } else {
          setDespesasCliente((data as DespesaRow[]) || []);
        }

        if (selectedCliente.cpfCliente) {
          setCpfTitular(selectedCliente.cpfCliente);
        }
      } catch (err) {
        console.warn('Falha ao buscar despesas do cliente:', err);
      } finally {
        setLoadingDespesas(false);
      }
    };

    fetchDespesasDoCliente();
  }, [selectedCliente, selectedYear, selectedMonth]);

  // Executa o motor de malha fina preventiva
  const auditReport = useMemo(() => {
    return auditPeriodoFiscal(despesasCliente);
  }, [despesasCliente]);

  // Filtragem de clientes por busca
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    const term = searchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nomeCliente.toLowerCase().includes(term) ||
        (c.cpfCliente && c.cpfCliente.includes(term))
    );
  }, [clientes, searchTerm]);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Ações de exportação
  const handleExportarCarneLeao = () => {
    setCpfError(null);
    const cpfFinal = cpfTitular.trim() || selectedCliente?.cpfCliente || '';
    if (!cpfFinal || !validarCPF(cpfFinal)) {
      setCpfError('Informe um CPF válido para gerar o arquivo do Carnê-Leão Web.');
      return;
    }

    baixarArquivoCarneLeaoWeb({
      lancamentos: despesasCliente,
      ano: selectedYear,
      mes: selectedMonth,
      cpfTitular: cpfFinal,
    });
  };

  const handleImprimirLivroCaixa = () => {
    printLivroCaixaReport(despesasCliente, {
      nomeContribuinte: selectedCliente?.nomeCliente || 'Cliente Autônomo',
      cpfCnpjContribuinte: cpfTitular || selectedCliente?.cpfCliente || '',
      ocupacaoPrincipal: 'Profissional Autônomo',
      mes: selectedMonth,
      ano: selectedYear,
    });
  };

  const handleExportarLivroCaixaCSV = () => {
    exportLivroCaixaCSV(despesasCliente, {
      nomeContribuinte: selectedCliente?.nomeCliente || 'Cliente Autônomo',
      cpfCnpjContribuinte: cpfTitular || selectedCliente?.cpfCliente || '',
      ocupacaoPrincipal: 'Profissional Autônomo',
      mes: selectedMonth,
      ano: selectedYear,
    });
  };

  const handleBaixarComprovantesZip = async () => {
    try {
      setZipError(null);
      setZipLoading(true);
      await exportComprovantesZip(despesasCliente, {
        mes: selectedMonth,
        ano: selectedYear,
        nomeContribuinte: selectedCliente?.nomeCliente || 'Cliente',
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

  const handleCopiarEmailContador = () => {
    if (currentUserEmail) {
      navigator.clipboard.writeText(currentUserEmail);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 animate-scale-up">
        
        {/* Paywall Overlay se usuário não for Business */}
        {!canAccessFiscal && (
          <div className="absolute inset-0 z-50 overflow-y-auto bg-slate-950/95 flex items-center justify-center">
            <PaywallView
              reason="feature_locked"
              lockedFeatureName="Workspace do Contador & Gestão Multi-Cliente de Autônomos"
              onClose={onClose}
            />
          </div>
        )}

        {/* 1. CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white tracking-tight truncate">
                  Workspace do Contador & Auditoria
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Contador + Carnê-Leão
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Audite e exporte relatórios fiscais, Carnê-Leão e comprovantes dos seus clientes autônomos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex-shrink-0"
            title="Fechar Workspace"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CORPO DO WORKSPACE (LAYOUT SPLIT: CLIENTES / AUDITORIA) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          {/* COLUNA ESQUERDA: LISTA DE CLIENTES VINCULADOS (4 COLS) */}
          <div className="md:col-span-4 p-4 flex flex-col bg-slate-950/30 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Clientes Outorgantes ({clientes.length})</span>
              </span>
              <button
                type="button"
                onClick={fetchClientesVinculados}
                disabled={loadingClientes}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                title="Recarregar clientes"
              >
                <RefreshCw className={`w-3 h-3 ${loadingClientes ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Campo de Busca de Clientes */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Lista com Scroll */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingClientes ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  <span>Localizando procurações ativas...</span>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3 my-auto">
                  <UserCheck className="w-8 h-8 text-indigo-400/60 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Nenhum cliente vinculado</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Peça para seu cliente autônomo acessar o GSR Finanças em <strong>Configurações &gt; Acesso do Contador</strong> e informar seu e-mail:
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-indigo-300 truncate max-w-[180px]">
                      {currentUserEmail || 'seu-email@contabil.com'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopiarEmailContador}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      title="Copiar meu e-mail"
                    >
                      {copiedLink ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {copiedLink && (
                    <span className="text-[10px] text-emerald-400 font-semibold block">E-mail copiado!</span>
                  )}
                </div>
              ) : (
                clientesFiltrados.map((cli) => {
                  const isSelected = selectedCliente?.vinculo.id === cli.vinculo.id;
                  return (
                    <button
                      key={cli.vinculo.id}
                      type="button"
                      onClick={() => setSelectedCliente(cli)}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-white block truncate">
                          {cli.nomeCliente}
                        </span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {cli.cpfCliente ? formatarCPF(cli.cpfCliente) : 'CPF não cadastrado'}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                            {cli.vinculo.permissao === 'auditoria_completa' ? 'Auditoria' : 'Leitura'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: PAINEL DE AUDITORIA & EXPORTAÇÕES FISCAIS (8 COLS) */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
            
            {/* Seletor de Competência (Mês e Ano) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Competência Fiscal:</span>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {mesesNomes.map((nome, idx) => (
                    <option key={idx} value={idx + 1}>
                      {nome}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Painel Informativo do Cliente Selecionado */}
            {!selectedCliente ? (
              <div className="py-20 text-center space-y-2 text-slate-500">
                <Users className="w-10 h-10 mx-auto opacity-30 text-indigo-400" />
                <p className="text-xs">Selecione um cliente na lista à esquerda para abrir a auditoria fiscal.</p>
              </div>
            ) : loadingDespesas ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Carregando escrituração do cliente...</span>
              </div>
            ) : (
              <>
                {/* 1. KPIs Fiscais da Competência */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Receitas do Mês
                    </span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {formatCurrency(auditReport.totalReceitas)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Despesas Dedutíveis
                    </span>
                    <span className="text-base font-extrabold text-rose-400 font-mono">
                      {formatCurrency(auditReport.totalDespesasDedutiveis)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Base de Cálculo Líquida
                    </span>
                    <span className="text-base font-extrabold text-white font-mono">
                      {formatCurrency(auditReport.baseCalculo)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      DARF IRPF Estimado
                    </span>
                    <span className={`text-base font-extrabold font-mono ${auditReport.darfEstimado > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatCurrency(auditReport.darfEstimado)}
                    </span>
                  </div>
                </div>

                {/* 2. Alertas de Malha Fina / Status */}
                <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                  auditReport.prontoParaExportacao
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {auditReport.prontoParaExportacao ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <strong className="block font-bold">
                      {auditReport.prontoParaExportacao
                        ? 'Escrituração Validada — Pronta para Carnê-Leão e Livro Caixa'
                        : `${auditReport.errosImpeditivos} pendência(s) detectada(s) na escrituração`}
                    </strong>
                    <span className="opacity-80 block mt-0.5">
                      {despesasCliente.length} lançamento(s) escriturado(s) no mês de {mesesNomes[selectedMonth - 1]}/{selectedYear}.
                    </span>
                  </div>
                </div>

                {/* 3. Ações Rápidas de Exportação Contábil */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <FileDown className="w-4 h-4 text-indigo-400" />
                      <span>Exportação & Entregáveis Contábeis</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Botão 1: Carnê-Leão Web */}
                    <button
                      type="button"
                      disabled={!auditReport.prontoParaExportacao}
                      onClick={handleExportarCarneLeao}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-left transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                      title="Baixar arquivo estruturado para upload direto no e-CAC"
                    >
                      <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                        <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">Carnê-Leão (.csv)</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Layout oficial homologado pela RFB para importação em lote no e-CAC.
                      </p>
                    </button>

                    {/* Botão 2: Livro Caixa Digital (PDF A4) */}
                    <button
                      type="button"
                      onClick={handleImprimirLivroCaixa}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-left transition-all active:scale-95 group cursor-pointer"
                      title="Visualizar demonstrativo formal em A4 com memória de cálculo do IRPF"
                    >
                      <div className="flex items-center space-x-2 text-indigo-400 mb-1">
                        <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">Livro Caixa (PDF A4)</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Demonstrativo com termo de responsabilidade e memória do DARF.
                      </p>
                    </button>

                    {/* Botão 3: Pacote Comprovantes (.ZIP) */}
                    <button
                      type="button"
                      disabled={zipLoading}
                      onClick={handleBaixarComprovantesZip}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-left transition-all active:scale-95 group cursor-pointer disabled:opacity-50"
                      title="Baixar todas as notas fiscais e comprovantes do mês renomeados"
                    >
                      <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                        {zipLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Archive className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-xs font-bold">{zipLoading ? 'Empacotando...' : 'Comprovantes (.zip)'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Fotos e PDFs renomeados com manifesto probatório de auditoria.
                      </p>
                    </button>
                  </div>

                  {/* Feedback do ZIP */}
                  {zipProgress && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
                          <Archive className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span>{zipProgress.status}</span>
                        </span>
                        <span className="font-mono font-bold text-indigo-400">{zipProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${zipProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {zipError && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs font-semibold animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{zipError}</span>
                    </div>
                  )}

                  {/* Campo CPF para emissão */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-300">CPF do Titular:</span>
                      <input
                        type="text"
                        value={formatarCPF(cpfTitular)}
                        onChange={(e) => {
                          setCpfTitular(e.target.value);
                          setCpfError(null);
                        }}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-36 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    {cpfError && (
                      <span className="text-[10px] text-rose-400">{cpfError}</span>
                    )}
                  </div>
                </div>

                {/* 4. Tabela Prévia dos Lançamentos Dedutíveis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Lançamentos do Livro Caixa ({auditReport.itensValidos.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleExportarLivroCaixaCSV}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Baixar planilha (.csv)
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/40 custom-scrollbar">
                    {auditReport.itensValidos.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Nenhum lançamento dedutível registrado para este cliente nesta competência.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400 sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Data</th>
                            <th className="p-2.5">Descrição</th>
                            <th className="p-2.5">CPF/CNPJ</th>
                            <th className="p-2.5">Anexo</th>
                            <th className="p-2.5 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {auditReport.itensValidos.map((item) => {
                            const exp = item.expense;
                            return (
                              <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-2.5 font-mono text-slate-400 whitespace-nowrap">
                                  {formatDate(exp.data_gasto)}
                                </td>
                                <td className="p-2.5 text-white font-medium">
                                  {exp.descricao}
                                  {exp.nome_participante && (
                                    <span className="text-slate-400 text-[10px] block">
                                      {exp.nome_participante}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono text-slate-400 whitespace-nowrap">
                                  {exp.cpf_cnpj_participante || '-'}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  {exp.foto_comprovante_url ? (
                                    <span className="text-[10px] text-emerald-400 font-semibold">Anexado</span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500">Sem foto</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-white whitespace-nowrap">
                                  {formatCurrency(exp.valor)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
