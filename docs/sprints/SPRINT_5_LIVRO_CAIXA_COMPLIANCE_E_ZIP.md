# 🦁 SPRINT 5 — Relatórios de Compliance, Livro Caixa Digital & Pacote ZIP de Auditoria

> **Status:** Planejamento Aprovado  
> **Objetivo:** Implementar os relatórios formais de conciliação fiscal e contábil mais demandados por escritórios de contabilidade (Livro Caixa Digital segregado, Relatório de Inconsistências) e o gerador de pacote ZIP em lote com renomeação inteligente de todos os comprovantes do mês.

---

## 🏛️ 1. O Que o Profissional Contábil Realmente Precisa

Contadores não utilizam relatórios com ilustrações genéricas para prestar contas ao Fisco. Eles precisam de **peças contábeis com base legal explícita**, memória de cálculo clara e arquivos organizados para cruzar com o extrato bancário e importar nos seus ERPs (Domínio Sistemas, Alterdata, Totvs, Omie, Questor).

O Sprint 5 entrega os três artefatos indispensáveis:
1. **Relatório de Livro Caixa Digital** (PDF e Excel);
2. **Relatório de Inconsistências Fiscais** (Checklist de Malha Fina);
3. **Pacote ZIP de Comprovantes Auditados** (com renomeação canônica de fotos e PDFs).

---

## 📑 2. Relatório de Livro Caixa Digital (`exportLivroCaixa.ts`)

Desenvolvido sobre as bibliotecas já instaladas no projeto (`jspdf`, `jspdf-autotable`, `xlsx`), com estrutura contábil formal:

### 2.1. Estrutura Canônica das Seções
1. **Cabeçalho Institucional:** Dados do Contribuinte (Nome, CPF, Ocupação, Livro Caixa - Ano/Mês de Competência).
2. **Quadro 1 — Rendimentos do Trabalho Não Assalariado:**
   - Data, CPF do Contratante, Nome do Pagador, Histórico, Valor Recebido.
3. **Quadro 2 — Despesas de Custeio Dedutíveis (Art. 104 do RIR/2018):**
   - Data, Categoria, Descrição, ID do Recibo Anexo, Valor Dedutível.
4. **Quadro 3 — Despesas Não Dedutíveis (Para Controle e Conciliação):**
   - Lançamentos descartados do cômputo fiscal para demonstrar ao cliente por que não abateram imposto.
5. **Demonstrativo Sintético de Apuração do Carnê-Leão (Memória de Cálculo do DARF):**
   - `(+) Receita Total Bruta`
   - `(-) Total de Despesas Dedutíveis no Livro Caixa`
   - `(=) Rendimento Líquido Tributável`
   - `(x) Alíquota Efetiva da Tabela Progressiva do IRPF`
   - `(-) Parcela a Deduzir do IRPF`
   - `(=) DARF Mensal Estimado a Recolher`

---

## ⚠️ 3. Relatório de Inconsistências Fiscais

Exportável em PDF com visual clean ou visualizado diretamente no dashboard:
- Lista todos os lançamentos que colocam o cliente em risco de intimação pela Receita Federal;
- Separação por severidade (Erro Bloqueante vs Alerta);
- Instrução expressa de como sanar a pendência antes do fechamento do mês (ex: *"Solicitar CPF do cliente que contratou o serviço de pintura"* ou *"Substituir comprovante ilegível por segunda via de nota fiscal"*).

---

## 🗜️ 4. Gerador de Pacote ZIP de Comprovantes (`exportComprovantesZip.ts`)

A exigência do art. 173 do Código Tributário Nacional impõe a **guarda de documentos comprobatórios por 5 anos**. Ao fechar a competência mensal, o contador pode baixar com um único clique o pacote compactado contendo todos os comprovantes do cliente.

### 4.1. Regra de Renomeação Inteligente
Nenhum arquivo é salvo com nomes aleatórios como `IMG_20261009_WA0023.jpg`. Cada documento recebe um nome canônico e rastreável:

`AAAA-MM-DD_Valor_Categoria_Descricao_ID.ext`

**Exemplos Reais:**
- `2026-10-04_R$450,00_Ferramentas_DiscoDeCorteEPI_a1b2c3.jpg`
- `2026-10-12_R$280,00_Combustivel_PostoIpirangaNFCe_d4e5f6.pdf`
- `2026-10-25_R$1200,00_AluguelAndaime_BetoneiraLocacao_g7h8i9.jpg`

### 4.2. Implementação com JSZip no Cliente

```typescript
import JSZip from 'jszip';
import type { DespesaRow } from '../types/app';

export interface ZipDownloadProgress {
  total: number;
  baixados: number;
  porcentagem: number;
  status: string;
}

export const downloadPacoteComprovantesZip = async (
  despesasComComprovante: DespesaRow[],
  nomeCliente: string,
  ano: number,
  mes: number,
  onProgress?: (progresso: ZipDownloadProgress) => void
): Promise<Blob> => {
  const zip = new JSZip();
  const folderName = `Comprovantes_${ano}_${String(mes).padStart(2, '0')}`;
  const pasta = zip.folder(folderName) || zip;

  const total = despesasComComprovante.length;
  let baixados = 0;

  for (const item of despesasComComprovante) {
    if (!item.foto_comprovante_url) continue;

    try {
      const response = await fetch(item.foto_comprovante_url);
      if (!response.ok) throw new Error(`Falha HTTP ${response.status}`);
      const blob = await response.blob();

      // Determina extensão pelo mime type
      const ext = blob.type === 'application/pdf' ? 'pdf' : 'jpg';

      // Sanitização do nome do arquivo
      const data = item.data_gasto;
      const valor = Number(item.valor).toFixed(2).replace('.', '-');
      const cat = item.categoria.replace(/[^a-zA-Z0-9]/g, '');
      const desc = item.descricao.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const shortId = item.id.slice(0, 6);

      const fileName = `${data}_R$${valor}_${cat}_${desc}_${shortId}.${ext}`;

      pasta.file(fileName, blob);
    } catch (err) {
      console.warn(`Erro ao baixar comprovante ${item.id}:`, err);
    } finally {
      baixados++;
      if (onProgress) {
        onProgress({
          total,
          baixados,
          porcentagem: Math.round((baixados / total) * 100),
          status: `Processando comprovante ${baixados} de ${total}...`,
        });
      }
    }
  }

  // Gera o arquivo ZIP binário
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
};
```

---

## 📊 5. Exportador para Sistemas Contábeis (OFX & CSV Tratado)

Além do arquivo oficial do Carnê-Leão Web da Receita Federal, o módulo gera:
1. **Extrato OFX Tratado:** Padrão bancário internacional aceito por todos os sistemas contábeis brasileiros para conciliação direta com razão contábil;
2. **CSV Unificado de Integração:** Colunas padronizadas (`Data;ContaDebito;ContaCredito;Valor;Historico;DocumentoFiscal;CNPJ_CPF`) para importação em softwares como Domínio Sistemas e Alterdata.

---

## ✅ 6. Critérios de Aceite do Sprint 5
- [ ] Geração do Relatório de Livro Caixa Digital em PDF A4 e Excel com separação rigorosa de dedutíveis e memória de cálculo do DARF.
- [ ] Download em lote de ZIP gerado no navegador contendo fotos e PDFs devidamente renomeados.
- [ ] Teste de performance com 50 comprovantes baixados e zipados sem travamento da UI através de barra de progresso.
- [ ] Validação de integridade do build TypeScript (`npm run build`).
