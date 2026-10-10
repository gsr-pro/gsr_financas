import type { Database, Json } from './database.types';

export type StatusPagamento = Database['public']['Enums']['status_pagamento'];
export type DespesaRow = Database['public']['Tables']['despesas']['Row'];
export type PerfilRow = Database['public']['Tables']['perfis']['Row'];
export type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];
export type CategoriaRow = Database['public']['Tables']['categorias']['Row'];
export type DashboardTotaisRow = Database['public']['Views']['vw_dashboard_totais']['Row'];

export type WorkspaceType = 'obra' | 'pessoal' | 'negocio';
export * from './business.types';
export * from './fiscal.types';
export type TabType = 'dashboard' | 'novo' | 'historico' | 'configuracoes';
export type ThemeMode = 'leitura' | 'escuro' | 'claro';

export type TipoImovel =
  | 'terreno'
  | 'casa'
  | 'apartamento'
  | 'chacara'
  | 'comercial'
  | 'reforma'
  | 'outro';

export type CategoriaDespesa = string;

export type TipoMovimentacao = 'despesa' | 'receita';

export type FormaPagamento =
  | 'pix'
  | 'credito'
  | 'debito'
  | 'dinheiro'
  | 'boleto'
  | 'transferencia';

export type TipoInvestimento =
  | 'CDB'
  | 'Poupança'
  | 'Tesouro Direto'
  | 'LCI/LCA'
  | 'Ações/FIIs'
  | 'Cripto'
  | 'Outro';

export interface InvestimentoItem {
  id: string;
  nome: string;
  tipo: TipoInvestimento;
  instituicao: string;
  valor: number;
  rentabilidade?: string;
  atualizado_em: string;
  [key: string]: Json | undefined;
}

