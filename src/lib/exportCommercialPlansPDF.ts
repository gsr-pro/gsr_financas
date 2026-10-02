import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PLANS, PLAN_COMPARISON_FEATURES } from '../config/plans';
import { formatCurrency } from './formatters';

/**
 * Desenha o logotipo vetorial isométrico oficial em alta definição da marca GSR Finanças
 */
const drawGSRLogo = (doc: jsPDF, x: number, y: number, scale = 1): void => {
  doc.saveGraphicsState();

  // Face superior (losango verde esmeralda)
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.triangle(
    x + 7 * scale, y,
    x + 14 * scale, y + 4 * scale,
    x + 7 * scale, y + 8 * scale,
    'F'
  );
  doc.triangle(
    x + 7 * scale, y,
    x, y + 4 * scale,
    x + 7 * scale, y + 8 * scale,
    'F'
  );

  // Face lateral esquerda
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.triangle(
    x, y + 4 * scale,
    x + 7 * scale, y + 8 * scale,
    x + 7 * scale, y + 15 * scale,
    'F'
  );
  doc.triangle(
    x, y + 4 * scale,
    x, y + 11 * scale,
    x + 7 * scale, y + 15 * scale,
    'F'
  );

  // Face lateral direita
  doc.setFillColor(4, 120, 87); // emerald-700
  doc.triangle(
    x + 14 * scale, y + 4 * scale,
    x + 7 * scale, y + 8 * scale,
    x + 7 * scale, y + 15 * scale,
    'F'
  );
  doc.triangle(
    x + 14 * scale, y + 4 * scale,
    x + 14 * scale, y + 11 * scale,
    x + 7 * scale, y + 15 * scale,
    'F'
  );

  // Ponto no ápice (âmbar)
  doc.setFillColor(245, 158, 11); // amber-500
  doc.circle(x + 7 * scale, y, 0.9 * scale, 'F');

  doc.restoreGraphicsState();
};

/**
 * Gera e realiza o download do Material Comercial Executivo dos Planos e Recursos (PDF)
 * Desenvolvido especialmente para apresentações a clientes, sócios e uso do time comercial.
 */
