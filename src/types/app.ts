import type { Database } from './database.types';

export type CategoriaDespesa = Database['public']['Enums']['categoria_despesa'];
export type StatusPagamento = Database['public']['Enums']['status_pagamento'];
export type DespesaRow = Database['public']['Tables']['despesas']['Row'];
export type PerfilRow = Database['public']['Tables']['perfis']['Row'];
export type DashboardTotaisRow = Database['public']['Views']['vw_dashboard_totais']['Row'];

export type TabType = 'dashboard' | 'novo' | 'historico';
export type ThemeMode = 'leitura' | 'escuro' | 'claro';
