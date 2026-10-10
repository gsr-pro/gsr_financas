import type { DespesaRow } from '../types/app';
import { limparDocumento } from './fiscalValidators';
import type { OcupacaoAutonomo } from '../types/fiscal.types';

export interface CarneLeaoExportOptions {
  lancamentos: DespesaRow[];
  ano: number;
  mes: number;
  cpfTitular: string;
  nomeTitular?: string;
  ocupacao?: OcupacaoAutonomo;
  codigoOcupacaoCBO?: string;
  cpfProfissionalSaude?: string;
  registroProfissionalSaude?: string;
}

/**
 * Mapeamento das ocupações para códigos numéricos usuais do Carnê-Leão RFB
 */
const CODIGOS_OCUPACAO_RFB: Record<string, string> = {
  autonomo_construcao: '711', // Construção civil (pedreiros, mestres de obras, pintores)
  motorista_app: '522',       // Transporte de passageiros / motoristas
  profissional_saude: '225',  // Médicos / Área da Saúde
  advocacia: '241',           // Advogados
  locador_imoveis: '',        // Locadores (geralmente sem código CBO)
  outro: '',
};

/**
 * Formata valores numéricos para o padrão oficial exigido pelo e-CAC:
 * - Sem separador de milhar (.)
 * - Apenas vírgula (,) como separador decimal
 * - Exemplo: 1250,00
 */
export const formatarValorCarneLeao = (valor: number): string => {
  return Number(valor || 0).toFixed(2).replace('.', ',');
};

/**
 * Converte data ISO AAAA-MM-DD para DD/MM/AAAA
 */
const formatarDataBR = (isoDate: string): string => {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
};

/**
 * Sanitiza o texto para CSV: remove quebras de linha e delimitadores ';'
 */
const sanitizarHistorico = (texto: string): string => {
  return (texto || '')
    .replace(/^\[RECEITA\]\s*/, '')
    .replace(/[\n\r;]/g, ' ')
    .trim()
    .slice(0, 100);
};

// ==============================================================================
// 1. ESTRUTURA OFICIAL DE RENDIMENTOS (Receitas do Autônomo)
// Layout: estrutura_rendimentos_carne_leao.csv
// ==============================================================================
export const gerarCsvRendimentosCarneLeao = (options: CarneLeaoExportOptions): string => {
  const { lancamentos, ano, mes, cpfTitular, ocupacao = 'autonomo_construcao', codigoOcupacaoCBO } = options;
  const cpfTitularLimpo = limparDocumento(cpfTitular);
  const codOcupacao = codigoOcupacaoCBO || CODIGOS_OCUPACAO_RFB[ocupacao] || '';

  const linhas: string[] = [];
  // Cabeçalho oficial
  linhas.push(
    'Data do lançamento;Código do rendimento;Código da ocupação;Valor recebido;Valor da dedução;Histórico;Indicador de recebido de;CPF do titular pagamento;CPF do beneficiário serviço;Indicador CPF não informado;CNPJ;Indicador de IRRF;Valor IRRF'
  );

  const receitasDoPeriodo = lancamentos.filter((item) => {
    const isReceita = item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    if (!isReceita) return false;
    const raw = item.data_gasto;
    if (!raw) return false;
    const [y, m] = raw.split('-');
    return Number(y) === ano && Number(m) === mes;
  });

  for (const item of receitasDoPeriodo) {
    const dataFormatada = formatarDataBR(item.data_gasto);
    const docLimpo = limparDocumento(item.cpf_cnpj_participante || '');
    const isCNPJ = docLimpo.length === 14;
    const indicadorRecebidoDe = isCNPJ ? 'PJ' : 'PF';

    // Código do rendimento: R01.001.001 (PF) ou R02.001.000 (PJ)
    const cdRendimento = isCNPJ ? 'R02.001.000' : 'R01.001.001';
    const valorRecebido = formatarValorCarneLeao(item.valor);
    const historico = sanitizarHistorico(item.descricao);

    const cpfTitularPag = isCNPJ ? '' : (docLimpo || cpfTitularLimpo);
    const cpfBeneficiario = isCNPJ ? '' : (docLimpo || cpfTitularLimpo);
    const cnpj = isCNPJ ? docLimpo : '';
    const indCpfNaoInformado = !isCNPJ && !docLimpo ? 'S' : '';

    const linha = [
      dataFormatada,
      cdRendimento,
      codOcupacao,
      valorRecebido,
      '', // Valor da dedução
      historico,
      indicadorRecebidoDe,
      cpfTitularPag,
      cpfBeneficiario,
      indCpfNaoInformado,
      cnpj,
      'N', // Indicador de IRRF
      '',  // Valor IRRF
    ].join(';');

    linhas.push(linha);
  }

  return '\uFEFF' + linhas.join('\r\n');
};

