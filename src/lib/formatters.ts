/**
 * Utilitários Oficiais de Formatação e Parse no Padrão Brasileiro (pt-BR / ABNT)
 * GSR Finanças - Gestão Financeira Facilitada
 */

/**
 * Formata um valor numérico como moeda brasileira (Real - BRL).
 * Exemplo: 1250.5 => "R$ 1.250,50"
 */
export const formatCurrency = (val: number | null | undefined): string => {
  const amount = Number(val) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formata um número decimal ou inteiro no padrão brasileiro (vírgula para decimal, ponto para milhar).
 * Exemplo: 1250.5 => "1.250,50" ou 1.67 => "1,67"
 */
export const formatNumber = (
  val: number | string | null | undefined,
  minDecimals: number = 0,
  maxDecimals: number = 2
): string => {
  const amount = typeof val === 'number' ? val : Number(val) || 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(amount);
};

/**
 * Formata uma porcentagem no padrão brasileiro (com vírgula).
 * Exemplo: 40.5 => "40,5%" | 0 => "0,0%"
 */
export const formatPercent = (
  val: number | null | undefined,
  decimals: number = 1
): string => {
  const amount = Number(val) || 0;
  return `${formatNumber(amount, decimals, decimals)}%`;
};

/**
 * Faz o parse seguro de valores numéricos digitados por usuários brasileiros.
 * Lida perfeitamente com:
 * - "1.500,50" => 1500.5
 * - "1500,50" => 1500.5
 * - "1.500" => 1500
 * - "1500.50" => 1500.5
 * - "1500" => 1500
 * - Evita o bug clássico de parseFloat("1.500,50") retornar 1.5!
 */
export const parseBrazilianNumber = (
  val: string | number | null | undefined
): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const raw = String(val).trim();
  if (!raw) return 0;

  // Remove "R$", espaços e caracteres inválidos, mantendo dígitos, sinais, pontos e vírgulas
  const clean = raw.replace(/[^\d.,-]/g, '').trim();
  if (!clean) return 0;

  // 1. Possui ponto E vírgula: padrão brasileiro explícito (ex: "1.250,50" ou "-1.500,00")
  if (clean.includes('.') && clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // 2. Possui apenas vírgula (ex: "1250,50" ou "2,5")
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.')) || 0;
  }

  // 3. Possui apenas pontos:
  if (clean.includes('.')) {
    const parts = clean.split('.');
    // Mais de um ponto: pontos de milhar brasileiros (ex: "1.000.000")
    if (parts.length > 2) {
      return parseFloat(clean.replace(/\./g, '')) || 0;
    }
    // Exatamente 1 ponto:
    // Se a parte após o ponto tiver exatamente 3 dígitos e a parte anterior tiver >= 1 dígito (ex: "1.500" ou "250.000"),
    // o usuário digitou separador de milhar no padrão brasileiro sem centavos!
    if (parts[1].length === 3 && parts[0].length >= 1) {
      return parseFloat(clean.replace('.', '')) || 0;
    }
    // Caso contrário (ex: "1500.50" ou "1.5"), parse decimal normal
    return parseFloat(clean) || 0;
  }

  return parseFloat(clean) || 0;
};

/**
 * Formata um valor para exibição em inputs monetários com padrão brasileiro.
 * Exemplo: 1500 => "1.500,00"
 */
export const formatCurrencyInput = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseBrazilianNumber(val);
  if (isNaN(num) || num === 0) return '0,00';
  return formatNumber(num, 2, 2);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const getCategoryBadgeStyle = (category: string): { bg: string; text: string; border: string } => {
  switch (category) {
    case 'Materiais':
      return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'Mão de Obra':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'Documentação':
      return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'Ferramentas':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'Outros':
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
  }
};
