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
          forma_pagamento: string | null
          foto_comprovante_url: string | null
          id: string
          observacoes: string | null
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          tipo_ambiente: 'obra' | 'pessoal' | 'negocio'
          tipo_movimentacao: 'despesa' | 'receita'
          updated_at: string
          user_id: string
          valor: number
          workspace_id: string | null
          cpf_cnpj_participante?: string | null
          nome_participante?: string | null
          codigo_rendimento_carne_leao?: string | null
          is_dedutivel_livro_caixa?: boolean | null
          codigo_deducao_carne_leao?: string | null
          tem_comprovante?: boolean | null
          nome_original_arquivo?: string | null
          inconsistencias_fiscais?: Json | null
        }
        Insert: {
          categoria: string
          created_at?: string
          data_gasto?: string
          descricao: string
          forma_pagamento?: string | null
          foto_comprovante_url?: string | null
          id?: string
          observacoes?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_ambiente?: 'obra' | 'pessoal' | 'negocio'
          tipo_movimentacao?: 'despesa' | 'receita'
          updated_at?: string
          user_id: string
          valor: number
          workspace_id?: string | null
          cpf_cnpj_participante?: string | null
          nome_participante?: string | null
          codigo_rendimento_carne_leao?: string | null
          is_dedutivel_livro_caixa?: boolean | null
          codigo_deducao_carne_leao?: string | null
          tem_comprovante?: boolean | null
          nome_original_arquivo?: string | null
          inconsistencias_fiscais?: Json | null
        }
        Update: {
          categoria?: string
          created_at?: string
          data_gasto?: string
          descricao?: string
          forma_pagamento?: string | null
          foto_comprovante_url?: string | null
          id?: string
          observacoes?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_ambiente?: 'obra' | 'pessoal' | 'negocio'
          tipo_movimentacao?: 'despesa' | 'receita'
          updated_at?: string
          user_id?: string
          valor?: number
          workspace_id?: string | null
          cpf_cnpj_participante?: string | null
          nome_participante?: string | null
          codigo_rendimento_carne_leao?: string | null
          is_dedutivel_livro_caixa?: boolean | null
          codigo_deducao_carne_leao?: string | null
          tem_comprovante?: boolean | null
          nome_original_arquivo?: string | null
          inconsistencias_fiscais?: Json | null
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
          tipo: 'obra' | 'pessoal' | 'negocio'
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
          tipo: 'obra' | 'pessoal' | 'negocio'
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
          tipo?: 'obra' | 'pessoal' | 'negocio'
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
          tipo_ambiente: 'obra' | 'pessoal' | 'geral' | 'negocio'
          tipo_movimentacao?: 'despesa' | 'receita' | 'ambos'
          user_id: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo_ambiente: 'obra' | 'pessoal' | 'geral' | 'negocio'
          tipo_movimentacao?: 'despesa' | 'receita' | 'ambos'
          user_id?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo_ambiente?: 'obra' | 'pessoal' | 'geral' | 'negocio'
          tipo_movimentacao?: 'despesa' | 'receita' | 'ambos'
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
          cpf_cnpj?: string | null
          tipo_perfil?: 'cliente' | 'contador' | 'ambos'
          ocupacao_principal?: string | null
          registro_profissional?: string | null
          crc_numero?: string | null
          telefone_whatsapp?: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          role?: string
          tema_preferido?: 'leitura' | 'escuro' | 'claro'
          updated_at?: string
          cpf_cnpj?: string | null
          tipo_perfil?: 'cliente' | 'contador' | 'ambos'
          ocupacao_principal?: string | null
          registro_profissional?: string | null
          crc_numero?: string | null
          telefone_whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          tema_preferido?: 'leitura' | 'escuro' | 'claro'
          updated_at?: string
          cpf_cnpj?: string | null
          tipo_perfil?: 'cliente' | 'contador' | 'ambos'
          ocupacao_principal?: string | null
          registro_profissional?: string | null
          crc_numero?: string | null
          telefone_whatsapp?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan_tier: 'pessoal' | 'obra' | 'negocio' | 'lite' | 'business' | 'contador'
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
          plan_tier?: 'pessoal' | 'obra' | 'negocio' | 'lite' | 'business' | 'contador'
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
          plan_tier?: 'pessoal' | 'obra' | 'negocio' | 'lite' | 'business' | 'contador'
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
      investimentos: {
        Row: {
          created_at: string
          id: string
          instituicao: string
          nome: string
          rentabilidade: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instituicao: string
          nome: string
          rentabilidade?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instituicao?: string
          nome?: string
          rentabilidade?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
          workspace_id?: string | null
        }
        Relationships: []
      }
      estoque_itens: {
        Row: {
          categoria: string | null
          created_at: string
          custo_unitario: number
          estoque_minimo: number
          fornecedor: string | null
          id: string
          localizacao: string | null
          nome: string
          observacoes: string | null
          preco_venda: number
          quantidade_atual: number
          sku: string | null
          tipo_negocio: 'comercio' | 'servico' | 'producao'
          unidade_medida: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          custo_unitario?: number
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          observacoes?: string | null
          preco_venda?: number
          quantidade_atual?: number
          sku?: string | null
          tipo_negocio?: 'comercio' | 'servico' | 'producao'
          unidade_medida?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          custo_unitario?: number
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          observacoes?: string | null
          preco_venda?: number
          quantidade_atual?: number
          sku?: string | null
          tipo_negocio?: 'comercio' | 'servico' | 'producao'
          unidade_medida?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      cancellation_feedbacks: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          plan_tier: string
          reason_id: string
          reason_label: string
          feedback_text: string | null
          retention_offered: boolean | null
          retention_accepted: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          plan_tier: string
          reason_id: string
          reason_label: string
          feedback_text?: string | null
          retention_offered?: boolean | null
          retention_accepted?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          plan_tier?: string
          reason_id?: string
          reason_label?: string
          feedback_text?: string | null
          retention_offered?: boolean | null
          retention_accepted?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      contador_vinculos: {
        Row: {
          id: string
          cliente_id: string
          contador_email: string
          contador_id: string | null
          status: 'pendente' | 'ativo' | 'revogado' | 'recusado'
          permissao: 'leitura' | 'auditoria_completa'
          observacoes: string | null
          convidado_em: string
          respondido_em: string | null
          revogado_em: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          contador_email: string
          contador_id?: string | null
          status?: 'pendente' | 'ativo' | 'revogado' | 'recusado'
          permissao?: 'leitura' | 'auditoria_completa'
          observacoes?: string | null
          convidado_em?: string
          respondido_em?: string | null
          revogado_em?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          contador_email?: string
          contador_id?: string | null
          status?: 'pendente' | 'ativo' | 'revogado' | 'recusado'
          permissao?: 'leitura' | 'auditoria_completa'
          observacoes?: string | null
          convidado_em?: string
          respondido_em?: string | null
          revogado_em?: string | null
          created_at?: string
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
      orquestrar_ambientes_usuario: {
        Args: {
          p_user_id: string
        }
        Returns: Database["public"]["Tables"]["workspaces"]["Row"][]
      }
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
