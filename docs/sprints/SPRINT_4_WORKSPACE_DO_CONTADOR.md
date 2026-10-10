# 🦁 SPRINT 4 — Painel Exclusivo do Contador (Hub Contábil Multi-Tenant)

> **Status:** Planejamento Aprovado  
> **Objetivo:** Construir o painel de controle do escritório contábil (*Workspace do Contador*), permitindo que contadores gerenciem múltiplos clientes autônomos em um único painel, acessem conciliações fiscais e baixem os arquivos do Carnê-Leão sem depender de arquivos soltos em WhatsApp.

---

## 🏛️ 1. O Fluxo de Valor Contador-Cliente

```
 [CLIENTE AUTÔNOMO]                            [CONTADOR / ESCRITÓRIO]
         │                                                │
         ├─ Digita e-mail do contador                     │
         ├─ Clica em "Conceder Acesso"                    │
         │                                                │
         │──────── (Disparo de Notificação) ─────────────▶│
         │                                                ├─ Faz login no GSR Finanças
         │                                                ├─ Aceita o vínculo do cliente
         │                                                │
         │                                                ▼
         │                                      [PAINEL MULTI-CLIENTE]
         │                                      - Status do Mês (Competência)
         │                                      - Checklist de Comprovantes
         │                                      - Alertas de Malha Fina
         │                                                │
         │◀─────── (Gera DARF / Transmite e-CAC) ─────────┤
```

---

## 👥 2. UX do Cliente: Conceder e Revogar Acesso (`ContadorAcessoCard.tsx`)

Na tela de [SettingsView.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/views/SettingsView.tsx), uma nova seção institucional:

- **Título:** `Acesso Contábil & Meu Contador`
- **Descrição:** *"Dê acesso seguro ao seu profissional contábil para que ele baixe o Carnê-Leão e confira seus recibos diretamente, sem que você precise mandar mensagens ou planilhas."*
- **Ações:**
  - Campo de entrada: `E-mail do profissional contábil`;
  - Botão de ação: `Conceder Acesso Seguro`;
  - Tabela de vínculos com badge de status:
    - 🟡 `Pendente (Aguardando aceite)`
    - 🟢 `Ativo (Acesso autorizado)`
    - 🔴 `Revogar Acesso Instantaneamente`

---

## 🏢 3. O Workspace do Contador (`ContadorDashboardView.tsx`)

Quando um usuário com perfil `contador` acessa a aplicação, ele é direcionado para a central executiva multi-cliente:

### 3.1. Cards Consolidados de Produtividade do Escritório
- **Total de Clientes Ativos:** Número de autônomos outorgados;
- **Fechamentos Pendentes no Mês:** Clientes com pendências impeditivas na malha fina prévia;
- **Prontos para Transmissão no e-CAC:** Clientes com 100% dos dados consistentes e comprovantes anexados;
- **Total de Movimentação Monitorada:** Volume financeiro escriturado no mês.

### 3.2. Grid de Clientes com Ações Rápidas em 1 Clique
Tabela interativa com busca instantânea e filtros por ocupação (Construção Civil vs Motoristas vs Outros):

| Cliente | Ocupação | Competência | Receitas Brutas | Despesas Dedutíveis | Cobertura Recibos | Status Malha Fina | Ações do Contador |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **João Silva** | Pedreiro Autônomo | 10/2026 | R$ 6.800,00 | R$ 1.450,00 | 100% (14 anexos) | 🟢 Pronto e-CAC | `[Carnê-Leão .csv]` `[ZIP Recibos]` `[Auditar]` |
| **Carlos Mendes** | Motorista Uber/99 | 10/2026 | R$ 8.200,00 | R$ 2.900,00 | 85% (Faltam 2) | 🟡 1 Alerta | `[Notificar]` `[Auditar]` `[Excel]` |
| **Marcos Souza** | Pintor Residencial | 10/2026 | R$ 4.500,00 | R$ 400,00 | 50% (Sem recibos) | 🔴 CPF Ausente | `[Resolver Pendências]` `[Auditar]` |

---

## 🔎 4. Modo Auditoria Assistida ("Ver Como o Cliente")

Ao clicar no botão `Auditar` de qualquer cliente da lista:
- O contador entra no ambiente do cliente em modo **Auditoria Ativa (Read-Only / Comentários)**;
- Uma barra superior destacada avisa:
  > 🛡️ *"Visualizando dados de **João Silva (Pedreiro Autônomo)** — Competência Outubro/2026. Modo de Auditoria Contábil."*
- O contador pode inspecionar cada foto de comprovante no visualizador modal, filtrar lançamentos por categoria e checar o extrato bancário.
- Botão permanente para retornar à lista geral de clientes.

---

## 🔒 5. Segurança & Conformidade com LGPD
- O contador visualiza **exclusivamente** lançamentos do cliente que concedeu o acesso via e-mail.
- O token JWT do Supabase Auth e as regras RLS do PostgreSQL barram qualquer tentativa de acesso manual por ID de cliente não outorgado.
- Todas as ações do contador (visualização, download de arquivo do Carnê-Leão e exportação de ZIP) geram log de auditoria com data, hora e IP na tabela `perfis_auditoria`.

---

## ✅ 6. Critérios de Aceite do Sprint 4
- [ ] Cliente consegue cadastrar o e-mail do contador e o sistema gera o registro com status `pendente`.
- [ ] Contador logado visualiza a lista consolidada apenas dos clientes que autorizaram seu acesso.
- [ ] Contador consegue alternar entre clientes e visualizar o fluxo de caixa mensal em modo auditoria.
- [ ] A revogação do acesso pelo cliente interrompe a visibilidade do contador no mesmo instante.
