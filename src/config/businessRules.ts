/**
 * CONFIGURAÇÃO DECLARATIVA DE REGRAS DE NEGÓCIO - GSR FINANÇAS
 * Central de parametrização para arquitetura escalável e Vibecoding.
 * 
 * Todas as regras de negócio, formas de pagamento, tipos de imóvel
 * e segmentos PME devem ser configurados aqui como Single Source of Truth.
 */

export interface PaymentMethodConfig {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  enabled: boolean;
}

export interface BusinessSectorConfig {
  id: 'comercio' | 'servico' | 'producao';
  label: string;
  badge: string;
  description: string;
  defaultStockMin: number;
  highlightStock: boolean;
}

export interface StockUnitConfig {
  value: string;
  label: string;
  symbol: string;
}

/**
 * 1. Formas de Pagamento Homologadas no Sistema
 */
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'pix', label: 'Pix', shortLabel: 'Pix', description: 'Transferência instantânea via Banco Central', enabled: true },
  { id: 'credito', label: 'Cartão de Crédito', shortLabel: 'Crédito', description: 'Pagamento à vista ou parcelado no cartão', enabled: true },
  { id: 'debito', label: 'Cartão de Débito', shortLabel: 'Débito', description: 'Débito em conta corrente', enabled: true },
  { id: 'dinheiro', label: 'Dinheiro', shortLabel: 'Dinheiro', description: 'Espécie / Cédulas', enabled: true },
  { id: 'boleto', label: 'Boleto Bancário', shortLabel: 'Boleto', description: 'Cobrança via compensação bancária', enabled: true },
  { id: 'transferencia', label: 'Transferência Bancária', shortLabel: 'TED/DOC', description: 'Transferência bancária tradicional', enabled: true },
];

export const FORMA_PAGAMENTO_MAP: Record<string, string> = PAYMENT_METHODS.reduce((acc, curr) => {
  acc[curr.id] = curr.shortLabel;
  return acc;
}, {} as Record<string, string>);

/**
 * 2. Segmentos de Negócio PME (Comércio vs Serviço vs Produção/Insumos)
 */
export const BUSINESS_SECTORS: Record<string, BusinessSectorConfig> = {
  comercio: {
    id: 'comercio',
    label: 'Comércio / Varejo',
    badge: 'Comércio',
    description: 'Foco em mercadorias para revenda, produtos acabados e giro de estoque.',
    defaultStockMin: 5,
    highlightStock: true,
  },
  servico: {
    id: 'servico',
    label: 'Prestação de Serviços',
    badge: 'Serviço',
    description: 'Foco em horas de trabalho, mão de obra, ferramentas e peças para prestação de serviços.',
    defaultStockMin: 2,
    highlightStock: false,
  },
  producao: {
    id: 'producao',
    label: 'Produção / Insumos',
    badge: 'Produção & Insumos',
    description: 'Insumos, matéria-prima e ingredientes para produção e fabricação própria (ex: hambúrguer artesanal, gastronomia, manufatura).',
    defaultStockMin: 5,
    highlightStock: true,
  },
};

/**
 * 3. Tipos de Imóvel e Projetos de Construção Civil
 */
export const PROPERTY_TYPES: Record<string, string> = {
  terreno: 'Terreno / Lote',
  casa: 'Casa Residencial',
  apartamento: 'Apartamento',
  chacara: 'Chácara / Sítio',
  comercial: 'Ponto Comercial',
  reforma: 'Reforma',
  outro: 'Projeto',
};

/**
 * 4. Unidades de Medida Homologadas para Estoque
 */
export const STOCK_UNITS: StockUnitConfig[] = [
  { value: 'un', label: 'Unidade (un)', symbol: 'un' },
  { value: 'cx', label: 'Caixa (cx)', symbol: 'cx' },
  { value: 'kg', label: 'Quilograma (kg)', symbol: 'kg' },
  { value: 'g', label: 'Grama (g)', symbol: 'g' },
  { value: 'l', label: 'Litro (l)', symbol: 'l' },
  { value: 'ml', label: 'Mililitro (ml)', symbol: 'ml' },
  { value: 'm', label: 'Metro (m)', symbol: 'm' },
  { value: 'par', label: 'Par (par)', symbol: 'par' },
];
