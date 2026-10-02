import type {
  ItemInsumoFicha,
  UnidadeMedida,
} from '../types/business.types';

export interface PricingCalculationInput {
  nome: string;
  descricao?: string;
  insumos: Omit<ItemInsumoFicha, 'custo_total'>[];
  horasTrabalho: number;
  valorHoraMaoObra: number;
  custosFixosRateados: number;
  margemLucroDesejadaPct: number; // Ex: 35 (%)
  custoFixoMensalTotal?: number; // Para cálculo de ponto de equilíbrio
}

export interface PricingCalculationResult {
  insumosCompletos: ItemInsumoFicha[];
  custoInsumos: number;
  custoMaoObra: number;
  custosFixosRateados: number;
  custoTotalProducao: number;
  margemLucroDesejadaPct: number;
  precoVendaSugerido: number;
  lucroBrutoUnitario: number;
  markupMultiplicador: number;
  margemRealPct: number;
  pontoEquilibrioUnidades?: number;
}

/**
 * Motor Declarativo de Precificação & Markup
 *
 * Fórmula de Markup Base Divisor (Margem sobre o Preço de Venda):
 *   Preço = Custo Direto / (1 - (Margem% / 100))
 *
 * Exemplo:
 *   Custo = R$ 60,00
 *   Margem desejada = 40%
 *   Preço = 60 / (1 - 0.40) = 60 / 0.60 = R$ 100,00
 *   Lucro = R$ 40,00 (exatamente 40% do faturamento!)
 */
export const calculateProductPricing = (
  input: PricingCalculationInput
): PricingCalculationResult => {
  // 1. Calcula custo individual de cada insumo
  const insumosCompletos: ItemInsumoFicha[] = input.insumos.map((item) => {
    const total = Number(item.quantidade || 0) * Number(item.custo_unitario || 0);
    return {
      ...item,
      custo_total: Math.round(total * 100) / 100,
    };
  });

  // 2. Soma total dos insumos (CMV)
  const custoInsumos = insumosCompletos.reduce((acc, item) => acc + item.custo_total, 0);

  // 3. Custo da mão de obra direta
  const custoMaoObra =
    Math.round(Number(input.horasTrabalho || 0) * Number(input.valorHoraMaoObra || 0) * 100) / 100;

  // 4. Custos indiretos e fixos rateados
  const custosFixosRateados = Math.round(Number(input.custosFixosRateados || 0) * 100) / 100;

  // 5. Custo Total de Produção
  const custoTotalProducao =
    Math.round((custoInsumos + custoMaoObra + custosFixosRateados) * 100) / 100;

  // 6. Margem desejada (limite seguro: entre 1% e 95%)
  const margemPct = Math.max(1, Math.min(95, Number(input.margemLucroDesejadaPct || 30)));
  const divisorMarkup = (100 - margemPct) / 100;

  // 7. Preço de venda calculado
  const precoVendaSugerido =
    divisorMarkup > 0 ? Math.round((custoTotalProducao / divisorMarkup) * 100) / 100 : custoTotalProducao;

  // 8. Lucro bruto em reais e multiplicador de markup
  const lucroBrutoUnitario = Math.max(
    0,
    Math.round((precoVendaSugerido - custoTotalProducao) * 100) / 100
  );

  const markupMultiplicador =
    custoTotalProducao > 0
      ? Math.round((precoVendaSugerido / custoTotalProducao) * 100) / 100
      : 1;

  const margemRealPct =
    precoVendaSugerido > 0
      ? Math.round((lucroBrutoUnitario / precoVendaSugerido) * 1000) / 10
      : margemPct;

  // 9. Ponto de Equilíbrio (Break-even): quantas unidades cobrem os custos fixos mensais
  let pontoEquilibrioUnidades: number | undefined;
  if (input.custoFixoMensalTotal && input.custoFixoMensalTotal > 0 && lucroBrutoUnitario > 0) {
    pontoEquilibrioUnidades = Math.ceil(input.custoFixoMensalTotal / lucroBrutoUnitario);
  }

  return {
    insumosCompletos,
    custoInsumos,
    custoMaoObra,
    custosFixosRateados,
    custoTotalProducao,
    margemLucroDesejadaPct: margemPct,
    precoVendaSugerido,
    lucroBrutoUnitario,
    markupMultiplicador,
    margemRealPct,
    pontoEquilibrioUnidades,
  };
};

export const UNIDADES_LABELS: Record<UnidadeMedida, string> = {
  kg: 'Quilograma (kg)',
  g: 'Grama (g)',
  m: 'Metro (m)',
  cm: 'Centímetro (cm)',
  un: 'Unidade (un)',
  l: 'Litro (L)',
  ml: 'Mililitro (ml)',
  hora: 'Hora (h)',
};
