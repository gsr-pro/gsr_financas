export type UnidadeMedida = 'kg' | 'g' | 'm' | 'cm' | 'un' | 'l' | 'ml' | 'hora';

export interface InsumoItem {
  id: string;
  workspace_id?: string;
  nome: string;
  unidade_medida: UnidadeMedida;
  custo_unitario: number;
  fornecedor?: string;
}

export interface ItemInsumoFicha {
  insumo_id: string;
  nome: string;
  quantidade: number;
  unidade_medida: UnidadeMedida;
  custo_unitario: number;
  custo_total: number;
}

export interface ProdutoPrecificacao {
  id: string;
  workspace_id?: string;
  nome: string;
  descricao?: string;
  insumos: ItemInsumoFicha[];
  custo_insumos: number;
  horas_trabalho: number;
  valor_hora_mao_obra: number;
  custo_mao_obra: number;
  custos_fixos_rateados: number; // Ex: embalagem, energia, gás, frete
  custo_total_producao: number; // CMV + Mão de Obra + Fixos
  margem_lucro_desejada_pct: number; // Ex: 40 para 40%
  preco_venda_sugerido: number;
  lucro_bruto_unitario: number;
  markup_multiplicador: number;
  ponto_equilibrio_unidades?: number;
  criado_em: string;
}
