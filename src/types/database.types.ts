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
          categoria: Database["public"]["Enums"]["categoria_despesa"]
          created_at: string
          data_gasto: string
          descricao: string
          foto_comprovante_url: string | null
          id: string
          observacoes: string | null
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_despesa"]
          created_at?: string
          data_gasto?: string
          descricao: string
          foto_comprovante_url?: string | null
          id?: string
          observacoes?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_despesa"]
          created_at?: string
          data_gasto?: string
          descricao?: string
          foto_comprovante_url?: string | null
          id?: string
          observacoes?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          updated_at?: string
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
