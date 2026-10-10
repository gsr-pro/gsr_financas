import { validarDocumentoFiscal } from './fiscalValidators';
import type { DespesaRow } from '../types/app';
import type {
  AuditReportFiscal,
  InconsistenciaFiscal,
  OcupacaoAutonomo,
  CalculoIRPFResult,
} from '../types/fiscal.types';

/**
 * TABELA PROGRESSIVA MENSAL DO IRPF (Carnê-Leão Oficial)
 */
export const TABELA_IRPF_MENSAL = [
  { limite: 2259.20, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
];

/**
 * Calcula a memória completa do imposto de renda mensal (DARF código 0190)
 */
export const calcularIRPFMensal = (baseCalculo: number): CalculoIRPFResult => {
  if (baseCalculo <= TABELA_IRPF_MENSAL[0].limite) {
    return {
      baseCalculo,
      aliquota: 0,
      parcelaDeduzir: 0,
      impostoDevido: 0,
    };
  }

  for (const faixa of TABELA_IRPF_MENSAL) {
    if (baseCalculo <= faixa.limite) {
      const imposto = Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao);
      return {
        baseCalculo,
        aliquota: faixa.aliquota,
        parcelaDeduzir: faixa.deducao,
        impostoDevido: Math.round(imposto * 100) / 100,
      };
    }
  }

  return {
    baseCalculo,
    aliquota: 0.275,
    parcelaDeduzir: 896.00,
    impostoDevido: 0,
  };
};

/**
 * Calcula a estimativa do imposto DARF mensal do Carnê-Leão sobre a base líquida
 */
export const calcularDARFEstimado = (baseCalculo: number): number => {
  return calcularIRPFMensal(baseCalculo).impostoDevido;
};

/**
 * Categorias que tipicamente são dedutíveis no Livro Caixa por ocupação (Art. 104 RIR/2018)
 */
export const CATEGORIAS_DEDUTIVEIS_POR_OCUPACAO: Record<string, string[]> = {
  autonomo_construcao: [
    'Ferramentas & Acessórios',
    'EPIs & Segurança',
    'Locação de Andaimes & Caçambas',
    'Materiais de Aplicação',
    'Combustível de Deslocamento',
    'Manutenção de Ferramentas',
  ],
  motorista_app: [
    'Combustível (Gasolina/Etanol/GNV)',
    'Manutenção Mecânica & Peças',
    'Troca de Óleo & Filtros',
    'Pneus & Alinhamento',
    'Seguro do Veículo (APP)',
    'Higienização & Lavagem',
    'Taxa / Comissão da Plataforma',
  ],
  profissional_saude: [
    'Aluguel do Consultório',
    'Materiais Odontológicos / Médicos',
    'Água, Luz e Telefone Profissional',
    'Anuidade do Conselho (CRM/CRO/CRP)',
    'Desinfecção & Limpeza',
  ],
  padrao: [
    'Materiais de Trabalho',
    'Ferramentas',
    'Equipamentos',
    'Insumos Profissionais',
  ],
};

/**
 * Termos proibidos expressamente no Livro Caixa pelo art. 104 do RIR/2018
 * (Gastos pessoais de subsistência não dedutíveis)
 */
const TERMOS_PROIBIDOS_LIVRO_CAIXA = [
  'almoço',
  'almoco',
  'refeição',
  'refeicao',
  'restaurante',
  'lanche',
  'multa',
  'lazer',
  'cinema',
  'mercado',
  'supermercado',
  'vestuário',
  'roupa',
  'passeio',
  'academia',
];

/**
 * Sugere se uma nova despesa deve ter o toggle "Dedutível" ligado por padrão
 */
export const sugerirDedutibilidade = (
  categoria: string,
  descricao: string,
  ocupacao: OcupacaoAutonomo = 'autonomo_construcao'
): boolean => {
  const descLower = descricao.toLowerCase();
  for (const termo of TERMOS_PROIBIDOS_LIVRO_CAIXA) {
    if (descLower.includes(termo)) return false;
  }

  const permitidas = CATEGORIAS_DEDUTIVEIS_POR_OCUPACAO[ocupacao] || CATEGORIAS_DEDUTIVEIS_POR_OCUPACAO.padrao;
  return permitidas.some((cat) => cat.toLowerCase() === categoria.toLowerCase());
};

/**
 * Motor de Malha Fina Preventiva
 * Avalia todos os lançamentos do período antes de liberar a exportação do Carnê-Leão Web
 */
