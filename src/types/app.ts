import type { Database } from './database.types';

export type StatusPagamento = Database['public']['Enums']['status_pagamento'];
export type DespesaRow = Database['public']['Tables']['despesas']['Row'];
export type PerfilRow = Database['public']['Tables']['perfis']['Row'];
export type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];
export type CategoriaRow = Database['public']['Tables']['categorias']['Row'];
export type DashboardTotaisRow = Database['public']['Views']['vw_dashboard_totais']['Row'];

export type WorkspaceType = 'obra' | 'pessoal';
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
