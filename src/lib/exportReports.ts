import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DespesaRow } from '../types/app';
import { formatCurrency, formatDate } from './formatters';

export interface ExportReportOptions {
  despesas: DespesaRow[];
  workspaceName: string;
  workspaceType: string;
  periodLabel: string;
  userEmail?: string | null;
  userName?: string | null;
}

/**
 * Exporta a lista de lançamentos para planilha Excel (.xlsx) com formatação executiva
 */
export const exportToExcel = ({
  despesas,
  workspaceName,
  workspaceType,
  periodLabel,
  userEmail,
  userName,
}: ExportReportOptions): void => {
  const now = new Date();
  const dataEmissao = now.toLocaleString('pt-BR');

  // Cálculos de totais
  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'Pago')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'Pendente')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);

  // Montagem da estrutura em matriz de células (AOA)
  const rows: (string | number)[][] = [
    ['GSR FINANÇAS - GESTÃO FINANCEIRA FACILITADA | RELATÓRIO DE AUDITORIA'],
    [`Projeto / Workspace: ${workspaceName} (${workspaceType === 'obra' ? 'Ambiente de Obra' : workspaceType === 'negocio' ? 'Ambiente de Negócio' : 'Finanças Pessoais'})`],
    [`Período de Referência: ${periodLabel} | Emitido em: ${dataEmissao}`],
    [`Responsável: ${userName || userEmail || 'Usuário do Sistema'}`],
    [
      `Total Geral: ${formatCurrency(totalGeral)}`,
      `Total Quitado: ${formatCurrency(totalPago)}`,
      `Total Pendente: ${formatCurrency(totalPendente)}`,
      `Qtd. Itens: ${despesas.length}`,
    ],
    [], // Linha em branco
    [
      'Data',
      'Tipo',
      'Categoria',
      'Descrição',
      'Valor (R$)',
      'Status de Pagamento',
      'Possui Comprovante',
      'Observações',
    ],
  ];

  // Adiciona as linhas de dados
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

  // Linha final com somatório
  rows.push([]);
  rows.push([
    'TOTAL GERAL',
    '',
    '',
    `${despesas.length} lançamento(s)`,
    totalGeral,
    `Quitado: ${formatCurrency(totalPago)}`,
    `Pendente: ${formatCurrency(totalPendente)}`,
    '',
  ]);

  // Criação do Workbook e Sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largura estimada das colunas
  ws['!cols'] = [
    { wch: 14 }, // Data
    { wch: 12 }, // Tipo
    { wch: 22 }, // Categoria
    { wch: 40 }, // Descrição
    { wch: 16 }, // Valor
    { wch: 20 }, // Status
    { wch: 18 }, // Comprovante
    { wch: 35 }, // Observações
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos GSR');

  // Nome do arquivo sanitizado
  const sanitizedName = workspaceName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const sanitizedPeriod = periodLabel.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const fileName = `gsr_financas_${sanitizedName}_${sanitizedPeriod}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Exporta a lista de lançamentos para PDF executivo de alta definição
 */
export const exportToPDF = ({
  despesas,
  workspaceName,
  workspaceType,
  periodLabel,
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

  // Cálculos de totais
  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'Pago')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'Pendente')
    .reduce((acc, d) => acc + Number(d.valor || 0), 0);

  // =========================================================================
  // 1. CABEÇALHO DO DOCUMENTO
  // =========================================================================
  // Faixa superior decorativa escura
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Faixa sutil verde esmeralda no topo
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, 210, 2.5, 'F');

  // Logotipo / Marca "GSR FINANÇAS"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('GESTÃO FINANCEIRA FACILITADA', 14, 19);

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
  // 2. METADADOS E CONTEXTO DO PROJETO
  // =========================================================================
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Projeto: ${workspaceName}`, 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Tipo: ${workspaceType === 'obra' ? 'Ambiente de Obra & Reformas' : 'Finanças Pessoais'}   |   Período: ${periodLabel}`,
    14,
    45
  );
  if (userName || userEmail) {
    doc.text(`Responsável: ${userName || userEmail}`, 14, 50);
  }

  // =========================================================================
  // 3. CARDS DE RESUMO FINANCEIRO (KPIs)
  // =========================================================================
  const cardY = 55;
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
  // 4. TABELA DE LANÇAMENTOS (AUTOTABLE)
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
        'GSR Finanças • Relatório emitido para simples conferência e auditoria interna.',
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
