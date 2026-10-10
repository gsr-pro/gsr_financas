import type { DespesaRow } from './app';

export type OcupacaoAutonomo =
  | 'autonomo_construcao'
  | 'motorista_app'
  | 'profissional_saude'
  | 'advocacia'
  | 'locador_imoveis'
  | 'outro';

export type StatusVinculoContador = 'pendente' | 'ativo' | 'revogado' | 'recusado';
export type PermissaoContador = 'leitura' | 'auditoria_completa';

export interface ContadorVinculoRow {
  id: string;
  cliente_id: string;
  contador_email: string;
  contador_id?: string | null;
  status: StatusVinculoContador;
  permissao: PermissaoContador;
  observacoes?: string | null;
  convidado_em: string;
  respondido_em?: string | null;
  revogado_em?: string | null;
  created_at: string;
  updated_at: string;
  // Campos complementares agregados para visualização no Workspace do Contador
  cliente_nome?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  cliente_ocupacao?: OcupacaoAutonomo;
}

export interface InconsistenciaFiscal {
  codigo: 'CPF_INVALIDO' | 'CPF_AUSENTE' | 'COMPROVANTE_FALTANTE' | 'DEDUTIBILIDADE_DUVIDOSA';
  severidade: 'erro' | 'alerta';
  mensagem: string;
  campo: string;
}

export interface AuditReportFiscal {
  totalLancamentos: number;
  totalReceitas: number;
  totalDespesasDedutiveis: number;
  totalDespesasNaoDedutiveis: number;
  baseCalculoTributavel: number;
  baseCalculo: number;
  darfEstimado: number;
  errosImpeditivos: number;
  itensValidos: { expense: DespesaRow }[];
  inconsistencias: {
    despesaId: string;
    descricao: string;
    data: string;
    valor: number;
    problemas: InconsistenciaFiscal[];
  }[];
  prontoParaExportacao: boolean;
}

export interface CalculoIRPFResult {
  baseCalculo: number;
  aliquota: number;
  parcelaDeduzir: number;
  impostoDevido: number;
}

export interface CarneLeaoRegistro {
  data: string; // DD/MM/AAAA
  tipo: 'R' | 'D'; // Receita ou Despesa
  codigoRendimentoDeducao: string;
  cpfTitular: string;
  cpfParticipante: string;
  historico: string;
  valor: number;
  isDedutivel: boolean;
}

export interface ZipDownloadProgress {
  total: number;
  baixados: number;
  porcentagem: number;
  status: string;
}
