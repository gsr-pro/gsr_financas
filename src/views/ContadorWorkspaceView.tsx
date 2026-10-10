import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { DespesaRow } from '../types/app';
import type { ContadorVinculoRow } from '../types/fiscal.types';
import { auditPeriodoFiscal } from '../lib/fiscalEngine';
import { baixarArquivoCarneLeaoWeb } from '../lib/exportCarneLeao';
import { printLivroCaixaReport, exportLivroCaixaCSV } from '../lib/exportLivroCaixa';
import { exportComprovantesZip } from '../lib/exportComprovantesZip';
import { formatCurrency, formatDate } from '../lib/formatters';
import { formatarCPF, validarCPF } from '../lib/fiscalValidators';
import { useSubscription } from '../context/SubscriptionContext';
import { PaywallView } from '../components/subscription/PaywallView';

interface ContadorWorkspaceViewProps {
  onSwitchToUserView: () => void;
  onLogout: () => void;
}

interface ClienteVinculadoInfo {
  vinculo: ContadorVinculoRow;
  nomeCliente: string;
  cpfCliente?: string;
  emailCliente: string;
}

export const ContadorWorkspaceView: React.FC<ContadorWorkspaceViewProps> = ({
  onSwitchToUserView,
  onLogout,
}) => {
  const { canAccessFiscal } = useSubscription();

  // Período selecionado
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Estados de dados
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserCrc, setCurrentUserCrc] = useState<string>('');
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

  // 1. Carrega dados do contador atual e seus clientes outorgantes
  const fetchClientesVinculados = useCallback(async () => {
    try {
      setLoadingClientes(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserEmail(user.email || '');

      // Busca dados cadastrais do próprio contador em perfis
      const { data: perfilContador } = await supabase
        .from('perfis')
        .select('nome, crc_numero')
        .eq('id', user.id)
        .maybeSingle();

      if (perfilContador) {
        setCurrentUserName(perfilContador.nome || '');
        setCurrentUserCrc(perfilContador.crc_numero || '');
      }

      // Busca vínculos onde o usuário é o contador convidado
      let query = supabase
        .from('contador_vinculos')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (user.email) {
        query = query.or(`contador_email.ilike.${user.email},contador_id.eq.${user.id}`);
      } else {
        query = query.eq('contador_id', user.id);
      }

      const { data: vinculos, error: vinculoErr } = await query;

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
      const perfisMap = new Map<string, { nome: string; cpf_cnpj?: string | null }>();

      if (clienteIds.length > 0) {
        const { data: rawPerfis } = await supabase
          .from('perfis')
          .select('id, nome, cpf_cnpj')
          .in('id', clienteIds);

        if (rawPerfis) {
          rawPerfis.forEach((p) => perfisMap.set(p.id, p));
        }
      }

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
    fetchClientesVinculados();
  }, [fetchClientesVinculados]);

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
          .gte('data_gasto', dataInicio)
          .lte('data_gasto', dataFim)
          .order('data_gasto', { ascending: false });

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
  const handleBaixarCarneLeao = () => {
    setCpfError(null);
    const cpfLimpo = cpfTitular.replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || !validarCPF(cpfLimpo)) {
      setCpfError('Informe um CPF válido do titular para a Receita Federal.');
      return;
    }

    baixarArquivoCarneLeaoWeb({
      lancamentos: despesasCliente,
      cpfTitular: cpfLimpo,
      mes: selectedMonth,
      ano: selectedYear,
    });
  };

  const handleExportarLivroCaixaPDF = () => {
    printLivroCaixaReport(despesasCliente, {
      nomeContribuinte: selectedCliente?.nomeCliente || 'Cliente',
      cpfCnpjContribuinte: cpfTitular || 'Não informado',
      ocupacaoPrincipal: 'Profissional Autônomo',
      mes: selectedMonth,
      ano: selectedYear,
    });
  };

  const handleExportarLivroCaixaCSV = () => {
    exportLivroCaixaCSV(despesasCliente, {
      nomeContribuinte: selectedCliente?.nomeCliente || 'Cliente',
      cpfCnpjContribuinte: cpfTitular || 'Não informado',
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar pacote de comprovantes.';
      setZipError(msg);
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

  // Se o usuário não tiver acesso fiscal (após trial), exibe o PaywallView em tela cheia
  if (!canAccessFiscal) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <PaywallView
          reason="feature_locked"
          lockedFeatureName="Workspace do Contador & Gestão Multi-Cliente de Autônomos"
          onClose={onSwitchToUserView}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-viewport)] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">
      
      {/* =================================================================== */}
      {/* 1. HEADER EXCLUSIVO DO CONTADOR (CRC)                               */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          
          {/* Logo e Identificação Contábil */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-white tracking-tight">GSR Contábil</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40">
                  Área Oficial CRC
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {currentUserName || currentUserEmail} {currentUserCrc ? `• CRC: ${currentUserCrc}` : ''}
              </p>
            </div>
          </div>

          {/* Ações do Header do Contador */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onSwitchToUserView}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Alternar para a visualização de finanças pessoais e obras"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Visão Usuário</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              title="Sair da conta"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. CORPO DO WORKSPACE (LAYOUT SPLIT: CLIENTES / AUDITORIA)         */}
      {/* =================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUNA ESQUERDA: LISTA DE CLIENTES VINCULADOS (4 COLS) */}
        <aside className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col shadow-xl space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Clientes Outorgantes ({clientes.length})</span>
            </span>
            <button
              type="button"
              onClick={fetchClientesVinculados}
              disabled={loadingClientes}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Atualizar lista de clientes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingClientes ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Campo de Busca de Clientes */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Lista Rolável de Clientes */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[220px] max-h-[380px] lg:max-h-none pr-1 custom-scrollbar">
            {loadingClientes ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span>Carregando carteira de clientes...</span>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
                <UserCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Nenhum cliente vinculado ainda</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para auditar um cliente, peça para ele abrir o GSR Finanças dele, ir em <strong>Configurações &gt; Meu Contador</strong> e informar o seu e-mail:
                </p>
                <button
                  type="button"
                  onClick={handleCopiarEmailContador}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'E-mail Copiado!' : 'Copiar Meu E-mail para Enviar'}</span>
                </button>
              </div>
            ) : (
              clientesFiltrados.map((cli) => {
                const isSelected = selectedCliente?.vinculo.id === cli.vinculo.id;
                return (
                  <button
                    key={cli.vinculo.id}
                    type="button"
                    onClick={() => setSelectedCliente(cli)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold truncate text-white">
                        {cli.nomeCliente}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        {cli.cpfCliente ? formatarCPF(cli.cpfCliente) : cli.emailCliente}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                  </button>
                );
              })
            )}
          </div>

          {/* Dica de Conexão Rápida */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-amber-300 block">Seu E-mail para Clientes:</span>
            <p className="font-mono text-[10px] text-slate-300 truncate select-all">{currentUserEmail}</p>
          </div>
        </aside>

        {/* COLUNA DIREITA: AUDITORIA, COMPETÊNCIA E EXPORTAÇÃO (8 COLS) */}
        <section className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col shadow-xl space-y-5">
          
          {!selectedCliente ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Briefcase className="w-12 h-12 text-slate-700" />
              <h4 className="text-base font-bold text-slate-300">Nenhum cliente selecionado</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Selecione um cliente outorgante na barra lateral para auditar inconsistências fiscais, visualizar o Livro Caixa e gerar os arquivos do Carnê-Leão Web.
              </p>
            </div>
          ) : (
            <>
              {/* Barra Superior da Auditoria */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-black text-white">
                    {selectedCliente.nomeCliente}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Outorga de Escrituração • {selectedCliente.emailCliente}
                  </p>
                </div>

                {/* Seletor de Competência (Mês / Ano) */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                      {mesesNomes.map((m, idx) => (
                        <option key={idx} value={idx + 1} className="bg-slate-900 text-white">
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                      {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((ano) => (
                        <option key={ano} value={ano} className="bg-slate-900 text-white">
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informação e Edição Rápida do CPF do Contribuinte */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs">
                  <span className="text-slate-300 block font-bold">CPF do Contribuinte (Titular do Carnê-Leão):</span>
                  <span className="text-slate-500 text-[11px]">Necessário para importação no portal e-CAC da RFB</span>
                </div>
                <input
                  type="text"
                  value={cpfTitular}
                  onChange={(e) => {
                    setCpfTitular(formatarCPF(e.target.value));
                    if (cpfError) setCpfError(null);
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full sm:w-44 px-3 py-1.5 text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded-xl text-amber-300 focus:outline-none focus:border-amber-400 placeholder-slate-600"
                />
              </div>

              {/* Exibição de Erro no CPF se houver */}
              {cpfError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cpfError}</span>
                </div>
              )}

              {/* Botões de Ação Executiva Contábil */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={handleBaixarCarneLeao}
                  disabled={loadingDespesas || despesasCliente.length === 0}
                  className="py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Gerar e baixar o CSV formatado para importação direta no Carnê-Leão Web e-CAC"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Carnê-Leão e-CAC</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportarLivroCaixaPDF}
                  disabled={loadingDespesas || despesasCliente.length === 0}
                  className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Imprimir ou salvar em PDF o Livro Caixa oficial com termos de abertura e encerramento"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Livro Caixa (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportarLivroCaixaCSV}
                  disabled={loadingDespesas || despesasCliente.length === 0}
                  className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Exportar planilha Excel/CSV com as colunas oficiais do Livro Caixa"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Planilha (CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={handleBaixarComprovantesZip}
                  disabled={zipLoading || despesasCliente.length === 0}
                  className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Baixar todas as notas fiscais e comprovantes renomeados em um arquivo ZIP organizado"
                >
                  {zipLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{zipLoading ? 'Empacotando...' : 'Comprovantes (ZIP)'}</span>
                </button>
              </div>

              {/* Status de Download do ZIP */}
              {zipProgress && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center space-x-2 text-indigo-300 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>{zipProgress.status} ({zipProgress.percent}%)</span>
                </div>
              )}
              {zipError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{zipError}</span>
                </div>
              )}

              {/* Painel do Motor de Auditoria Fiscal (Malha Fina Preventiva) */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Auditoria Preventiva de Malha Fina
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    auditReport.inconsistencias.length > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {auditReport.inconsistencias.length > 0
                      ? `${auditReport.inconsistencias.length} inconsistência(s)`
                      : 'Em Conformidade Fiscal'}
                  </span>
                </div>

                {auditReport.inconsistencias.length > 0 ? (
                  <div className="space-y-1.5">
                    {auditReport.inconsistencias.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 flex items-start space-x-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>{item.descricao}:</strong> {item.problemas[0]?.mensagem || 'Verificar conformidade fiscal'}
                        </div>
                      </div>
                    ))}
                    {auditReport.inconsistencias.length > 3 && (
                      <p className="text-[10px] text-slate-500 italic">
                        + {auditReport.inconsistencias.length - 3} outra(s) inconsistência(s) encontrada(s) no período.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Nenhuma pendência cadastral ou documento inválido encontrado para esta competência.</span>
                  </p>
                )}
              </div>

              {/* Tabela de Lançamentos do Período */}
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-300">
                    Lançamentos do Mês ({despesasCliente.length})
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Total: {formatCurrency(despesasCliente.reduce((acc, d) => acc + Number(d.valor || 0), 0))}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/40 max-h-[360px] custom-scrollbar">
                  {loadingDespesas ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      <span>Carregando dados da competência...</span>
                    </div>
                  ) : despesasCliente.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Nenhum lançamento registrado pelo cliente nesta competência ({selectedMonth}/{selectedYear}).
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[10px] font-mono uppercase tracking-wider sticky top-0">
                          <th className="p-2.5">Data</th>
                          <th className="p-2.5">Descrição</th>
                          <th className="p-2.5">CPF/CNPJ</th>
                          <th className="p-2.5">Comprovante</th>
                          <th className="p-2.5 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {despesasCliente.map((exp) => (
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
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

        </section>

      </main>

    </div>
  );
};
