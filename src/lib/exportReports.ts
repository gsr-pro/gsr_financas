import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DespesaRow } from '../types/app';
import { formatCurrency, formatDate, formatNumber, formatPercent } from './formatters';

export interface ExportReportOptions {
  despesas: DespesaRow[];
  workspaceName: string;
  workspaceType: string;
  periodLabel: string;
  periodDateRange?: string;
  userEmail?: string | null;
  userName?: string | null;
}

const getWorkspaceTypeLabel = (type: string): string => {
  if (type === 'obra') return 'Ambiente de Obra & Construção';
  if (type === 'negocio') return 'Ambiente de Negócio & PME';
  return 'Finanças Pessoais';
};

/**
 * Exporta a lista de lançamentos para planilha Excel (.xlsx) com formatação executiva,
 * auto-filtro nativo, logo/marca estruturada, totais consolidados e período em destaque.
 */
export const exportToExcel = ({
  despesas,
  workspaceName,
  workspaceType,
  periodLabel,
  periodDateRange,
  userEmail,
  userName,
}: ExportReportOptions): void => {
  const now = new Date();
  const dataEmissao = now.toLocaleString('pt-BR');
  const typeLabel = getWorkspaceTypeLabel(workspaceType);

  // Cálculos consolidados
  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'Pago')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'Pendente')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);

  const fullPeriodText = periodDateRange
    ? `${periodLabel} (${periodDateRange})`
    : periodLabel;

  // Matriz de dados da planilha
  const rows: (string | number)[][] = [
    // Linha 1: Marca & Logo Tipográfica
    ['◆ GSR FINANÇAS • GESTÃO FINANCEIRA INTELIGENTE & AUDITORIA'],
    // Linha 2: Subtítulo Corporativo
    ['RELATÓRIO EXECUTIVO DE AUDITORIA E MOVIMENTAÇÃO FINANCEIRA'],
    // Linha 3: Metadados Projeto & Status
    ['Projeto / Ambiente:', `${workspaceName} (${typeLabel})`, '', '', 'Status do Relatório:', 'Consolidado e Auditado', '', ''],
    // Linha 4: Período Exportado em Destaque & Data de Emissão
    ['Período Exportado:', fullPeriodText, '', '', 'Data de Emissão:', dataEmissao, '', ''],
    // Linha 5: Responsável & Plataforma
    ['Responsável / Emissor:', userName || userEmail || 'Usuário do Sistema', '', '', 'Plataforma:', 'GSR Finanças SaaS', '', ''],
    // Linha 6: Linha em branco
    [],
    // Linha 7: Títulos dos Cards de Indicadores
    ['TOTAL GERAL', '', 'TOTAL QUITADO (PAGO)', '', 'TOTAL PENDENTE (A PAGAR)', '', 'QUANTIDADE DE ITENS', ''],
    // Linha 8: Valores dos Cards de Indicadores
    [totalGeral, '', totalPago, '', totalPendente, '', `${despesas.length} lançamento(s)`, ''],
    // Linha 9: Linha em branco
    [],
    // Linha 10: Cabeçalho Formatado da Tabela de Lançamentos
    [
      'DATA',
      'TIPO',
      'CATEGORIA',
      'DESCRIÇÃO DO LANÇAMENTO',
      'VALOR (R$)',
      'STATUS DE PAGAMENTO',
      'POSSUI COMPROVANTE',
      'OBSERVAÇÕES',
    ],
  ];

  // Adiciona as linhas de dados (iniciando na linha 11 do Excel)
  despesas.forEach((item) => {
    const isReceita =
      item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    const temComprovante = Boolean(item.foto_comprovante_url);

    rows.push([
      formatDate(item.data_gasto),
      isReceita ? 'Receita' : 'Despesa',
      item.categoria || 'Geral',
      item.descricao.replace(/^\[RECEITA\]\s*/, ''),
      Number(item.valor || 0),
      item.status_pagamento === 'Pago' ? 'Pago / Quitado' : 'Pendente / A Pagar',
      temComprovante ? 'Sim' : 'Não',
      item.observacoes || '',
    ]);
  });

  // Linhas finais com totalização estruturada
  rows.push([]);
  const totalRowIndex = rows.length + 1; // 1-indexed
  rows.push([
    'TOTAL GERAL CONSOLIDADO',
    '',
    '',
    `${despesas.length} lançamento(s) listados`,
    totalGeral,
    `Quitado: ${formatCurrency(totalPago)}`,
    `Pendente: ${formatCurrency(totalPendente)}`,
    '',
  ]);

  // Criação do Workbook e Sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 1. Definição de Merges (Fusão de Células Executiva)
  ws['!merges'] = [
    // Banner e títulos superiores
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // A1:H1 (Título da Marca)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // A2:H2 (Subtítulo do Relatório)
    // Metadados
    { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } }, // B3:D3 (Nome do Workspace)
    { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } }, // F3:H3 (Status)
    { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } }, // B4:D4 (Período Exportado)
    { s: { r: 3, c: 5 }, e: { r: 3, c: 7 } }, // F4:H4 (Emissão)
    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } }, // B5:D5 (Responsável)
    { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } }, // F5:H5 (Plataforma)
    // Cards de Indicadores
    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // A7:B7 (Label Total Geral)
    { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } }, // C7:D7 (Label Quitado)
    { s: { r: 6, c: 4 }, e: { r: 6, c: 5 } }, // E7:F7 (Label Pendente)
    { s: { r: 6, c: 6 }, e: { r: 6, c: 7 } }, // G7:H7 (Label Qtd)
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }, // A8:B8 (Val Total Geral)
    { s: { r: 7, c: 2 }, e: { r: 7, c: 3 } }, // C8:D8 (Val Quitado)
    { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } }, // E8:F8 (Val Pendente)
    { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } }, // G8:H8 (Val Qtd)
    // Linha final totalizadora
    { s: { r: totalRowIndex - 1, c: 0 }, e: { r: totalRowIndex - 1, c: 2 } }, // A:C (Label Total Geral)
  ];

  // 2. Alturas das Linhas para Espaçamento Elegante
  const rowHeights: { hpt: number }[] = [
    { hpt: 28 }, // 1: Título marca
    { hpt: 22 }, // 2: Subtítulo
    { hpt: 18 }, // 3: Projeto
    { hpt: 20 }, // 4: Período (destaque)
    { hpt: 18 }, // 5: Responsável
    { hpt: 10 }, // 6: Espaçador
    { hpt: 16 }, // 7: Header Cards
    { hpt: 24 }, // 8: Valores Cards
    { hpt: 12 }, // 9: Espaçador
    { hpt: 26 }, // 10: Cabeçalho da tabela
  ];

  for (let i = 0; i < despesas.length; i++) {
    rowHeights.push({ hpt: 20 });
  }
  rowHeights.push({ hpt: 10 }); // Espaçador pré-total
  rowHeights.push({ hpt: 24 }); // Totalizador

  ws['!rows'] = rowHeights;

  // 3. Larguras Ideais das Colunas para Nunca Cortar Texto
  ws['!cols'] = [
    { wch: 14 }, // Data
    { wch: 13 }, // Tipo
    { wch: 26 }, // Categoria
    { wch: 44 }, // Descrição
    { wch: 18 }, // Valor (R$)
    { wch: 22 }, // Status
    { wch: 18 }, // Comprovante
    { wch: 38 }, // Observações
  ];

  // 4. Formatação Numérica Nativa do Excel (R$ #,##0.00)
  // Formata os cartões de totais
  if (ws['A8']) {
    ws['A8'].t = 'n';
    ws['A8'].z = '"R$" #,##0.00';
  }
  if (ws['C8']) {
    ws['C8'].t = 'n';
    ws['C8'].z = '"R$" #,##0.00';
  }
  if (ws['E8']) {
    ws['E8'].t = 'n';
    ws['E8'].z = '"R$" #,##0.00';
  }

  // Formata a coluna E (Valor) de todos os lançamentos
  for (let r = 11; r <= 10 + despesas.length; r++) {
    const cellRef = `E${r}`;
    if (ws[cellRef]) {
      ws[cellRef].t = 'n';
      ws[cellRef].z = '"R$" #,##0.00';
    }
  }

  // Formata o valor na linha final de somatório
  const totalValRef = `E${totalRowIndex}`;
  if (ws[totalValRef]) {
    ws[totalValRef].t = 'n';
    ws[totalValRef].z = '"R$" #,##0.00';
  }

  // 5. Auto-filtro Nativo do Excel no Cabeçalho da Tabela
  if (despesas.length > 0) {
    ws['!autofilter'] = { ref: `A10:H${10 + despesas.length}` };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Extrato Consolidado');

  // Nome do arquivo sanitizado
  const sanitizedName = workspaceName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const sanitizedPeriod = periodLabel.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const fileName = `gsr_financas_${sanitizedName}_${sanitizedPeriod}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Exporta a lista de lançamentos para PDF executivo de alta definição
 * com logotipo vetorial, período em destaque proeminente e rodapé corporativo
 */
export const exportToPDF = ({
  despesas,
  workspaceName,
  workspaceType,
  periodLabel,
  periodDateRange,
  userEmail,
  userName,
}: ExportReportOptions): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dataEmissao = now.toLocaleString('pt-BR');
  const typeLabel = getWorkspaceTypeLabel(workspaceType);

  // Cálculos de totais
  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'Pago')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'Pendente')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);

  // =========================================================================
  // 1. CABEÇALHO DO DOCUMENTO COM LOGOMARCA VETORIAL GSR
  // =========================================================================
  // Faixa superior decorativa escura
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Faixa sutil verde esmeralda no topo
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, 210, 2.5, 'F');

  // Logotipo Vetorial Isométrico GSR Finanças (Alta Definição)
  // Face superior (losango verde esmeralda)
  doc.setFillColor(16, 185, 129);
  doc.triangle(24, 8, 31, 12, 24, 16, 'F');
  doc.triangle(24, 8, 17, 12, 24, 16, 'F');

  // Face lateral esquerda
  doc.setFillColor(5, 150, 105);
  doc.triangle(17, 12, 24, 16, 24, 23, 'F');
  doc.triangle(17, 12, 17, 19, 24, 23, 'F');

  // Face lateral direita
  doc.setFillColor(4, 120, 87);
  doc.triangle(31, 12, 24, 16, 24, 23, 'F');
  doc.triangle(31, 12, 31, 19, 24, 23, 'F');

  // Ponto de destaque no ápice estrutural
  doc.setFillColor(245, 158, 11); // amber-500
  doc.circle(24, 8, 0.9, 'F');

  // Tipografia da Marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS', 36, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('GESTÃO FINANCEIRA INTELIGENTE & AUDITORIA', 36, 20);

  // Título e Emissão no lado direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE AUDITORIA', 196, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Emissão: ${dataEmissao}`, 196, 19, { align: 'right' });

  // =========================================================================
  // 2. CARD EXECUTIVO EM DESTAQUE: PERÍODO EXPORTADO E METADADOS
  // =========================================================================
  const metaBoxY = 37;
  const metaBoxHeight = 16;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, metaBoxY, 182, metaBoxHeight, 2, 2, 'FD');

  // Friso lateral esmeralda no card
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(14, metaBoxY, 3, metaBoxHeight, 1, 1, 'F');

  // Linha 1 do card: Projeto e Responsável
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PROJETO / AMBIENTE:', 20, metaBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${workspaceName} (${typeLabel})`, 54, metaBoxY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Responsável: ${userName || userEmail || 'Usuário do Sistema'}`, 140, metaBoxY + 5.5);

  // Linha 2 do card: Período Exportado em DESTAQUE MAIÚSCULO
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('PERÍODO EXPORTADO:', 20, metaBoxY + 11.5);

  const fullPeriodPdf = periodDateRange
    ? `${periodLabel} [ ${periodDateRange} ]`
    : periodLabel;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(fullPeriodPdf, 54, metaBoxY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Total: ${despesas.length} lançamento(s)`, 140, metaBoxY + 11.5);

  // =========================================================================
  // 3. CARDS DE RESUMO FINANCEIRO (KPIs)
  // =========================================================================
  const cardY = 57;
  const cardHeight = 16;
  const cardWidth = 58;

  // Card 1: Total Geral
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DO PERÍODO', 18, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(totalGeral), 18, cardY + 12);

  // Card 2: Total Quitado (Pago)
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(76, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('TOTAL QUITADO (PAGO)', 80, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text(formatCurrency(totalPago), 80, cardY + 12);

  // Card 3: Total Pendente (A Pagar)
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 202, 202); // rose-200
  doc.roundedRect(138, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('TOTAL PENDENTE', 142, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(190, 18, 60);
  doc.text(formatCurrency(totalPendente), 142, cardY + 12);

  // =========================================================================
  // 4. TABELA DE LANÇAMENTOS (AUTOTABLE COM TOTAIS NO FOOTER)
  // =========================================================================
  const tableData = despesas.map((item) => {
    const isReceita =
      item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    const temComprovante = item.foto_comprovante_url ? 'Sim' : 'Não';

    return [
      formatDate(item.data_gasto),
      isReceita ? 'Receita' : 'Despesa',
      item.categoria || 'Geral',
      item.descricao.replace(/^\[RECEITA\]\s*/, ''),
      formatCurrency(Number(item.valor || 0)),
      item.status_pagamento === 'Pago' ? 'Pago' : 'Pendente',
      temComprovante,
    ];
  });

  autoTable(doc, {
    startY: cardY + cardHeight + 6,
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status', 'Recibo']],
    body: tableData,
    foot: [
      [
        'TOTAL',
        '',
        '',
        `${despesas.length} lançamento(s) listados`,
        formatCurrency(totalGeral),
        `Quitado: ${formatCurrency(totalPago)}`,
        '',
      ],
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // Data
      1: { cellWidth: 16, halign: 'center' }, // Tipo
      2: { cellWidth: 28 }, // Categoria
      3: { cellWidth: 'auto' }, // Descrição
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }, // Valor
      5: { cellWidth: 18, halign: 'center' }, // Status
      6: { cellWidth: 14, halign: 'center' }, // Recibo
    },
    didDrawPage: (data) => {
      // Rodapé de Auditoria e Paginação em todas as páginas
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      // Linha separadora do rodapé
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 287, 196, 287);

      doc.text(
        `GSR Finanças • Relatório de Auditoria • Período: ${periodLabel}`,
        14,
        292
      );
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, 196, 292, { align: 'right' });
    },
  });

  // Nome do arquivo para download
  const sanitizedName = workspaceName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const sanitizedPeriod = periodLabel.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const fileName = `gsr_financas_${sanitizedName}_${sanitizedPeriod}.pdf`;

  doc.save(fileName);
};

export interface ExportPricingReportOptions {
  nomeProduto: string;
  workspaceName: string;
  insumos: {
    nome: string;
    quantidade: number;
    unidade_medida: string;
    custo_unitario: number;
  }[];
  custoInsumos: number;
  horasTrabalho: number;
  valorHoraMaoObra: number;
  custoMaoObra: number;
  custosFixosRateados: number;
  custoTotalProducao: number;
  margemLucroDesejadaPct: number;
  precoVendaSugerido: number;
  lucroBrutoUnitario: number;
  markupMultiplicador: number;
  margemRealPct: number;
  custoFixoMensalTotal: number;
  pontoEquilibrioUnidades: number;
  userName?: string | null;
  userEmail?: string | null;
}

/**
 * Exporta o relatório executivo de precificação, ficha técnica e ponto de equilíbrio em PDF
 */
export const exportPricingReportPDF = (options: ExportPricingReportOptions): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dataEmissao = now.toLocaleString('pt-BR');

  // =========================================================================
  // 1. CABEÇALHO DO DOCUMENTO
  // =========================================================================
  // Faixa superior decorativa escura
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Faixa sutil índigo/esmeralda no topo
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, 105, 2.5, 'F');
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(105, 0, 105, 2.5, 'F');

  // Logotipo / Marca "GSR FINANÇAS"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('GESTÃO FINANCEIRA FACILITADA • MÓDULO NEGÓCIOS & PME', 14, 19);

  // Título e Emissão no lado direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHA TÉCNICA & PRECIFICAÇÃO', 196, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Emissão: ${dataEmissao}`, 196, 19, { align: 'right' });

  // =========================================================================
  // 2. METADADOS DO PRODUTO E EMPRESA
  // =========================================================================
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Produto / Serviço: ${options.nomeProduto || 'Produto sem nome'}`, 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Empresa / Workspace: ${options.workspaceName}   |   Responsável: ${options.userName || options.userEmail || 'Gestor'}`,
    14,
    45
  );

  // =========================================================================
  // 3. CARDS DE RESUMO FINANCEIRO E INDICADORES (KPIs)
  // =========================================================================
  const cardY = 50;
  const cardHeight = 17;
  const cardWidth = 43;

  // Card 1: Preço Sugerido de Venda (DESTAQUE VERDE)
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('PREÇO SUGERIDO', 18, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text(formatCurrency(options.precoVendaSugerido), 18, cardY + 12);

  // Card 2: Custo Total de Produção
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 202, 202); // rose-200
  doc.roundedRect(60, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('CUSTO UNITÁRIO TOTAL', 64, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(190, 18, 60);
  doc.text(formatCurrency(options.custoTotalProducao), 64, cardY + 12);

  // Card 3: Lucro Líquido Unitário
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.roundedRect(106, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(`LUCRO UNIT. (${formatPercent(options.margemRealPct, 1)})`, 110, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(3, 105, 161);
  doc.text(`+${formatCurrency(options.lucroBrutoUnitario)}`, 110, cardY + 12);

  // Card 4: Markup Multiplicador
  doc.setFillColor(245, 243, 255); // indigo-50
  doc.setDrawColor(221, 214, 254); // indigo-200
  doc.roundedRect(152, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(109, 40, 217);
  doc.text('MARKUP MULTIPLICADOR', 156, cardY + 5);
  doc.setFontSize(11);
  doc.setTextColor(91, 33, 182);
  doc.text(`${formatNumber(options.markupMultiplicador, 2, 2)}x`, 156, cardY + 12);

  // =========================================================================
  // 4. TABELA 1: FICHA TÉCNICA DE MATÉRIAS-PRIMAS (INSUMOS)
  // =========================================================================
  const insumosTableData = options.insumos.map((i, idx) => {
    const custoTotal = Number(i.quantidade) * Number(i.custo_unitario);
    return [
      String(idx + 1),
      i.nome || 'Insumo sem nome',
      `${Number(i.quantidade).toLocaleString('pt-BR')} ${i.unidade_medida}`,
      formatCurrency(Number(i.custo_unitario)),
      formatCurrency(custoTotal),
    ];
  });

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Insumo / Matéria-Prima', 'Quantidade', 'Custo Unitário', 'Custo Total do Insumo']],
    body: insumosTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    foot: [
      [
        '',
        'SUBTOTAL MATÉRIA-PRIMA (CMV)',
        `${options.insumos.length} item(ns)`,
        '',
        formatCurrency(options.custoInsumos),
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    margin: { left: 14, right: 14 },
  });

  // Pega a posição Y logo após a tabela de insumos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // Se tiver pouco espaço na página, pula para a próxima página
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // =========================================================================
  // 5. TABELA 2: COMPOSIÇÃO DE CUSTOS DE PRODUÇÃO
  // =========================================================================
  const custosComposicao = [
    ['Custo com Matéria-Prima & Embalagens Diretas (CMV)', formatCurrency(options.custoInsumos)],
    [
      `Mão de Obra Direta (${formatNumber(options.horasTrabalho, 0, 2)}h x ${formatCurrency(options.valorHoraMaoObra)}/h)`,
      formatCurrency(options.custoMaoObra),
    ],
    ['Custos Fixos Rateados (Energia, Gás, Frete, Embalagem)', formatCurrency(options.custosFixosRateados)],
    ['CUSTO TOTAL DE PRODUÇÃO UNITÁRIO', formatCurrency(options.custoTotalProducao)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Composição do Custo de Produção por Unidade', 'Valor (R$)']],
    body: custosComposicao,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 8;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // =========================================================================
  // 6. QUADRO EXPLICATIVO: PONTO DE EQUILÍBRIO (BREAK-EVEN)
  // =========================================================================
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.roundedRect(14, currentY, 182, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text('ANÁLISE DE PONTO DE EQUILÍBRIO (BREAK-EVEN POINT):', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // amber-800
  const breakEvenLines = [
    `• Meta de Custos Fixos Operacionais da Empresa: ${formatCurrency(options.custoFixoMensalTotal)}/mês.`,
    `• Quantidade mínima para pagar os custos: ${formatNumber(options.pontoEquilibrioUnidades, 0, 0)} unidades deste produto no mês.`,
    `• A partir da ${formatNumber(options.pontoEquilibrioUnidades + 1, 0, 0)}ª unidade vendida, cada venda gera ${formatCurrency(options.lucroBrutoUnitario)} de lucro líquido limpo no bolso.`,
  ];
  doc.text(breakEvenLines, 18, currentY + 13);

  currentY += 36;

  // =========================================================================
  // 7. EXPLICAÇÃO DIDÁTICA DO MÉTODO MARKUP DIVISOR
  // =========================================================================
  if (currentY <= 250) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(14, currentY, 182, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('METODOLOGIA DE MARKUP DIVISOR APLICADA:', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const markupExplanation = [
      `Fórmula: Preço de Venda = Custo de Produção / (1 - Margem Desejada).`,
      `Diferença para o Markup Multiplicador comum: Garante que os ${formatPercent(options.margemLucroDesejadaPct, 0)} incidam sobre o faturamento real da venda,`,
      `evitando a armadilha contábil de cobrar menos do que o necessário e ter prejuízo oculto.`,
    ];
    doc.text(markupExplanation, 18, currentY + 12);
  }

  // =========================================================================
  // 8. RODAPÉ INSTITUCIONAL
  // =========================================================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);

    // Linha separadora do rodapé
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 287, 196, 287);

    doc.text(
      'GSR Finanças • Ficha Técnica & Precificação Executiva para PMEs.',
      14,
      292
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 292, { align: 'right' });
  }

  // Download do arquivo
  const sanitizedProduct = options.nomeProduto.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const fileName = `gsr_precificacao_${sanitizedProduct || 'produto'}.pdf`;
  doc.save(fileName);
};

/**
 * Exporta a ficha técnica e a simulação de precificação para planilha Excel (.xlsx)
 */
export const exportPricingReportExcel = (options: ExportPricingReportOptions): void => {
  const now = new Date();
  const dataEmissao = now.toLocaleString('pt-BR');

  const rows: (string | number)[][] = [
    ['GSR FINANÇAS - GESTÃO FINANCEIRA FACILITADA | FICHA TÉCNICA & PRECIFICAÇÃO'],
    [`Produto / Serviço: ${options.nomeProduto || 'Produto sem nome'}`],
    [`Empresa / Workspace: ${options.workspaceName} | Emitido em: ${dataEmissao}`],
    [`Responsável: ${options.userName || options.userEmail || 'Gestor'}`],
    [],
    ['RESUMO EXECUTIVO DE PRECIFICAÇÃO'],
    ['Preço Sugerido de Venda', Number(options.precoVendaSugerido)],
    ['Custo Total de Produção', Number(options.custoTotalProducao)],
    ['Lucro Líquido Unitário', Number(options.lucroBrutoUnitario)],
    ['Margem de Lucro Desejada (%)', formatPercent(options.margemLucroDesejadaPct, 1)],
    ['Margem Real (%)', formatPercent(options.margemRealPct, 1)],
    ['Markup Multiplicador', `${formatNumber(options.markupMultiplicador, 2, 2)}x`],
    ['Custos Fixos Mensais da Empresa', Number(options.custoFixoMensalTotal)],
    ['Ponto de Equilíbrio (Break-Even)', `${formatNumber(options.pontoEquilibrioUnidades, 0, 0)} unidades/mês`],
    [],
    ['DETALHAMENTO DOS CUSTOS DE PRODUÇÃO'],
    ['Total Matéria-Prima (CMV)', Number(options.custoInsumos)],
    [`Mão de Obra (${formatNumber(options.horasTrabalho, 0, 2)}h x ${formatCurrency(options.valorHoraMaoObra)}/h)`, Number(options.custoMaoObra)],
    ['Custos Fixos Rateados (Embalagem, Energia, etc.)', Number(options.custosFixosRateados)],
    ['Custo Total Unitário', Number(options.custoTotalProducao)],
    [],
    ['FICHA TÉCNICA DE INSUMOS & MATÉRIAS-PRIMAS'],
    ['#', 'Insumo / Matéria-Prima', 'Quantidade', 'Unidade de Medida', 'Custo Unitário (R$)', 'Custo Total (R$)'],
  ];

  options.insumos.forEach((i, idx) => {
    const custoTotal = Number(i.quantidade) * Number(i.custo_unitario);
    rows.push([
      idx + 1,
      i.nome || 'Insumo sem nome',
      Number(i.quantidade),
      i.unidade_medida,
      Number(i.custo_unitario),
      custoTotal,
    ]);
  });

  rows.push([]);
  rows.push([
    '',
    'TOTAL MATÉRIA-PRIMA (CMV)',
    '',
    '',
    '',
    Number(options.custoInsumos),
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 36 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Precificação & Insumos');

  const sanitizedProduct = options.nomeProduto.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const fileName = `gsr_precificacao_${sanitizedProduct || 'produto'}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
