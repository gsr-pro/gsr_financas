# 🦁 GSR Finanças — Planejamento Estratégico & Arquitetura Fiscal
## Roadmap de Implementação: Carnê-Leão Web, Workspace do Contador & Compliance Autônomo

> **Missão:** Transformar o GSR Finanças na ponte definitiva entre o profissional autônomo (especialmente os ignorados pelo mercado tradicional: prestadores da construção civil e motoristas de aplicativo) e a contabilidade consultiva moderna, eliminando riscos de malha fina e automatizando a escrituração do Carnê-Leão Web.

---

## 🎯 1. O Posicionamento Estratégico: Foco no "Oceano Azul" dos Autônomos

A maioria dos softwares financeiros e contábeis foca exclusivamente em empresas formais (Simples Nacional, Lucro Presumido) ou no topo da pirâmide de profissionais liberais (médicos e advogados). 

No entanto, há um contingente de milhões de profissionais que recebem **diretamente de pessoas físicas** e estão hoje na mira prioritária do cruzamento de dados da Receita Federal:

### 👷‍♂️ Grupo 1: Profissionais da Construção Civil (Pedreiros, Pintores, Gesseiros, Eletricistas)
- **O Cruzamento Mortal da Receita:** O dono do imóvel/obra (cliente do GSR Finanças) declara na sua DIRPF os pagamentos de mão de obra para incorporar no custo de aquisição do imóvel e reduzir ganho de capital em venda futura. **Ao informar o CPF do pedreiro/pintor, a Receita Federal cruza o dado instantaneamente**. Se o prestador não recolheu o Carnê-Leão mensalmente, cai em malha fina com multa de ofício de 75% a 150%.
- **Deduções no Livro Caixa:** Ferramentas manuais e elétricas, discos de corte, lixas, EPIs (botinas, capacetes, óculos), aluguel de andaimes/betoneiras e materiais de consumo direto da prestação.

### 🚗 Grupo 2: Motoristas de Aplicativo (Uber, 99) e Entregadores
- **A Complexidade Tributária:** Rendimentos pagos por pessoa física (passageiro) intermediados por plataforma. O autônomo pode optar pelo Livro Caixa das despesas reais ou pela presunção legal do art. 9º da Lei nº 7.713/1988 (40% ou 60% tributável conforme transporte de carga ou passageiros).
- **Deduções no Livro Caixa:** Manutenção do veículo, troca de óleo, pneus, combustível, seguro, lavagem e taxa de intermediação das plataformas quando não deduzida na fonte.

---

## 🏗️ 2. Arquitetura Geral da Solução

```
 ┌────────────────────────────────────────────────────────┐
 │           AUTÔNOMO (Campo / Canteiro / Volante)        │
 │  - Quick Capture de Recibos com Câmera Mobile          │
 │  - Lançamento de Receita com CPF do Contratante        │
 │  - Tag Automática: Dedutível vs Não Dedutível          │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │             MOTOR FISCAL GSR FINANÇAS                  │
 │  - Validador Algorítmico de CPF (Dígitos Verificadores)│
 │  - Malha Fina Preventiva (Bloqueio de Inconsistências) │
 │  - Separação Canônica do Livro Caixa (Lei 7.713/88)    │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
 ┌───────────────────────────┐  ┌─────────────────────────┐
 │   CARNÊ-LEÃO WEB (e-CAC)  │  │  WORKSPACE DO CONTADOR  │
 │  - Arquivo CSV Formatado  │  │  - Visão Multi-Cliente  │
 │  - Importação em Lote     │  │  - Conciliação Contábil │
 │  - DARF Mensal Fechado    │  │  - Download de ZIP de   │
 └───────────────────────────┘  │    Comprovantes         │
                                └─────────────────────────┘
```

---

## 🗺️ 3. Status das Sprints de Implementação (100% Concluídas)