export const exportCommercialPlansPDF = (): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dataAtual = now.toLocaleDateString('pt-BR');
  const lite = PLANS.lite;
  const business = PLANS.business;

  // =========================================================================
  // PÁGINA 1: APRESENTAÇÃO INSTITUCIONAL, AMBIENTES E RESUMO DOS PLANOS
  // =========================================================================

  // 1. Cabeçalho Corporativo Superior Escuro
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 34, 'F');

  // Faixa de destaque verde esmeralda no topo
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, 210, 2.5, 'F');

  // Logotipo Vetorial Oficial
  drawGSRLogo(doc, 14, 8, 1.15);

  // Tipografia da Marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS', 36, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('GESTÃO FINANCEIRA FACILITADA • OBRAS, NEGÓCIOS & PATRIMÔNIO', 36, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Material Comercial & Catálogo Oficial de Planos de Assinatura', 36, 26);

  // Lado direito: Selo de Versão e 7 Dias Grátis
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(142, 8, 54, 18, 2, 2, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(142, 8, 54, 18, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('★ 7 DIAS GRÁTIS', 169, 13.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text('Teste sem fidelidade', 169, 17.5, { align: 'center' });
  doc.text(`Atualização: ${dataAtual}`, 169, 21.5, { align: 'center' });

  // 2. Título da Apresentação
  let currentY = 41;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('1. Plataforma Unificada: Três Ecossistemas em um Só Aplicativo', 14, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'O GSR Finanças foi desenvolvido para solucionar a fragmentação financeira de quem constrói, empreende e gerencia seu patrimônio pessoal.',
    14,
    currentY,
    { maxWidth: 182 }
  );

  // 3. Os Três Ambientes Nativos (Cards Horizontais)
  currentY += 8;
  const colWidth = 58;
  const cardHeight = 44;
  const gap = 4;

  // Card 1: Custo de Obra & Reformas
  const x1 = 14;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(x1, currentY, colWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129); // emerald-500 friso
  doc.rect(x1, currentY, colWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('AMBIENTE DE OBRA', x1 + 4, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Custos de Construção', x1 + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const textObra = [
    '• Aquisição de terreno/lote e valorização.',
    '• Custo real da obra por m² construído.',
    '• Controle de materiais e mão de obra.',
    '• Anexo de notas fiscais e comprovantes.',
    '• Total pago vs contas pendentes a pagar.',
  ];
  let bulletY = currentY + 17;
  textObra.forEach((item) => {
    doc.text(item, x1 + 4, bulletY, { maxWidth: colWidth - 8 });
    bulletY += 4.5;
  });

  // Card 2: Negócios & PME
  const x2 = x1 + colWidth + gap;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(x2, currentY, colWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(99, 102, 241); // indigo-500 friso
  doc.rect(x2, currentY, colWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(55, 48, 163); // indigo-800
  doc.text('AMBIENTE DE NEGÓCIO', x2 + 4, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Gestão de PME & Insumos', x2 + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const textNegocio = [
    '• Ficha técnica detalhada de insumos.',
    '• Calculadora de Precificação & Markup.',
    '• Ponto de equilíbrio (Break-Even).',
    '• Cálculo de CMV e margem operacional.',
    '• Separação de custos fixos e impostos.',
  ];
  bulletY = currentY + 17;
  textNegocio.forEach((item) => {
    doc.text(item, x2 + 4, bulletY, { maxWidth: colWidth - 8 });
    bulletY += 4.5;
  });

  // Card 3: Finanças Pessoais
  const x3 = x2 + colWidth + gap;
  doc.setFillColor(236, 254, 255); // cyan-50
  doc.setDrawColor(165, 243, 252); // cyan-200
  doc.roundedRect(x3, currentY, colWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(6, 182, 212); // cyan-500 friso
  doc.rect(x3, currentY, colWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 116, 144); // cyan-800
  doc.text('AMBIENTE PESSOAL', x3 + 4, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Patrimônio & Finanças', x3 + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const textPessoal = [
    '• Controle de receitas, salários e contas.',
    '• Painel de Investimentos e Poupança.',
    '• Reserva de emergência e rendimentos.',
    '• Categorias dinâmicas personalizáveis.',
    '• Fluxo de caixa mensal e anual claro.',
  ];
  bulletY = currentY + 17;
  textPessoal.forEach((item) => {
    doc.text(item, x3 + 4, bulletY, { maxWidth: colWidth - 8 });
    bulletY += 4.5;
  });

  // 4. Seção dos Planos de Assinatura
  currentY += cardHeight + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Comparativo Executivo dos Planos Oficiais', 14, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Escolha a modalidade que melhor se adapta à complexidade da sua operação. Ambos incluem 7 dias de avaliação gratuita.',
    14,
    currentY,
    { maxWidth: 182 }
  );

  // Cards dos Planos: Lite vs Business
  currentY += 7;
  const planWidth = 89;
  const planHeight = 110;

  // --- CARD PLANO LITE ---
  const liteX = 14;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(liteX, currentY, planWidth, planHeight, 3, 3, 'FD');

  // Faixa topo Lite
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(liteX, currentY, planWidth, 18, 3, 3, 'F');
  doc.rect(liteX, currentY + 14, planWidth, 4, 'F'); // remove canto inferior arredondado

  // Badge Lite
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(liteX + 6, currentY + 3.5, 30, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('MAIS POPULAR', liteX + 21, currentY + 6.8, { align: 'center' });

  // Nome do Plano
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Plano Lite', liteX + 6, currentY + 14);

  // Preço Mensal / Anual Lite
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${lite.monthlyPrice.toFixed(2).replace('.', ',')}`, liteX + 6, currentY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('/mês no plano mensal', liteX + 40, currentY + 27.5);

  // Promoção de Boas-Vindas
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(liteX + 6, currentY + 31.5, planWidth - 12, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`PROMOÇÃO: R$ ${lite.promoMonthlyPrice?.toFixed(2).replace('.', ',')}/mês nos 2 primeiros meses`, liteX + 9, currentY + 35.8);

  // Preço Anual
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`Opção Anual: R$ ${lite.yearlyPrice.toFixed(2).replace('.', ',')} / ano (equivale a 2 meses grátis)`, liteX + 6, currentY + 42.5);

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.line(liteX + 6, currentY + 45.5, liteX + planWidth - 6, currentY + 45.5);

  // Recursos do Plano Lite
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('O QUE ESTÁ INCLUSO NO LITE:', liteX + 6, currentY + 50.5);

  const liteItems = [
    '✓ 2 Ambientes: Custo de Obra + Finanças Pessoais',
    '✓ Gestão de múltiplos projetos e obras ilimitadas',
    '✓ Cálculo de custo real por metro quadrado (R$/m²)',
    '✓ Acompanhamento de aquisição de terreno e evolução',
    '✓ Anexo de recibos e notas fiscais no Storage',
    '✓ Relatórios executivos em PDF e Excel (.xlsx)',
    '✓ Painel de Investimentos e Reserva de Emergência',
    '✓ Filtro de período dinâmico por mês e histórico',
    '— Módulo de Negócios & PME (exclusivo do Business)',
    '— Ficha técnica e calculadora de Markup (exclusivo)',
  ];

  let itemY = currentY + 56;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  liteItems.forEach((text) => {
    if (text.startsWith('✓')) {
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
    }
    doc.text(text, liteX + 6, itemY, { maxWidth: planWidth - 12 });
    itemY += 5;
  });

  // --- CARD PLANO BUSINESS PME ---
  const bizX = liteX + planWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(99, 102, 241); // borda destacada indigo
  doc.setLineWidth(0.6);
  doc.roundedRect(bizX, currentY, planWidth, planHeight, 3, 3, 'FD');
  doc.setLineWidth(0.2); // volta padrão

  // Faixa topo Business
  doc.setFillColor(30, 27, 75); // indigo-950
  doc.roundedRect(bizX, currentY, planWidth, 18, 3, 3, 'F');
  doc.rect(bizX, currentY + 14, planWidth, 4, 'F');

  // Badge Business
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.roundedRect(bizX + 6, currentY + 3.5, 36, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('MAIS COMPLETO (3 EM 1)', bizX + 24, currentY + 6.8, { align: 'center' });

  // Nome do Plano Business
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Plano Business PME', bizX + 6, currentY + 14);

  // Preço Mensal / Anual Business
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${business.monthlyPrice.toFixed(2).replace('.', ',')}`, bizX + 6, currentY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('/mês no plano mensal', bizX + 42, currentY + 27.5);

  // Destaque de Economia no Anual
  doc.setFillColor(224, 231, 255); // indigo-100
  doc.roundedRect(bizX + 6, currentY + 31.5, planWidth - 12, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text(`PLANO ANUAL: R$ ${business.yearlyPrice.toFixed(2).replace('.', ',')} / ano (2 meses gratuitos)`, bizX + 9, currentY + 35.8);

  // Diferencial Negócios
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('Acesso total a todos os 3 ambientes e ferramentas PME', bizX + 6, currentY + 42.5);

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.line(bizX + 6, currentY + 45.5, bizX + planWidth - 6, currentY + 45.5);

  // Recursos do Plano Business
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('TODOS OS RECURSOS DO LITE + MÓDULO PME:', bizX + 6, currentY + 50.5);

  const bizItems = [
    '✓ 3 Ambientes: Obra + Pessoal + Negócios & PME',
    '✓ Ficha técnica completa de produtos e insumos',
    '✓ Calculadora de Precificação Inteligente & Markup',
    '✓ Cálculo de Ponto de Equilíbrio (Break-Even Point)',
    '✓ Custo de Mercadorias Vendidas (CMV) em tempo real',
    '✓ Acompanhamento de margem líquida e operacional',
    '✓ Controle de custos fixos, comissões e impostos',
    '✓ Relatórios específicos de precificação e rentabilidade',
    '✓ Gestão de múltiplos projetos em todos os ambientes',
    '✓ Suporte prioritário e auditoria avançada de dados',
  ];

  itemY = currentY + 56;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  bizItems.forEach((text) => {
    doc.setTextColor(49, 46, 129); // indigo-900
    doc.setFont('helvetica', 'bold');
    doc.text(text, bizX + 6, itemY, { maxWidth: planWidth - 12 });
    itemY += 5;
  });

  // 5. Rodapé Corporativo da Página 1
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('GSR Finanças • Tecnologia de Ponta em Gestão Financeira', 14, 289);
  doc.text('Segurança de Nível Bancário PostgreSQL RLS • Criptografia SSL 256-bit • LGPD', 14, 293);
  doc.text('Página 1 de 2', 196, 291, { align: 'right' });


  // =========================================================================
  // PÁGINA 2: MATRIZ DETALHADA DE COMPARAÇÃO DE RECURSOS & AUDITORIA
  // =========================================================================
  doc.addPage();

  // 1. Cabeçalho de Continuidade Página 2
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 2, 'F');

  drawGSRLogo(doc, 14, 5, 0.9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS • MATRIZ TÉCNICA COMPARATIVA DE RECURSOS', 32, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153);
  doc.text('Detalhamento funcional e de engenharia por módulo do sistema', 32, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento Oficial • ${dataAtual}`, 196, 15, { align: 'right' });

  // 2. Tabela de Comparação Estruturada por Categoria via AutoTable
  const tableBody: (string | number)[][] = [];

  // Categorias únicas
  const categories = Array.from(new Set(PLAN_COMPARISON_FEATURES.map((f) => f.category)));

  categories.forEach((cat) => {
    // Linha de Cabeçalho da Categoria
    tableBody.push([
      `CATEGORIA: ${cat.toUpperCase()}`,
      '',
      '',
    ]);

    // Features pertencentes à categoria
    const feats = PLAN_COMPARISON_FEATURES.filter((f) => f.category === cat);
    feats.forEach((f) => {
      const liteStr = typeof f.lite === 'string'
        ? f.lite
        : f.lite
        ? '✓ Incluso'
        : '— Não Incluso';

      const bizStr = typeof f.business === 'string'
        ? f.business
        : f.business
        ? '✓ Incluso'
        : '— Não Incluso';

      tableBody.push([
        f.name,
        liteStr,
        bizStr,
      ]);
    });
  });

  // Linhas adicionais de diferenciais técnicos e infraestrutura
  tableBody.push([
    'CATEGORIA: INFRAESTRUTURA, SEGURANÇA E SUPORTE',
    '',
    '',
  ]);
  tableBody.push([
    'Banco de Dados Isolado com Row Level Security (PostgreSQL)',
    '✓ Incluso (RLS Nativo)',
    '✓ Incluso (RLS Nativo)',
  ]);
  tableBody.push([
    'Período Gratuito de Avaliação sem Cobrança Imediata',
    '✓ 7 Dias Grátis',
    '✓ 7 Dias Grátis',
  ]);
  tableBody.push([
    'Acesso Web Responsivo (Computador, Tablet e Smartphone)',
    '✓ Incluso (Multiplataforma)',
    '✓ Incluso (Multiplataforma)',
  ]);
  tableBody.push([
    'Processamento Oficial de Pagamentos com Criptografia',
    '✓ Stripe Certified PCI-DSS',
    '✓ Stripe Certified PCI-DSS',
  ]);
  tableBody.push([
    'Cancelamento Fácil a Qualquer Momento sem Multas',
    '✓ Sem Fidelidade Obrigatória',
    '✓ Sem Fidelidade Obrigatória',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        'RECURSO OU FUNCIONALIDADE',
        `PLANO LITE (${formatCurrency(lite.monthlyPrice)}/mês)`,
        `PLANO BUSINESS PME (${formatCurrency(business.monthlyPrice)}/mês)`,
      ],
    ],
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 92, halign: 'left' },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 45, halign: 'center' },
    },
    didParseCell: (data) => {
      // Se for a linha de cabeçalho de categoria
      const rawText = String(data.cell.raw || '');
      if (rawText.startsWith('CATEGORIA:')) {
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontSize = 7.5;
        if (data.column.index === 0) {
          data.cell.colSpan = 3;
        }
      }

      // Estilo das colunas Lite e Business
      if (!rawText.startsWith('CATEGORIA:')) {
        if (data.column.index === 1) {
          if (rawText.includes('✓')) {
            data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            data.cell.styles.fontStyle = 'bold';
          } else if (rawText.includes('—')) {
            data.cell.styles.textColor = [148, 163, 184]; // slate-400
          }
        }
        if (data.column.index === 2) {
          data.cell.styles.fillColor = [248, 250, 252]; // leve destaque na coluna business
          if (rawText.includes('✓')) {
            data.cell.styles.textColor = [79, 70, 229]; // indigo-600
            data.cell.styles.fontStyle = 'bold';
          } else if (rawText.includes('—')) {
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
      }
    },
  });

  // 3. Card de Resumo de Engenharia e Garantia Comercial
  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalTableY, 182, 38, 2.5, 2.5, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(14, finalTableY, 3, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DIFERENCIAIS TÉCNICOS & COMO CONTRATAR:', 21, finalTableY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const garantiaItems = [
    '• 7 Dias Grátis: Ao criar sua conta, você tem acesso irrestrito para testar a ferramenta sem necessidade de suporte prévio.',
    '• Cancelamento sem burocracia: Você tem total autonomia para gerenciar ou cancelar sua assinatura a qualquer momento.',
    '• Isolamento e Privacidade (LGPD): Cada usuário possui chaves criptográficas próprias e isolamento absoluto de banco de dados.',
    '• Suporte e Atendimento: Suporte via e-mail e canais oficiais para dúvidas de implantação, importação de dados e precificação.',
  ];

  let gY = finalTableY + 12;
  garantiaItems.forEach((item) => {
    doc.text(item, 21, gY, { maxWidth: 172 });
    gY += 5.5;
  });

  // 4. Rodapé Página 2
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('GSR Finanças SaaS • Proposta Comercial Oficial • Válida para Novos Usuários e Upgrades', 14, 289);
  doc.text('Acesse o aplicativo diretamente em qualquer navegador: app.gsrfinancas.com.br', 14, 293);
  doc.text('Página 2 de 2', 196, 291, { align: 'right' });

  // Nome do arquivo PDF gerado
  const sanitizedDate = now.toISOString().slice(0, 10);
  const fileName = `gsr_financas_material_comercial_planos_${sanitizedDate}.pdf`;

  doc.save(fileName);
};