// ==============================================================================
// 2. ESTRUTURA OFICIAL DE PAGAMENTOS (Despesas Dedutíveis / Livro Caixa)
// Layout: estrutura_pagamentos_carne_leao.csv
// ==============================================================================
export const gerarCsvPagamentosCarneLeao = (options: CarneLeaoExportOptions): string => {
  const { lancamentos, ano, mes } = options;
  const mesStr = String(mes).padStart(2, '0');
  const competencia = `${mesStr}/${ano}`;

  const linhas: string[] = [];
  // Cabeçalho oficial
  linhas.push(
    'Data do lançamento;Código do pagamento;Valor pago;Histórico;Valor da multa;Valor dos juros;Mês e ano de competência'
  );

  const pagamentosDoPeriodo = lancamentos.filter((item) => {
    const isDespesa = item.tipo_movimentacao === 'despesa' && !item.descricao.startsWith('[RECEITA]');
    const isDedutivel = Boolean(item.is_dedutivel_livro_caixa);
    if (!isDespesa || !isDedutivel) return false;
    const raw = item.data_gasto;
    if (!raw) return false;
    const [y, m] = raw.split('-');
    return Number(y) === ano && Number(m) === mes;
  });

  for (const item of pagamentosDoPeriodo) {
    const dataFormatada = formatarDataBR(item.data_gasto);
    const valorPago = formatarValorCarneLeao(item.valor);
    const historico = sanitizarHistorico(item.descricao);

    // Códigos de pagamento oficiais da RFB:
    // P01.001.000: Aluguel de imóvel comercial
    // P02.001.000: Energia elétrica, água e telefone
    // P04.001.000: Materiais de consumo, ferramentas e insumos de custeio geral
    let cdPagamento = 'P04.001.000';
    const catLower = item.categoria.toLowerCase();
    if (catLower.includes('aluguel') || catLower.includes('imóvel') || catLower.includes('locação')) {
      cdPagamento = 'P01.001.000';
    } else if (catLower.includes('luz') || catLower.includes('energia') || catLower.includes('água') || catLower.includes('telefone') || catLower.includes('internet')) {
      cdPagamento = 'P02.001.000';
    }

    const linha = [
      dataFormatada,
      cdPagamento,
      valorPago,
      historico,
      '0,00', // Valor da multa
      '0,00', // Valor dos juros
      competencia,
    ].join(';');

    linhas.push(linha);
  }

  return '\uFEFF' + linhas.join('\r\n');
};

// ==============================================================================
// 3. ESTRUTURA OFICIAL DE RECIBOS DE SAÚDE COM REGISTRO PROFISSIONAL
// Layout: estrutura_recibos_receita_saude.csv
// ==============================================================================
export const gerarCsvRecibosSaudeCarneLeao = (options: CarneLeaoExportOptions): string => {
  const {
    lancamentos,
    ano,
    mes,
    cpfTitular,
    cpfProfissionalSaude,
    registroProfissionalSaude = '',
  } = options;

  const cpfTitularLimpo = limparDocumento(cpfTitular);
  const cpfProfLimpo = limparDocumento(cpfProfissionalSaude || cpfTitular);

  const linhas: string[] = [];
  linhas.push(
    'Data do pagamento;Código do rendimento;Código da ocupação;Valor do pagamento;Valor da dedução;Descrição;Recebido de;CPF do pagador;CPF do beneficiário;Ind. CPF não informado;CNPJ;Indicador de IRRF;Valor IRRF;Indicador de recibo;CPF do profissional;Registro profissional'
  );

  const receitasSaude = lancamentos.filter((item) => {
    const isReceita = item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    if (!isReceita) return false;
    const raw = item.data_gasto;
    if (!raw) return false;
    const [y, m] = raw.split('-');
    return Number(y) === ano && Number(m) === mes;
  });

  for (const item of receitasSaude) {
    const dataFormatada = formatarDataBR(item.data_gasto);
    const docLimpo = limparDocumento(item.cpf_cnpj_participante || '');
    const isCNPJ = docLimpo.length === 14;
    const valor = formatarValorCarneLeao(item.valor);
    const descricao = sanitizarHistorico(item.descricao);

    const linha = [
      dataFormatada,
      'R01.001.001',
      '225', // Ocupação Saúde
      valor,
      '', // Dedução
      descricao,
      isCNPJ ? 'PJ' : 'PF',
      isCNPJ ? '' : (docLimpo || cpfTitularLimpo),
      isCNPJ ? '' : (docLimpo || cpfTitularLimpo),
      !isCNPJ && !docLimpo ? 'S' : '',
      isCNPJ ? docLimpo : '',
      'N',
      '',
      'S', // Indicador de recibo emitido
      cpfProfLimpo,
      registroProfissionalSaude,
    ].join(';');

    linhas.push(linha);
  }

  return '\uFEFF' + linhas.join('\r\n');
};

/**
 * Função utilitária para disparar o download de um arquivo CSV
 */
const dispararDownloadCsv = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Baixa o arquivo de Rendimentos (Receitas) para o Carnê-Leão Web
 */
export const baixarRendimentosCarneLeaoWeb = (options: CarneLeaoExportOptions): void => {
  const csv = gerarCsvRendimentosCarneLeao(options);
  const mesStr = String(options.mes).padStart(2, '0');
  dispararDownloadCsv(csv, `estrutura_rendimentos_carne_leao_${options.ano}_${mesStr}.csv`);
};

/**
 * Baixa o arquivo de Pagamentos / Deduções do Livro Caixa para o Carnê-Leão Web
 */
export const baixarPagamentosCarneLeaoWeb = (options: CarneLeaoExportOptions): void => {
  const csv = gerarCsvPagamentosCarneLeao(options);
  const mesStr = String(options.mes).padStart(2, '0');
  dispararDownloadCsv(csv, `estrutura_pagamentos_carne_leao_${options.ano}_${mesStr}.csv`);
};

/**
 * Baixa os dois arquivos oficiais (Rendimentos e Pagamentos) prontos para importação no e-CAC
 */
export const baixarArquivoCarneLeaoWeb = (options: CarneLeaoExportOptions): void => {
  // Baixa os Rendimentos
  baixarRendimentosCarneLeaoWeb(options);
  // Baixa os Pagamentos com pequeno delay para o navegador não bloquear downloads múltiplos
  setTimeout(() => {
    baixarPagamentosCarneLeaoWeb(options);
  }, 400);
};