| Sprint | Arquivo | Foco Principal | Status | Entregáveis Implementados |
| :---: | :--- | :--- | :---: | :--- |
| **Sprint 1** | [SPRINT_1_DATABASE_PERMISSOES_CONTADOR.md](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/docs/sprints/SPRINT_1_DATABASE_PERMISSOES_CONTADOR.md) | **Database, Migrações & RLS Multi-Tenant** | ✅ **Concluída** | DDL [20261010_fiscal_contador_carne_leao.sql](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/supabase/migrations/20261010_fiscal_contador_carne_leao.sql), tabela `contador_vinculos`, campos fiscais em `despesas` e `perfis`, tipos em `fiscal.types.ts` e `database.types.ts`. |
| **Sprint 2** | [SPRINT_2_MOTOR_CARNE_LEAO_E_MALHA_FINA.md](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/docs/sprints/SPRINT_2_MOTOR_CARNE_LEAO_E_MALHA_FINA.md) | **Motor Fiscal & Exportador e-CAC** | ✅ **Concluída** | [fiscalValidators.ts](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/lib/fiscalValidators.ts) (Módulo 11 da RFB), [fiscalEngine.ts](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/lib/fiscalEngine.ts) (DARF mensal progressivo), [exportCarneLeao.ts](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/lib/exportCarneLeao.ts) e modal [MalhaFinaModal.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/components/fiscal/MalhaFinaModal.tsx). |
| **Sprint 3** | [SPRINT_3_UX_AUTONOMOS_E_COMPROVANTES.md](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/docs/sprints/SPRINT_3_UX_AUTONOMOS_E_COMPROVANTES.md) | **UX Mobile-First para Autônomos de Campo** | ✅ **Concluída** | Compressor de fotos no navegador [imageCompressor.ts](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/lib/imageCompressor.ts) (8MB -> ~350KB), [ExpenseFormView.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/views/ExpenseFormView.tsx), [EditExpenseModal.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/components/EditExpenseModal.tsx) e [ExpenseListView.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/views/ExpenseListView.tsx) com botão Carnê-Leão e tags fiscais. |
| **Sprint 4** | [SPRINT_4_WORKSPACE_DO_CONTADOR.md](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/docs/sprints/SPRINT_4_WORKSPACE_DO_CONTADOR.md) | **Hub Contábil & Workspace Multi-Cliente** | ✅ **Concluída** | [ContadorAcessoCard.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/components/fiscal/ContadorAcessoCard.tsx) integrado em [SettingsView.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/views/SettingsView.tsx), modal multi-cliente [ContadorWorkspaceModal.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/components/fiscal/ContadorWorkspaceModal.tsx) e atalho na [Sidebar.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/components/Sidebar.tsx). |
| **Sprint 5** | [SPRINT_5_LIVRO_CAIXA_COMPLIANCE_E_ZIP.md](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/docs/sprints/SPRINT_5_LIVRO_CAIXA_COMPLIANCE_E_ZIP.md) | **Livro Caixa Digital & Pacote ZIP de Auditoria** | ✅ **Concluída** | [exportLivroCaixa.ts](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/lib/exportLivroCaixa.ts) (impressão/PDF A4 e CSV com memória de cálculo do DARF) e [exportComprovantesZip.ts](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/lib/exportComprovantesZip.ts) com JSZip e manifesto probatório. |

---

## 🔒 4. Requisitos Não Funcionais & Compliance
1. **Retenção Documental Fiscal:** Atendimento ao prazo decadencial de 5 anos (art. 173 do Código Tributário Nacional) no Supabase Storage.
2. **Segurança & Menor Privilégio:** O contador outorgado tem permissão apenas nos escopos concedidos pelo cliente, sem acesso a senhas ou dados bancários sensíveis.
3. **Performance:** Geração de arquivos CSV e empacotamento ZIP realizados via *streaming* e Web Workers ou bibliotecas otimizadas sem travar a interface do usuário.
