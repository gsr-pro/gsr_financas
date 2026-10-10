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
 * Redesenhado em formato horizontal/estruturado (um plano abaixo do outro)
 * para evitar qualquer sobreposição de texto e entregar uma experiência executiva de alto nível.
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
  const contador = PLANS.contador;

  // =========================================================================
  // PÁGINA 1: CATÁLOGO EXECUTIVO DOS 3 PLANOS (UM ABAIXO DO OUTRO)
  // =========================================================================

  // 1. Cabeçalho Corporativo Superior Escuro (32mm)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Faixa de destaque verde esmeralda no topo
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, 210, 2.5, 'F');

  // Logotipo Vetorial Oficial
  drawGSRLogo(doc, 14, 7, 1.15);

  // Tipografia da Marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS', 36, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('GESTÃO FINANCEIRA FACILITADA • OBRAS, NEGÓCIOS & ESCRITURAÇÃO FISCAL', 36, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Catálogo Oficial de Planos Comerciais e Cobertura de Recursos', 36, 25);

  // Lado direito: Selo de Degustação 7 Dias Grátis
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(144, 7, 52, 17, 2, 2, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(144, 7, 52, 17, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('★ 7 DIAS GRÁTIS', 170, 12.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(226, 232, 240);
  doc.text('Teste sem fidelidade', 170, 16.5, { align: 'center' });
  doc.text(`Emissão: ${dataAtual}`, 170, 20.5, { align: 'center' });

  // 2. Faixa Informativa dos 3 Ambientes da Plataforma (y: 35 a 49)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Catálogo Comercial • Escolha o Plano Ideal para a sua Realidade', 14, 38.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Plataforma unificada com três ecossistemas nativos e módulo fiscal oficial. Sem burocracia e cancelamento com 1 clique.',
    14,
    42.5
  );

  // 3 Mini-badges de Ambientes Nativos
  const envCardW = 58;
  const envY = 44.5;
  const envH = 5.5;

  // Ambiente de Obra
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, envY, envCardW, envH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(6, 95, 70);
  doc.text('OBRAS & REFORMAS:', 16.5, envY + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Terrenos, mão de obra e m²', 42, envY + 3.8);

  // Ambiente de Negócios
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(76, envY, envCardW, envH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(55, 48, 163);
  doc.text('NEGÓCIOS & PME:', 78.5, envY + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Ficha técnica, Markup e CMV', 101, envY + 3.8);

  // Ambiente Pessoal & Fiscal
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(138, envY, envCardW, envH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(146, 64, 14);
  doc.text('PESSOAL & FISCAL:', 140.5, envY + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Carnê-Leão e-CAC e Hub CRC', 165, envY + 3.8);


  // =========================================================================
  // CARD 1: PLANO CONTROLE PESSOAL (HORIZONTAL, y: 53 a 120 - Altura: 67mm)
  // =========================================================================
  const card1Y = 53;
  const card1H = 67;

  // Fundo e borda do card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(14, card1Y, 182, card1H, 2.5, 2.5, 'FD');

  // Friso vertical verde esmeralda à esquerda
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(14, card1Y, 3, card1H, 'F');

  // --- COLUNA DA ESQUERDA: Identidade e Preço (x: 20 a 74) ---
  // Badge da Persona
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(20, card1Y + 4, 30, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('OBRAS & PESSOAL', 35, card1Y + 7.2, { align: 'center' });

  // Nome do Plano
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Controle Pessoal', 20, card1Y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Indivíduos, casais e reformas residenciais', 20, card1Y + 18);

  // Preço Mensal com Destaque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${lite.monthlyPrice.toFixed(2).replace('.', ',')}`, 20, card1Y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('/mês', 46, card1Y + 25.5);

  // Preço original tachado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('R$ 14,90', 56, card1Y + 25.5);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(56, card1Y + 24.5, 68, card1Y + 24.5);

  // Selo Promocional 50% OFF
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(20, card1Y + 29, 53, 5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('★ 50% OFF nos 2 primeiros meses', 46.5, card1Y + 32.7, { align: 'center' });

  // Preço Anual
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`Anual: R$ ${lite.yearlyPrice.toFixed(2).replace('.', ',')}/ano`, 20, card1Y + 39.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('(Apenas R$ 6,20/mês • 2 meses grátis)', 20, card1Y + 43.5);

  // Pill de Ambientes Inclusos
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(20, card1Y + 47, 53, 6, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text('✓ 2 Ambientes (Obra + Pessoal)', 46.5, card1Y + 51.2, { align: 'center' });

  // Linha Divisória Vertical
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(77, card1Y + 4, 77, card1Y + card1H - 4);

  // --- COLUNA DA DIREITA: Recursos Estruturados em 2 Subcolunas (x: 81 a 192) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('RECURSOS E COBERTURA INCLUSA NESTE PLANO:', 81, card1Y + 8);

  const p1Col1 = [
    '✓ Gestão completa de Obras, Lotes e Reformas',
    '✓ Custo real da obra por m² construído',
    '✓ Controle de mão de obra e materiais da construção',
    '✓ Total pago vs contas a pagar na obra',
  ];

  const p1Col2 = [
    '✓ Finanças Pessoais, salários e despesas fixas',
    '✓ Painel de investimentos e reserva de emergência',
    '✓ Upload de notas fiscais e comprovantes no Storage',
    '✓ Extrato financeiro dinâmico e relatórios em PDF',
  ];

  let p1Y = card1Y + 14.5;
  p1Col1.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(5, 150, 105); // check verde
    doc.text('✓', 81, p1Y);
    doc.setTextColor(30, 41, 59);
    doc.text(item.replace('✓ ', ''), 85, p1Y);
    p1Y += 5.5;
  });

  p1Y = card1Y + 14.5;
  p1Col2.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(5, 150, 105);
    doc.text('✓', 137, p1Y);
    doc.setTextColor(30, 41, 59);
    doc.text(item.replace('✓ ', ''), 141, p1Y);
    p1Y += 5.5;
  });

  // Faixa inferior interna explicativa de perfil
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(81, card1Y + 41, 111, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Ideal para:', 84, card1Y + 46);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Pessoas físicas e famílias que querem manter as contas pessoais em dia e simultaneamente calcular e controlar os gastos reais de uma construção ou reforma sem surpresas.',
    84,
    card1Y + 50,
    { maxWidth: 105 }
  );


  // =========================================================================
  // CARD 2: PLANO GESTÃO DE OBRAS & NEGÓCIOS (y: 124 a 193 - Altura: 69mm)
  // =========================================================================
  const card2Y = 124;
  const card2H = 69;

  // Fundo e borda índigo
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(99, 102, 241); // indigo-500
  doc.setLineWidth(0.4);
  doc.roundedRect(14, card2Y, 182, card2H, 2.5, 2.5, 'FD');
  doc.setLineWidth(0.3);

  // Friso vertical índigo à esquerda
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(14, card2Y, 3, card2H, 'F');

  // --- COLUNA DA ESQUERDA: Identidade e Preço (x: 20 a 74) ---
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(20, card2Y + 4, 34, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MAIS POPULAR • PME', 37, card2Y + 7.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Obras & Negócios', 20, card2Y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Comércio, prestadores, PMEs e oficinas', 20, card2Y + 18);

  // Preço Mensal com Destaque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${business.monthlyPrice.toFixed(2).replace('.', ',')}`, 20, card2Y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('/mês', 46, card2Y + 25.5);

  // Preço original tachado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('R$ 29,90', 56, card2Y + 25.5);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(56, card2Y + 24.5, 68, card2Y + 24.5);

  // Selo Promocional 50% OFF
  doc.setFillColor(224, 231, 255); // indigo-100
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(20, card2Y + 29, 53, 5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text('★ 50% OFF nos 2 primeiros meses', 46.5, card2Y + 32.7, { align: 'center' });

  // Preço Anual
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`Anual: R$ ${business.yearlyPrice.toFixed(2).replace('.', ',')}/ano`, 20, card2Y + 39.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('(Apenas R$ 12,45/mês • 2 meses grátis)', 20, card2Y + 43.5);

  // Pill de Ambientes Inclusos
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(20, card2Y + 47, 53, 6, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(55, 48, 163);
  doc.text('✓ 3 Ambientes (Obra + Pessoal + Negócio)', 46.5, card2Y + 51.2, { align: 'center' });

  // Linha Divisória Vertical
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(77, card2Y + 4, 77, card2Y + card2H - 4);

  // --- COLUNA DA DIREITA: Recursos PME Estruturados em 2 Subcolunas ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(49, 46, 129); // indigo-900
  doc.text('TUDO DO PLANO PESSOAL MAIS GESTÃO PME & EMPRESARIAL:', 81, card2Y + 8);

  const p2Col1 = [
    '✓ Ficha técnica completa de produtos e insumos',
    '✓ Calculadora inteligente de Markup Divisor e Preço',
    '✓ Ponto de equilíbrio financeiro (Break-Even)',
    '✓ Cálculo automatizado de CMV e margem operacional',
  ];

  const p2Col2 = [
    '✓ Gestão de múltiplos projetos e obras simultâneas',
    '✓ Controle de estoque comercial com alertas mínimos',
    '✓ Separação de custos fixos, variáveis e tributos',
    '✓ Relatórios gerenciais e demonstrativos de resultado',
  ];

  let p2Y = card2Y + 14.5;
  p2Col1.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(79, 70, 229); // check indigo
    doc.text('✓', 81, p2Y);
    doc.setTextColor(30, 41, 59);
    doc.text(item.replace('✓ ', ''), 85, p2Y);
    p2Y += 5.5;
  });

  p2Y = card2Y + 14.5;
  p2Col2.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(79, 70, 229);
    doc.text('✓', 137, p2Y);
    doc.setTextColor(30, 41, 59);
    doc.text(item.replace('✓ ', ''), 141, p2Y);
    p2Y += 5.5;
  });

  // Faixa inferior explicativa de perfil
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(81, card2Y + 41, 111, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(67, 56, 202);
  doc.text('Ideal para:', 84, card2Y + 46);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Empreendedores, comércios, pequenas indústrias, prestadores e construtores que precisam calcular com exatidão sua margem de lucro, gerenciar insumos e administrar múltiplas obras.',
    84,
    card2Y + 50,
    { maxWidth: 105 }
  );


  // =========================================================================
  // CARD 3: PLANO CONTADOR + CARNÊ-LEÃO (y: 197 a 274 - Altura: 77mm)
  // O NOVO PLANO FISCAL (SEM CUPOM PROMOCIONAL, PREÇO CHEIO R$ 49,90)
  // =========================================================================
  const card3Y = 197;
  const card3H = 77;

  // Fundo âmbar suave e borda dourada âmbar
  doc.setFillColor(254, 252, 232); // amber-50
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.6);
  doc.roundedRect(14, card3Y, 182, card3H, 2.5, 2.5, 'FD');
  doc.setLineWidth(0.3);

  // Friso vertical dourado âmbar à esquerda
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(14, card3Y, 3, card3H, 'F');

  // --- COLUNA DA ESQUERDA: Identidade e Preço (x: 20 a 74) ---
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(20, card3Y + 4, 46, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('★ O NOVO PLANO FISCAL & CONTADOR', 43, card3Y + 7.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(120, 53, 15); // amber-900
  doc.text('Contador + Carnê-Leão', 20, card3Y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(146, 64, 14);
  doc.text('Autônomos, médicos, advogados e contabilidade', 20, card3Y + 18);

  // Preço Mensal (Sem cupom promocional!)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`R$ ${contador.monthlyPrice.toFixed(2).replace('.', ',')}`, 20, card3Y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text('/mês', 46, card3Y + 25.5);

  // Selo de Adesão Sem Taxas (Sem cupom)
  doc.setFillColor(254, 240, 138); // amber-200
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(20, card3Y + 29, 53, 5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(113, 63, 18);
  doc.text('Sem fidelidade • Cancele quando quiser', 46.5, card3Y + 32.7, { align: 'center' });

  // Preço Anual
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`Anual: R$ ${contador.yearlyPrice.toFixed(2).replace('.', ',')}/ano`, 20, card3Y + 39.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text('(Apenas R$ 41,58/mês • 2 meses grátis)', 20, card3Y + 43.5);

  // Pill de Ambientes Inclusos (Acesso Total)
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(20, card3Y + 47, 53, 6, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text('✓ Acesso Total (Multi-Ambiente + Fiscal)', 46.5, card3Y + 51.2, { align: 'center' });

  // Linha Divisória Vertical
  doc.setDrawColor(253, 230, 138);
  doc.setLineWidth(0.3);
  doc.line(77, card3Y + 4, 77, card3Y + card3H - 4);

  // --- COLUNA DA DIREITA: Recursos Fiscais e Contábeis (x: 81 a 192) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15); // amber-900
  doc.text('SOLUÇÃO INTEGRAL: PESSOAL + PME + HUB FISCAL & CONTADOR:', 81, card3Y + 8);

  const p3Col1 = [
    '✓ Exportação Oficial Carnê-Leão Web e-CAC (CSV)',
    '✓ Livro Caixa Digital com deduções legais da RFB',
    '✓ Auditoria preventiva anti-malha fina com IA',
    '✓ Memória de cálculo e apuração do DARF 0190',
    '✓ Download em lote de comprovantes em ZIP',
  ];

  const p3Col2 = [
    '✓ Workspace do Contador: Gestão Multi-Cliente CRC',
    '✓ Vinculação por e-mail para outorga e auditoria',
    '✓ Modelos para Saúde (CRM/CRO), Obras e Apps',
    '✓ Demonstrativo DRE fiscal e conciliação mensal',
    '✓ Suporte contábil prioritário no fechamento',
  ];

  let p3Y = card3Y + 14.5;
  p3Col1.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9); // check âmbar
    doc.text('✓', 81, p3Y);
    doc.setTextColor(30, 41, 59);
    doc.text(item.replace('✓ ', ''), 85, p3Y);
    p3Y += 5.5;
  });

  p3Y = card3Y + 14.5;
  p3Col2.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9);
    doc.text('✓', 137, p3Y);
    doc.setTextColor(30, 41, 59);
    doc.text(item.replace('✓ ', ''), 141, p3Y);
    p3Y += 5.5;
  });

  // Faixa inferior explicativa de perfil
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(81, card3Y + 47, 111, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text('Ideal para:', 84, card3Y + 52);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(69, 26, 3);
  doc.text(
    'Médicos, dentistas, psicólogos, advogados, engenheiros, autônomos com alta movimentação tributária e escritórios de contabilidade que gerenciam a escrituração fiscal de múltiplos clientes.',
    84,
    card3Y + 56,
    { maxWidth: 105 }
  );


  // 5. Rodapé Corporativo da Página 1
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(203, 213, 225);
  doc.text('GSR Finanças • Tecnologia de Ponta em Gestão Financeira & Escrituração Fiscal Homologada', 14, 288.5);
  doc.text('Segurança de Nível Bancário PostgreSQL RLS • Criptografia SSL 256-bit • Compatível com e-CAC da Receita Federal', 14, 292.5);
  doc.text('Página 1 de 2', 196, 290.5, { align: 'right' });


  // =========================================================================
  // PÁGINA 2: MATRIZ DETALHADA DE COMPARAÇÃO DE RECURSOS DOS 3 PLANOS
  // =========================================================================
  doc.addPage();

  // 1. Cabeçalho de Continuidade Página 2 (24mm)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 2, 'F');

  drawGSRLogo(doc, 14, 5, 0.9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('GSR FINANÇAS • MATRIZ TÉCNICA COMPARATIVA DOS 3 PLANOS', 32, 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153);
  doc.text('Controle Pessoal vs Gestão de Obras & Negócios vs Contador + Carnê-Leão', 32, 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento Oficial • ${dataAtual}`, 196, 14.5, { align: 'right' });

  // 2. Tabela de Comparação Estruturada por Categoria via AutoTable
  const tableBody: (string | number)[][] = [];
  const categories = Array.from(new Set(PLAN_COMPARISON_FEATURES.map((f) => f.category)));

  categories.forEach((cat) => {
    // Linha de Cabeçalho da Categoria
    tableBody.push([
      `CATEGORIA: ${cat.toUpperCase()}`,
      '',
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

      const contStr = typeof f.contador === 'string'
        ? f.contador
        : f.contador
        ? '✓ Incluso'
        : '— Não Incluso';

      tableBody.push([
        f.name,
        liteStr,
        bizStr,
        contStr,
      ]);
    });
  });

  // Linhas adicionais de infraestrutura e conformidade
  tableBody.push([
    'CATEGORIA: INFRAESTRUTURA, SEGURANÇA E SUPORTE',
    '',
    '',
    '',
  ]);
  tableBody.push([
    'Banco de Dados Isolado com Row Level Security (PostgreSQL)',
    '✓ Incluso (RLS Nativo)',
    '✓ Incluso (RLS Nativo)',
    '✓ Incluso (RLS Nativo)',
  ]);
  tableBody.push([
    'Período Gratuito de Avaliação sem Cobrança Imediata',
    '✓ 7 Dias Grátis',
    '✓ 7 Dias Grátis',
    '✓ 7 Dias Grátis',
  ]);
  tableBody.push([
    'Acesso Web Responsivo (Computador, Tablet e Smartphone)',
    '✓ Incluso (Multiplataforma)',
    '✓ Incluso (Multiplataforma)',
    '✓ Incluso (Multiplataforma)',
  ]);
  tableBody.push([
    'Processamento Oficial de Pagamentos com Criptografia',
    '✓ Stripe PCI-DSS',
    '✓ Stripe PCI-DSS',
    '✓ Stripe PCI-DSS',
  ]);
  tableBody.push([
    'Layout Oficial de Exportação para e-CAC Carnê-Leão Web',
    '— Não Incluso',
    '— Não Incluso',
    '✓ 100% Homologado e-CAC',
  ]);

  autoTable(doc, {
    startY: 27,
    head: [
      [
        'RECURSO OU FUNCIONALIDADE',
        `PESSOAL (${formatCurrency(lite.monthlyPrice)}/m)`,
        `OBRAS & NEGÓCIOS (${formatCurrency(business.monthlyPrice)}/m)`,
        `CONTADOR (${formatCurrency(contador.monthlyPrice)}/m)`,
      ],
    ],
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 1.6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 72, halign: 'left' },
      1: { cellWidth: 36, halign: 'center' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
    },
    didParseCell: (data) => {
      const rawText = String(data.cell.raw || '');
      if (rawText.startsWith('CATEGORIA:')) {
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontSize = 7;
        if (data.column.index === 0) {
          data.cell.colSpan = 4;
        }
      }

      if (!rawText.startsWith('CATEGORIA:')) {
        if (data.column.index === 1) {
          if (rawText.includes('✓')) {
            data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            data.cell.styles.fontStyle = 'bold';
          } else if (rawText.includes('—')) {
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
        if (data.column.index === 2) {
          data.cell.styles.fillColor = [248, 250, 252];
          if (rawText.includes('✓')) {
            data.cell.styles.textColor = [79, 70, 229]; // indigo-600
            data.cell.styles.fontStyle = 'bold';
          } else if (rawText.includes('—')) {
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
        if (data.column.index === 3) {
          data.cell.styles.fillColor = [254, 252, 232]; // leve destaque âmbar no plano contador
          if (rawText.includes('✓')) {
            data.cell.styles.textColor = [180, 83, 9]; // amber-700
            data.cell.styles.fontStyle = 'bold';
          } else if (rawText.includes('—')) {
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
      }
    },
  });

  // 3. Card de Resumo de Engenharia e Garantia Comercial
  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
  const boxHeight = Math.min(30, 278 - finalTableY);

  if (finalTableY < 274) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalTableY, 182, boxHeight, 2, 2, 'FD');
    doc.setFillColor(16, 185, 129);
    doc.rect(14, finalTableY, 3, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DIFERENCIAIS TÉCNICOS & GARANTIAS COMERCIAIS:', 21, finalTableY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);

    const garantiaItems = [
      '• 7 Dias Grátis: Acesso irrestrito para testar a ferramenta sem taxa de adesão ou compromisso.',
      '• Cancelamento com 1 clique: Autonomia total para gerenciar ou cancelar sua assinatura a qualquer momento.',
      '• Isolamento e Privacidade (LGPD): Cada usuário possui isolamento absoluto de banco de dados via PostgreSQL RLS.',
      '• Homologação Carnê-Leão Web: Estrutura em conformidade estrita com o manual oficial da Receita Federal (e-CAC).',
    ];

    let gY = finalTableY + 9.5;
    garantiaItems.forEach((item) => {
      doc.text(item, 21, gY, { maxWidth: 172 });
      gY += 4.5;
    });
  }

  // 4. Rodapé Página 2
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(203, 213, 225);
  doc.text('GSR Finanças SaaS • Proposta Comercial Oficial • Válida para Novos Usuários e Upgrades', 14, 288.5);
  doc.text('Acesse o aplicativo diretamente em qualquer navegador: app.gsrfinancas.com.br', 14, 292.5);
  doc.text('Página 2 de 2', 196, 290.5, { align: 'right' });

  // Nome do arquivo PDF gerado
  const sanitizedDate = now.toISOString().slice(0, 10);
  const fileName = `gsr_financas_material_comercial_planos_${sanitizedDate}.pdf`;

  doc.save(fileName);
};
