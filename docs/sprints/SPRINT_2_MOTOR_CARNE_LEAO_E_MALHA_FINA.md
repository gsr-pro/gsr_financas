# 🦁 SPRINT 2 — Motor de Regras Fiscais, Malha Fina Preventiva & Exportador Carnê-Leão Web

> **Status:** Planejamento Aprovado  
> **Objetivo:** Desenvolver o motor algorítmico de validação de CPF, heurísticas de malha fina preventiva para dedutibilidade do Livro Caixa e o gerador de arquivos no padrão oficial de importação em lote do Carnê-Leão Web (Portal e-CAC da Receita Federal).

---

## 🏛️ 1. As Regras Oficiais do Carnê-Leão Web (e-CAC)

Desde 2021, o Carnê-Leão passou a ser escriturado diretamente no ambiente web da Receita Federal (e-CAC), descontinuando o antigo programa executável Java (.exe). 

O sistema permite a **importação em lote de movimentações** através de arquivos de texto formatados (CSV estruturado de até 1.000 linhas por arquivo). Os campos devem respeitar rigidamente:
1. **Data:** Formato `DD/MM/AAAA`.
2. **Código de Rendimento / Ocupação:** Ex.: `0101` (Trabalho não assalariado prestado a pessoa física sem vínculo empregatício).
3. **CPF do Pagador/Contratante:** Validação matemática obrigatória quando o serviço é prestado a pessoa física.
4. **CPF do Beneficiário:** Quando aplicável (ex.: dependente ou paciente de saúde).
5. **Valor:** Formato numérico decimal com vírgula (ex.: `1500,00` ou conforme especificação de importação do portal).
6. **Histórico:** Descrição sucinta sem caracteres ilegais (`\n`, aspas desbalanceadas, caracteres de controle).
7. **Deduções do Livro Caixa:** Apenas despesas com amparo no **art. 104 do RIR/2018 (Decreto nº 9.580/2018)** e **Instrução Normativa RFB nº 1.500/2014**.

---

## 🛠️ 2. Motor Algorítmico de Validação de CPF (`src/lib/fiscalValidators.ts`)

Implementação técnica rigorosa com cálculo dos dígitos verificadores via módulo 11, sem bibliotecas pesadas:

```typescript
/**
 * Validador oficial de CPF com cálculo dos dígitos verificadores (Módulo 11)
 * Rejeita sequências de dígitos repetidos (ex: 111.111.111-11)
 */
export const validarCPF = (cpf: string): boolean => {
  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11), 10)) return false;

  return true;
};

export const formatarCPF = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
```

---

## ⚖️ 3. Regras de Dedutibilidade do Livro Caixa por Ocupação

A "Malha Fina Prévia" do GSR Finanças atua analisando a intenção de dedução contra a legislação vigente:

### 3.1. Matriz de Validação para Construção Civil (Pedreiros, Pintores, Gesseiros)
- ✅ **Dedutíveis:** 
  - Ferramentas de trabalho e insumos de aplicação (lixas, rolos, pincéis, espátulas, discos de corte, serras copos);
  - Equipamentos de Proteção Individual - EPIs (botinas de bico de aço, capacetes, protetores auriculares, máscaras, óculos);
  - Aluguel de maquinário do canteiro (andaimes, betoneiras, marteletes, caçambas de entulho);
  - Transporte de ferramentas pesadas até o canteiro (frete de transporte de maquinário com recibo idôneo).
- ❌ **Não Dedutíveis (Bloqueio ou Alerta Impeditivo):**
  - Refeição diária comum / almoço (gastos de subsistência pessoal não dedutíveis);
  - Roupas de uso comum (calças jeans, camisetas sem identificação);
  - Gasolina de uso geral sem discriminação de rota profissional;
  - Despesas residenciais sem rateio proporcional de home office formal.

