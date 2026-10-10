import type { DespesaRow } from '../types/app';
import { formatCurrency, formatDate } from './formatters';
import { calcularIRPFMensal, auditPeriodoFiscal } from './fiscalEngine';

export interface LivroCaixaHeaderInfo {
  nomeContribuinte: string;
  cpfCnpjContribuinte: string;
  ocupacaoPrincipal?: string;
  mes: number; // 1-12
  ano: number;
}

/**
 * Gera e abre uma janela de impressão formatada em padrão A4 para o Livro Caixa Digital
 * em conformidade com as regras da Receita Federal (RIR/2018).
 */
export function printLivroCaixaReport(
  despesas: DespesaRow[],
  info: LivroCaixaHeaderInfo
): void {
  const audit = auditPeriodoFiscal(despesas);
  const calculoIRPF = calcularIRPFMensal(audit.baseCalculo);

  // Ordena lançamentos cronologicamente
  const lancamentos = [...audit.itensValidos].sort(
    (a, b) => new Date(a.expense.data_gasto).getTime() - new Date(b.expense.data_gasto).getTime()
  );

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mesExtenso = mesesNomes[info.mes - 1] || `Mês ${info.mes}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Livro Caixa Digital - ${mesExtenso}/${info.ano} - ${info.nomeContribuinte}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 18px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .header-subtitle {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin: 0 0 8px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 8px;
      background: #f8fafc;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 10px;
    }
    .info-item strong {
      display: block;
      color: #64748b;
      font-size: 9px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 16px 0;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }
    .card-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .card-value.highlight {
      color: #059669;
    }
    .card-value.danger {
      color: #b91c1c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 10px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 9px;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .tax-box {
      margin-top: 20px;
      padding: 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
    }
    .tax-box h4 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
    }
    .tax-table {
      width: 100%;
      font-size: 10px;
      border-collapse: collapse;
    }
    .tax-table td {
      padding: 4px 6px;
      border: none;
    }
    .footer-stamp {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
    }
    .sign-line {
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-weight: 600;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0f172a; color: white; padding: 12px 16px; margin-bottom: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <span style="font-weight: bold; font-size: 13px;">Demonstrativo do Livro Caixa Digital</span>
      <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">Pronto para impressão / Salvar em PDF</span>
    </div>
    <button onclick="window.print()" style="background: #10b981; color: #022c22; font-weight: bold; padding: 6px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
      🖨️ Imprimir / Salvar como PDF
    </button>
  </div>

  <div class="header-box">
    <h1 class="header-title">GSR Finanças — Livro Caixa Digital</h1>
    <p class="header-subtitle">Demonstrativo de Receitas e Despesas Escrituradas nos termos do Art. 104 do RIR/2018 (Decreto nº 9.580/2018)</p>
    
    <div class="info-grid">
      <div class="info-item">
        <strong>Contribuinte Titular:</strong>
        ${info.nomeContribuinte || 'Não informado'}
      </div>
      <div class="info-item">
        <strong>CPF / CNPJ:</strong>
        <span class="font-mono">${info.cpfCnpjContribuinte || 'Não cadastrado'}</span>
      </div>
      <div class="info-item">
        <strong>Mês/Ano de Apuração:</strong>
        ${mesExtenso} / ${info.ano}
      </div>
      <div class="info-item" style="grid-column: span 3; border-top: 1px dashed #e2e8f0; padding-top: 4px; margin-top: 4px;">
        <strong>Ocupação / Atividade Profissional:</strong>
        ${info.ocupacaoPrincipal || 'Profissional Autônomo / Prestador de Serviços'}
      </div>
    </div>
  </div>

  <div class="summary-cards">
    <div class="card">
      <div class="card-title">Receita Bruta do Mês</div>
      <div class="card-value highlight">${formatCurrency(audit.totalReceitas)}</div>
    </div>
    <div class="card">
      <div class="card-title">Despesas Dedutíveis</div>
      <div class="card-value danger">${formatCurrency(audit.totalDespesasDedutiveis)}</div>
    </div>
    <div class="card">
      <div class="card-title">Base de Cálculo Líquida</div>
      <div class="card-value">${formatCurrency(audit.baseCalculo)}</div>
    </div>
    <div class="card">
      <div class="card-title">DARF IRPF Estimado</div>
      <div class="card-value ${calculoIRPF.impostoDevido > 0 ? 'danger' : 'highlight'}">${formatCurrency(calculoIRPF.impostoDevido)}</div>
    </div>
  </div>

  <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 18px 0 6px 0; color: #0f172a;">
    1. Registro Cronológico das Despesas Dedutíveis
  </h3>

  <table>
    <thead>
      <tr>
        <th style="width: 75px;">Data</th>
        <th style="width: 110px;">CPF/CNPJ Fornec.</th>
        <th>Histórico / Descrição da Despesa</th>
        <th style="width: 100px;">Categoria</th>
        <th style="width: 70px;" class="text-center">Comprovante</th>
        <th style="width: 90px;" class="text-right">Valor (R$)</th>
      </tr>
    </thead>
    <tbody>
      ${
        lancamentos.length === 0
          ? `<tr><td colspan="6" class="text-center" style="padding: 20px; color: #94a3b8;">Nenhuma despesa dedutível escriturada para o período.</td></tr>`
          : lancamentos
              .map((item) => {
                const exp = item.expense;
                const hasDoc = Boolean(exp.foto_comprovante_url);
                return `
        <tr>
          <td class="font-mono">${formatDate(exp.data_gasto)}</td>
          <td class="font-mono">${exp.cpf_cnpj_participante || '-'}</td>
          <td><strong>${exp.descricao}</strong>${exp.nome_participante ? ` <span style="color:#64748b;">(${exp.nome_participante})</span>` : ''}</td>
          <td>${exp.categoria}</td>
          <td class="text-center">${hasDoc ? '✔️ Anexado' : '⚠️ Pendente'}</td>
          <td class="text-right font-mono font-bold">${formatCurrency(exp.valor)}</td>
        </tr>`;
              })
              .join('')
      }
    </tbody>
  </table>

  <div class="tax-box">
    <h4>2. Memória de Cálculo — IRPF Mensal (Carnê-Leão / DARF Cód. 0190)</h4>
    <table class="tax-table">
      <tr>
        <td><strong>(+) Receitas Escrituradas no Mês:</strong></td>
        <td class="text-right font-mono">${formatCurrency(audit.totalReceitas)}</td>
      </tr>
      <tr>
        <td><strong>(-) Despesas Operacionais Escrituradas no Livro Caixa:</strong></td>
        <td class="text-right font-mono text-danger">- ${formatCurrency(audit.totalDespesasDedutiveis)}</td>
      </tr>
      <tr style="border-top: 1px solid #86efac;">
        <td><strong>(=) Base de Cálculo do IRPF:</strong></td>
        <td class="text-right font-mono font-bold">${formatCurrency(calculoIRPF.baseCalculo)}</td>
      </tr>
      <tr>
        <td><strong>(x) Alíquota Efetiva da Faixa:</strong></td>
        <td class="text-right font-mono">${calculoIRPF.aliquota * 100}%</td>
      </tr>
      <tr>
        <td><strong>(-) Parcela a Deduzir do Imposto:</strong></td>
        <td class="text-right font-mono">- ${formatCurrency(calculoIRPF.parcelaDeduzir)}</td>
      </tr>
      <tr style="border-top: 2px solid #16a34a; font-weight: bold; font-size: 11px;">
        <td><strong>(=) Imposto de Renda Devido (DARF Estimado Cód. 0190):</strong></td>
        <td class="text-right font-mono font-bold" style="color: #166534;">${formatCurrency(calculoIRPF.impostoDevido)}</td>
      </tr>
    </table>
    <p style="font-size: 9px; color: #166534; margin: 8px 0 0 0;">
      * O DARF gerado via Carnê-Leão Web no portal e-CAC vence no último dia útil do mês subsequente ao de competência dos rendimentos.
    </p>
  </div>

  <div class="signature-area">
    <div>
      <div class="sign-line">${info.nomeContribuinte || 'Contribuinte Responsável'}</div>
      <span style="color: #64748b;">Assinatura do Contribuinte</span>
    </div>
    <div>
      <div class="sign-line">Contador Responsável / Auditoria Técnica</div>
      <span style="color: #64748b;">CRC Nº: ____________________</span>
    </div>
  </div>

  <div class="footer-stamp">
    <span>Emitido digitalmente via plataforma GSR Finanças — Módulo Fiscal Business</span>
    <span>Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
  </div>
</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups no navegador para visualizar o Livro Caixa Digital.');
  }
}

/**
 * Exporta os dados do Livro Caixa em CSV estruturado com memória de cálculo
 */
export function exportLivroCaixaCSV(
  despesas: DespesaRow[],
  info: LivroCaixaHeaderInfo
): void {
  const audit = auditPeriodoFiscal(despesas);
  const calculoIRPF = calcularIRPFMensal(audit.baseCalculo);

  const lines: string[] = [];
  lines.push('LIVRO CAIXA DIGITAL - GSR FINANCAS');
  lines.push(`Contribuinte;${info.nomeContribuinte};CPF/CNPJ;${info.cpfCnpjContribuinte}`);
  lines.push(`Periodo;${info.mes}/${info.ano};Ocupacao;${info.ocupacaoPrincipal || 'Autonomo'}`);
  lines.push('');
  lines.push('DATA;CPF_CNPJ_FORNECEDOR;FORNECEDOR_NOME;HISTORICO_DESPESA;CATEGORIA;VALOR_R$');

  const lancamentos = [...audit.itensValidos].sort(
    (a, b) => new Date(a.expense.data_gasto).getTime() - new Date(b.expense.data_gasto).getTime()
  );

  lancamentos.forEach((item) => {
    const exp = item.expense;
    const valorStr = exp.valor.toFixed(2).replace('.', ',');
    lines.push(
      `${exp.data_gasto};"${exp.cpf_cnpj_participante || ''}";"${(exp.nome_participante || '').replace(/"/g, '""')}";"${exp.descricao.replace(/"/g, '""')}";"${exp.categoria}";${valorStr}`
    );
  });

  lines.push('');
  lines.push('RESUMO FISCAL E MEMORIA DE CALCULO');
  lines.push(`Receita Bruta Total;R$ ${audit.totalReceitas.toFixed(2).replace('.', ',')}`);
  lines.push(`Despesas Dedutiveis Livro Caixa;R$ ${audit.totalDespesasDedutiveis.toFixed(2).replace('.', ',')}`);
  lines.push(`Base de Calculo Liquida;R$ ${audit.baseCalculo.toFixed(2).replace('.', ',')}`);
  lines.push(`Aliquota IRPF;${(calculoIRPF.aliquota * 100).toFixed(1)}%`);
  lines.push(`Parcela a Deduzir;R$ ${calculoIRPF.parcelaDeduzir.toFixed(2).replace('.', ',')}`);
  lines.push(`DARF IRPF Estimado (Cod 0190);R$ ${calculoIRPF.impostoDevido.toFixed(2).replace('.', ',')}`);

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Livro_Caixa_${info.ano}_${String(info.mes).padStart(2, '0')}_${info.nomeContribuinte.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