export const auditPeriodoFiscal = (
  lancamentos: DespesaRow[],
  ocupacao: OcupacaoAutonomo = 'autonomo_construcao'
): AuditReportFiscal => {
  const inconsistencias: AuditReportFiscal['inconsistencias'] = [];
  const itensValidos: { expense: DespesaRow }[] = [];
  let totalReceitas = 0;
  let totalDedutiveis = 0;
  let totalNaoDedutiveis = 0;
  let errosImpeditivos = 0;

  for (const item of lancamentos) {
    const problemas: InconsistenciaFiscal[] = [];
    const isReceita = item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    const valor = Number(item.valor || 0);

    if (isReceita) {
      totalReceitas += valor;

      // 1. Receita sem CPF do contratante / pagador
      const doc = item.cpf_cnpj_participante;
      if (!doc || doc.trim() === '') {
        problemas.push({
          codigo: 'CPF_AUSENTE',
          severidade: 'erro',
          campo: 'cpf_cnpj_participante',
          mensagem: `A receita "${item.descricao}" está sem o CPF do contratante. O Carnê-Leão Web da Receita Federal exige o CPF para validar os rendimentos recebidos de pessoa física.`,
        });
      } else if (!validarDocumentoFiscal(doc)) {
        problemas.push({
          codigo: 'CPF_INVALIDO',
          severidade: 'erro',
          campo: 'cpf_cnpj_participante',
          mensagem: `O documento "${doc}" informado na receita "${item.descricao}" possui dígitos verificadores inválidos segundo a RFB.`,
        });
      }
    } else {
      // É Despesa
      const isDedutivel = Boolean(item.is_dedutivel_livro_caixa);
      if (isDedutivel) {
        totalDedutiveis += valor;

        // 2. Despesa Dedutível sem Comprovante Anexo
        if (!item.foto_comprovante_url) {
          problemas.push({
            codigo: 'COMPROVANTE_FALTANTE',
            severidade: 'erro',
            campo: 'foto_comprovante_url',
            mensagem: `A despesa dedutível "${item.descricao}" (R$ ${valor.toFixed(2)}) não possui comprovante anexado. A legislação exige a guarda do comprovante idôneo por até 5 anos.`,
          });
        }

        // 3. Despesa com indício de termo proibido (subsistência / multa)
        const descLower = item.descricao.toLowerCase();
        for (const termo of TERMOS_PROIBIDOS_LIVRO_CAIXA) {
          if (descLower.includes(termo)) {
            problemas.push({
              codigo: 'DEDUTIBILIDADE_DUVIDOSA',
              severidade: 'alerta',
              campo: 'is_dedutivel_livro_caixa',
              mensagem: `O lançamento "${item.descricao}" contém o termo "${termo}". Despesas com alimentação pessoal, multas e subsistência não são dedutíveis no Livro Caixa (Art. 104 do RIR/2018).`,
            });
            break;
          }
        }

        // Alerta preventivo com base na ocupação
        const permitidas = CATEGORIAS_DEDUTIVEIS_POR_OCUPACAO[ocupacao] || CATEGORIAS_DEDUTIVEIS_POR_OCUPACAO.padrao;
        if (!permitidas.some((c) => c.toLowerCase() === item.categoria.toLowerCase())) {
          problemas.push({
            codigo: 'DEDUTIBILIDADE_DUVIDOSA',
            severidade: 'alerta',
            campo: 'categoria',
            mensagem: `A categoria "${item.categoria}" não consta no rol usual de despesas dedutíveis para a ocupação selecionada.`,
          });
        }

        // Se a despesa for dedutível, armazena para visualização no Livro Caixa
        itensValidos.push({ expense: item });
      } else {
        totalNaoDedutiveis += valor;
      }
    }

    if (problemas.length > 0) {
      const errosDesteItem = problemas.filter((p) => p.severidade === 'erro').length;
      errosImpeditivos += errosDesteItem;

      inconsistencias.push({
        despesaId: item.id,
        descricao: item.descricao,
        data: item.data_gasto,
        valor,
        problemas,
      });
    }
  }

  const baseCalculoTributavel = Math.max(0, totalReceitas - totalDedutiveis);
  const darfEstimado = calcularDARFEstimado(baseCalculoTributavel);

  return {
    totalLancamentos: lancamentos.length,
    totalReceitas,
    totalDespesasDedutiveis: totalDedutiveis,
    totalDespesasNaoDedutiveis: totalNaoDedutiveis,
    baseCalculoTributavel,
    baseCalculo: baseCalculoTributavel,
    darfEstimado,
    errosImpeditivos,
    itensValidos,
    inconsistencias,
    prontoParaExportacao: errosImpeditivos === 0,
  };
};