### 3.2. Matriz de Validação para Motoristas de Aplicativo (Uber / 99)
- ✅ **Dedutíveis (Livro Caixa):**
  - Combustível (gasolina, etanol, GNV) comprovado por Cupom Fiscal Eletrônico (NFC-e) no período de operação;
  - Manutenção mecânica preventiva e corretiva do veículo utilizado no trabalho (pastilhas de freio, suspensão, troca de óleo, filtros, pneus);
  - Seguro automotivo com cobertura para transporte de passageiros / APP;
  - Taxas e comissões da plataforma (Uber/99) se o motorista contabilizar pelo faturamento bruto das viagens;
  - Higienização e lavagem técnica periódica do veículo.
- ❌ **Não Dedutíveis:**
  - Multas de trânsito (expressamente vedadas pela Receita Federal);
  - Parcelas de financiamento do veículo (apenas despesas de custeio/manutenção são admitidas no Livro Caixa, não aquisição de bem patrimonial);
  - IPVA e licenciamento quando não houver comprovação exclusiva da atividade.

---

## 🛡️ 4. Motor de "Malha Fina Prévia" (`src/lib/fiscalEngine.ts`)

Estrutura que varre o extrato do mês antes de liberar a exportação:

```typescript
import { validarCPF } from './fiscalValidators';
import type { DespesaRow } from '../types/app';
import type { InconsistenciaFiscal } from '../types/fiscal.types';

export interface AuditReportFiscal {
  totalLancamentos: number;
  totalReceitas: number;
  totalDespesasDedutiveis: number;
  totalDespesasNaoDedutiveis: number;
  inconsistencias: {
    despesaId: string;
    descricao: string;
    data: string;
    valor: number;
    problemas: InconsistenciaFiscal[];
  }[];
  prontoParaExportacao: boolean;
}

export const auditPeriodoFiscal = (
  lancamentos: DespesaRow[],
  ocupacao: string
): AuditReportFiscal => {
  const inconsistencias: AuditReportFiscal['inconsistencias'] = [];
  let totalReceitas = 0;
  let totalDedutiveis = 0;
  let totalNaoDedutiveis = 0;

  for (const item of lancamentos) {
    const problemas: InconsistenciaFiscal[] = [];
    const isReceita = item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    const valor = Number(item.valor || 0);

    if (isReceita) {
      totalReceitas += valor;

      // 1. Receita de Pessoa Física sem CPF informado
      const cpf = (item as any).cpf_cnpj_participante;
      if (!cpf || cpf.trim() === '') {
        problemas.push({
          codigo: 'CPF_AUSENTE',
          severidade: 'erro',
          campo: 'cpf_cnpj_participante',
          mensagem: `A receita "${item.descricao}" não possui o CPF do contratante. A Receita Federal exige o CPF para validar o Carnê-Leão.`,
        });
      } else if (!validarCPF(cpf)) {
        problemas.push({
          codigo: 'CPF_INVALIDO',
          severidade: 'erro',
          campo: 'cpf_cnpj_participante',
          mensagem: `O CPF "${cpf}" informado na receita "${item.descricao}" possui dígitos verificadores inválidos.`,
        });
      }
    } else {
      // É Despesa
      const isDedutivel = Boolean((item as any).is_dedutivel_livro_caixa);
      if (isDedutivel) {
        totalDedutiveis += valor;

        // 2. Despesa Dedutível SEM Comprovante Anexo
        if (!item.foto_comprovante_url) {
          problemas.push({
            codigo: 'COMPROVANTE_FALTANTE',
            severidade: 'erro',
            campo: 'foto_comprovante_url',
            mensagem: `A despesa dedutível "${item.descricao}" está sem comprovante anexado. A Receita Federal exige comprovante idôneo mantido por 5 anos.`,
          });
        }

        // 3. Heurística de despesas proibidas por lei
        const descLower = item.descricao.toLowerCase();
        if (descLower.includes('almoço') || descLower.includes('refeição') || descLower.includes('multa')) {
          problemas.push({
            codigo: 'DEDUTIBILIDADE_DUVIDOSA',
            severidade: 'alerta',
            campo: 'is_dedutivel_livro_caixa',
            mensagem: `Lançamentos de alimentação e multas de trânsito não são dedutíveis no Livro Caixa pelo art. 104 do RIR/2018.`,
          });
        }
      } else {
        totalNaoDedutiveis += valor;
      }
    }

    if (problemas.length > 0) {
      inconsistencias.push({
        despesaId: item.id,
        descricao: item.descricao,
        data: item.data_gasto,
        valor,
        problemas,
      });
    }
  }

  const temErrosBloqueantes = inconsistencias.some((inc) =>
    inc.problemas.some((p) => p.severidade === 'erro')
  );

  return {
    totalLancamentos: lancamentos.length,
    totalReceitas,
    totalDespesasDedutiveis: totalDedutiveis,
    totalDespesasNaoDedutiveis: totalNaoDedutiveis,
    inconsistencias,
    prontoParaExportacao: !temErrosBloqueantes,
  };
};
```

