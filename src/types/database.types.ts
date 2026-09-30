export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      despesas: {
        Row: {
          categoria: string
          created_at: string
          data_gasto: string
          descricao: string
          foto_comprovante_url: string | null
          id: string
          observacoes: string | null
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          tipo_ambiente: 'obra' | 'pessoal'
          updated_at: string
          user_id: string
          valor: number
          workspace_id: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          data_gasto?: string
          descricao: string
          foto_comprovante_url?: string | null
          id?: string
          observacoes?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_ambiente?: 'obra' | 'pessoal'
          updated_at?: string
          user_id: string
          valor: number
          workspace_id?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          data_gasto?: string
          descricao?: string
          foto_comprovante_url?: string | null
          id?: string
          observacoes?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_ambiente?: 'obra' | 'pessoal'
          updated_at?: string
          user_id?: string
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          configuracoes: Json | null
          created_at: string
          data_aquisicao: string | null
          dimensoes_terreno: string | null
          id: string
          is_default: boolean
          localizacao: string | null
          nome: string
          tipo: 'obra' | 'pessoal'
          tipo_imovel: string | null
          updated_at: string
          user_id: string
          valor_aquisicao: number
        }
        Insert: {
          configuracoes?: Json | null
          created_at?: string
          data_aquisicao?: string | null
          dimensoes_terreno?: string | null
          id?: string
          is_default?: boolean
          localizacao?: string | null
          nome: string
          tipo: 'obra' | 'pessoal'
          tipo_imovel?: string | null
          updated_at?: string
          user_id: string
          valor_aquisicao?: number
        }
        Update: {
          configuracoes?: Json | null
          created_at?: string
          data_aquisicao?: string | null
          dimensoes_terreno?: string | null
          id?: string
          is_default?: boolean
          localizacao?: string | null
          nome?: string
          tipo?: 'obra' | 'pessoal'
          tipo_imovel?: string | null
          updated_at?: string
          user_id?: string
          valor_aquisicao?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          tipo_ambiente: 'obra' | 'pessoal' | 'geral'
          user_id: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo_ambiente: 'obra' | 'pessoal' | 'geral'
          user_id?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo_ambiente?: 'obra' | 'pessoal' | 'geral'
          user_id?: string | null
        }
        Relationships: []
      }
      perfis: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          role: string
          tema_preferido: 'leitura' | 'escuro' | 'claro'
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          role?: string
          tema_preferido?: 'leitura' | 'escuro' | 'claro'
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          tema_preferido?: 'leitura' | 'escuro' | 'claro'
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan_tier: 'pessoal' | 'obra'
          status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_tier?: 'pessoal' | 'obra'
          status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_tier?: 'pessoal' | 'obra'
          status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_dashboard_totais: {
        Row: {
          custo_total_geral: number | null
          data_aquisicao_terreno: string | null
          dimensoes_terreno: string | null
          total_despesas: number | null
          total_documentacao: number | null
          total_ferramentas: number | null
          total_lancamentos: number | null
          total_mao_de_obra: number | null
          total_materiais: number | null
          total_outros: number | null
          total_pago: number | null
          total_pendente: number | null
          valor_aquisicao_terreno: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_despesa:
        | "Materiais"
        | "Mão de Obra"
        | "Documentação"
        | "Ferramentas"
        | "Outros"
      status_pagamento: "Pago" | "Pendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