---

## 📄 5. Gerador do Arquivo de Importação Carnê-Leão Web (`src/lib/exportCarneLeao.ts`)

Gera o arquivo com encoding UTF-8 com BOM (ou ANSI conforme especificação do e-CAC) e sanitização estrita:

```typescript
import type { DespesaRow } from '../types/app';

export const gerarArquivoCarneLeaoWeb = (
  lancamentos: DespesaRow[],
  ano: number,
  mes: number,
  cpfTitular: string
): string => {
  const linhas: string[] = [];

  // Cabeçalho oficial aceito pelo layout de importação em lote
  linhas.push('DT_LANCAMENTO;TP_LANCAMENTO;CD_RENDIMENTO_DEDUCAO;CPF_TITULAR;CPF_PARTICIPANTE;HISTORICO;VL_LANCAMENTO;INDICADOR_DEDUTIVEL');

  for (const item of lancamentos) {
    const isReceita = item.tipo_movimentacao === 'receita' || item.descricao.startsWith('[RECEITA]');
    const [anoItem, mesItem, diaItem] = item.data_gasto.split('-');
    const dataFormatada = `${diaItem}/${mesItem}/${anoItem}`;

    const tpLancamento = isReceita ? 'R' : 'D';
    const cdRendimento = (item as any).codigo_rendimento_carne_leao || (isReceita ? '0101' : '0001');
    const cpfParticipante = ((item as any).cpf_cnpj_participante || '').replace(/\D/g, '');
    const historicoLimpo = item.descricao.replace(/[\n\r;]/g, ' ').slice(0, 100);
    const valorFormatado = Number(item.valor || 0).toFixed(2).replace('.', ',');
    const dedutivelFlag = (item as any).is_dedutivel_livro_caixa ? 'S' : 'N';

    linhas.push([
      dataFormatada,
      tpLancamento,
      cdRendimento,
      cpfTitular.replace(/\D/g, ''),
      cpfParticipante,
      `"${historicoLimpo}"`,
      valorFormatado,
      dedutivelFlag
    ].join(';'));
  }

  return linhas.join('\r\n');
};
```

---

## 🎨 6. Componente UI: Modal de Pré-Auditoria e Malha Fina (`MalhaFinaModal.tsx`)

- Exibe checklist visual em formato de semáforo:
  - 🟢 **Verde:** Tudo validado, CPF correto e comprovantes presentes.
  - 🟡 **Amarelo:** Alertas de despesas limítrofes (com botão "Desmarcar Dedutibilidade com 1 clique").
  - 🔴 **Vermelho:** Erros impeditivos (CPF ausente em receita ou inválido, comprovante ausente em despesa dedutível).
- Bloqueia o download do arquivo enquanto houver erros impeditivos vermelhos, garantindo que o autônomo e o contador nunca enviem lixo para o portal da Receita Federal.

---

## ✅ 7. Critérios de Aceite do Sprint 2
- [ ] Validador de CPF rejeita 100% de CPFs inválidos conhecidos e sequências como `111.111.111-11`.
- [ ] Motor fiscal identifica despesas de alimentação ou lazer marcadas indevidamente como dedutíveis no Livro Caixa.
- [ ] Arquivo CSV gerado respeita o formato delimitado por ponto e vírgula com formatação numérica e de datas exatas.
- [ ] Teste unitário e de build TypeScript com zero erros.
