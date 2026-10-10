# 🏗️ GSR Finanças — Gestão Financeira Inteligente (Obras, Finanças Pessoais & Negócios PME)

> **A plataforma definitiva para quem constrói, reforma, gerencia empresas e consolida seu patrimônio.**  
> *Do canteiro de obras ao fluxo de caixa diário: previsibilidade, controle de notas, precificação inteligente e economia real na palma da sua mão.*

---

## 📑 Sumário

- [Visão Geral & Proposta de Valor](#-visão-geral--proposta-de-valor)
- [Público-Alvo & Personas Comerciais](#-público-alvo--personas-comerciais)
- [Funcionalidades & Módulos do Sistema](#-funcionalidades--módulos-do-sistema)
  - [1. Módulo de Obras & Construção Civil](#1-️-módulo-de-obras--construção-civil)
  - [2. Módulo de Finanças Pessoais & Investimentos](#2--módulo-de-finanças-pessoais--investimentos)
  - [3. Módulo de Negócios & PME (Submódulo Estratégico)](#3--módulo-de-negócios--pme-submódulo-estratégico)
  - [4. Central de Comprovantes & Notas em Nuvem](#4--central-de-comprovantes--notas-em-nuvem)
  - [5. Central de Relatórios Executivos & Auditoria (PDF & Excel)](#5--central-de-relatórios-executivos--auditoria-pdf--excel)
  - [6. Dashboard Executivo & Inteligência em Tempo Real](#6--dashboard-executivo--inteligência-em-tempo-real)
  - [7. Gestão Multi-Ambiente & Multi-Projetos (Workspaces)](#7-️-gestão-multi-ambiente--multi-projetos-workspaces)
  - [8. Experiência Mobile-First, Multi-Temas & Identidade](#8--experiência-mobile-first-multi-temas--identidade)
  - [9. Perfil de Usuário & Segurança da Conta](#9--perfil-de-usuário--segurança-da-conta)
- [Diferenciais Competitivos vs Alternativas](#-diferenciais-competitivos-vs-alternativas)
- [Planos Comerciais & Monetização SaaS](#-planos-comerciais--monetização-saas)
- [Arquitetura & Engenharia de Software](#-arquitetura--engenharia-de-software)
- [Guia de Instalação & Execução Local](#-guia-de-instalação--execução-local)
- [Deploy em Produção (Vercel & Supabase)](#-deploy-em-produção-vercel--supabase)
- [Licença & Direitos](#-licença--direitos)

---

## 💎 Visão Geral & Proposta de Valor

Construir, gerenciar o orçamento familiar ou administrar uma micro/pequena empresa são desafios onde o descontrole de pequenos custos corrói o patrimônio. No setor da construção civil, por exemplo, **mais de 75% das obras estouram o orçamento inicial em 30% a 50%**, e a maioria dos empreendedores falha por não saber precificar produtos nem controlar CMV e estoque.

Os gargalos mais frequentes no mercado são:
- **Notas e recibos extraviados:** Comprovantes térmicos apagados na carteira, notas fiscais perdidas e fotos espalhadas em conversas de WhatsApp;
- **Ausência de métricas unitárias:** Desconhecimento do custo real por metro quadrado construído (R$/m²) e do custo das mercadorias vendidas (CMV);
- **Confusão patrimonial prejudicial:** Mistura contábil entre o orçamento pessoal da família, o caixa da obra e o capital de giro do negócio;
- **Planilhas estáticas e lentas:** Arquivos de Excel difíceis de consultar no celular, suscetíveis a corrupção e sem sincronização com canteiros ou pontos de venda.

O **GSR Finanças** foi construído como um ecossistema **SaaS All-in-One Mobile-First**, unindo três frentes de gestão em uma única aplicação segura:
1. **Obras & Construção:** Controle de terrenos, canteiro de obras, compras de materiais, mão de obra por etapas e cálculo automático do custo por m².
2. **Finanças Pessoais:** Gestão de receitas, despesas domésticas, contas fixas, saldo líquido em tempo real e consolidação de carteira de investimentos (CDB, Tesouro, Ações, FIIs, Cripto).
3. **Negócios & PME:** Ficha técnica de produtos, calculadora de precificação com markup e ponto de equilíbrio, gestão de estoque com alertas de nível crítico e controle de margem líquida da empresa.

---

## 🎯 Público-Alvo & Personas Comerciais

### 👷‍♂️ Persona 1: O Dono da Obra / Proprietário Construtor
- **Perfil:** Comprou um lote, chácara ou imóvel urbano e está conduzindo construção ou reforma.
- **Dor Principal:** Medo do dinheiro acabar antes da fase de acabamento, perda de notas de materiais e pagamentos soltos a empreiteiros.
- **Desejo:** Previsibilidade financeira, saber o custo do m² construído e armazenar fotos de todos os comprovantes para prestação de contas.
- **Proposta de Valor:** *"Construa ou reforme sem surpresas. Controle cada saco de cimento e cada diária com recibos na nuvem."*

### 📐 Persona 2: O Engenheiro / Arquiteto / Empreiteiro
- **Perfil:** Profissional autônomo ou responsável técnico que gerencia de 1 a 5 obras simultâneas.
- **Dor Principal:** Dificuldade em apresentar relatórios de prestação de contas transparentes aos clientes e perda de tempo consolidando planilhas manuais.
- **Desejo:** Workspaces dedicados por cliente/projeto, relatórios executivos em PDF e Excel gerados com 1 clique e auditoria de notas fiscais.
- **Proposta de Valor:** *"Apresente relatórios de prestação de contas e comprovantes digitais auditáveis com total transparência."*

### 🏢 Persona 3: O Investidor Imobiliário (Flipping & Locação)
- **Perfil:** Investe na compra, retrofit/reforma e revenda rápida de imóveis (Flipping) ou aquisição de patrimônio para renda passiva.
- **Dor Principal:** Custos ocultos da reforma que diminuem a margem líquida de lucro na revenda.
- **Desejo:** Visão estrita do Custo Fixo de Aquisição vs Custo Variável de Reforma para garantir o ROI projetado.
- **Proposta de Valor:** *"Maximize o retorno sobre o investimento imobiliário monitorando cada etapa da reforma em tempo real."*

### 🏪 Persona 4: O Microempreendedor / Produtor Artesanal (PME)
- **Perfil:** Dono de comércio, pequeno produtor (gastronomia, marcenaria, confecção) ou prestador de serviços.
- **Dor Principal:** Precificação errônea, venda no prejuízo por não contabilizar custos invisíveis e perda de controle sobre estoque e CMV.
- **Desejo:** Simular preços com base em insumos, mão de obra e markup divisor, além de monitorar o estoque com alertas de reposição.
- **Proposta de Valor:** *"Precifique seus produtos com rigor técnico e gerencie seu estoque para garantir lucro em cada venda."*

### 💼 Persona 5: O Gestor Familiar / Profissional Autônomo
- **Perfil:** Pessoa física que busca controle financeiro pessoal moderno, ágil e independente de planilhas pesadas.
- **Dor Principal:** Aplicativos genéricos engessados, repletos de anúncios, que misturam despesas pessoais com outros projetos.
- **Desejo:** Separar contas fixas, cartões, lazer e aportes de investimento em uma interface moderna, rápida e escura.
- **Proposta de Valor:** *"Suas finanças pessoais organizadas com a mesma disciplina executiva de uma grande empresa."*

---

## 🚀 Funcionalidades & Módulos do Sistema

### 1. 🏗️ Módulo de Obras & Construção Civil
- **Custo Fixo de Aquisição:** Registro do valor de compra do terreno/lote/imóvel, com data, localização e dimensões para compor o investimento total real.
- **Cálculo do Custo por Metro Quadrado (R$/m²):** Acompanhamento contínuo do custo unitário construído conforme a metragem informada.
- **Etapas Construtivas Pré-Configuradas e Customizáveis:**
  - *Aquisição do Terreno / Imóvel*
  - *Documentação, Escrituras, Topografia & Plantas*
  - *Fundação, Terraplanagem & Estrutura*
  - *Alvenaria, Cimento, Ferragens & Aço*
  - *Mão de Obra, Empreiteiro & Diárias*
  - *Instalações Elétricas & Hidráulicas*
  - *Acabamentos, Pisos, Porcelanatos, Tintas & Louças*
  - *Locação de Equipamentos, Caçambas & Andaimes*
  - *Limpeza, Paisagismo, Jardinagem & Segurança*
- **Controle Quitado vs Pendente:** Separação imediata entre pagamentos liquidados e despesas compromissadas em aberto.

### 2. 💼 Módulo de Finanças Pessoais & Investimentos
- **Segregação Patrimonial Total:** Isolamento estrito entre despesas pessoais e projetos de obra ou empresa.
- **Entradas e Saídas:** Suporte a lançamentos de **Receitas** (salário, pró-labore, rendimentos, vendas de ativos) e **Despesas** (moradia, alimentação, saúde, educação).
- **Saldo Líquido em Tempo Real:** Indicador com status automático de *Superávit* ou *Déficit* no período selecionado.
- **Painel de Investimentos & Reserva de Emergência:** Acompanhamento consolidado de ativos em CDB, Poupança, Tesouro Direto, LCI/LCA, Ações, Fundos Imobiliários (FIIs) e Criptoativos.
- **Lançamentos Recorrentes:** Criação programada de despesas e receitas que se repetem mês a mês (contas fixas, aluguel, prestações, assinaturas).

### 3. 🏪 Módulo de Negócios & PME (Submódulo Estratégico)
- **Ficha Técnica & Custos de Produção:**
  - Composição detalhada de insumos, matérias-primas e ingredientes com unidades homologadas (`kg`, `g`, `m`, `cm`, `un`, `l`, `ml`, `hora`).
  - Rateio de mão de obra (horas gastas × valor da hora) e custos fixos proporcionais (energia, embalagem, gás, frete).
  - Cálculo automático do Custo Total de Produção (CMV + Mão de Obra + Fixos).
- **Calculadora Inteligente de Precificação & Markup:**
  - Definição da margem de lucro desejada (%) e geração do Preço de Venda Sugerido.
  - Exibição do Multiplicador de Markup Divisor e Lucro Bruto Unitário.
  - Cálculo de Ponto de Equilíbrio (*Break-Even Point*) em unidades para cobrir os custos fixos mensais.
  - Salvamento de simulações com opção de exportação em PDF e Excel.
- **Controle de Estoque & Mercadorias:**
  - Adaptação dinâmica para **Comércio/Varejo** (revenda), **Prestação de Serviços** (peças/ferramentas) e **Produção/Manufatura** (insumos e matéria-prima).
  - Cards analíticos de Capital Imobilizado, Itens com Estoque Baixo/Crítico, Potencial de Venda e Lucro Estimado.
  - Ajuste rápido de quantidade (`+` / `-`), controle de estoque mínimo e filtros de itens zerados ou críticos.
- **Margem Líquida Operacional da Empresa:**
  - Monitoramento no Dashboard da rentabilidade do negócio com base em receitas brutas menos saídas operacionais.

### 4. 🧾 Central de Comprovantes & Notas em Nuvem
- **Upload Imediato Multi-Formato:** Envio de fotos tiradas diretamente pela câmera do celular ou arquivos digitais em PDF (até 5MB).
- **Armazenamento Seguro:** Arquivos protegidos no Supabase Storage sob políticas de Row Level Security (RLS).
- **Visualizador Modal Interativo:** Modal com zoom de alta resolução, inspeção e download direto para prestação de contas.

### 5. 📑 Central de Relatórios Executivos & Auditoria (PDF & Excel)
- **Exportação para Planilha Excel (.xlsx):**
  - Layout corporativo institucional com cabeçalho "GSR Finanças".
  - Metadados do projeto, período em destaque e status de auditoria.
  - Totais consolidados de lançamentos, valor quitado e pendente.
  - Tabela com auto-filtro nativo do Excel, formatação contábil de moeda (`R$ #,##0.00`) e coluna de comprovantes.
- **Exportação para Relatório PDF Executivo (A4):**
  - Apresentação em alta definição pronta para impressão e envio a clientes, sócios ou bancos.
  - Cabeçalho padronizado, indicadores sintéticos e tabela detalhada paginada com `jspdf-autotable`.
- **Exportação Dedicada de Precificação & Ficha Técnica:**
  - Relatórios sintéticos e analíticos de precificação para registro de catálogo de produtos.

### 6. 📊 Dashboard Executivo & Inteligência em Tempo Real
- **Filtro de Período Dinâmico:** Análise por ano e mês ou consolidação de todo o histórico acumulado.
- **Métricas Contextuais por Ambiente:**
  - *Em Obras:* Investimento Total Geral, Total Quitado, A Pagar / Pendente e Custo de Aquisição.
  - *Em Finanças Pessoais:* Saldo Líquido, Total de Receitas, Total de Despesas e Total em Investimentos.
  - *Em Negócios:* Saldo Líquido Operacional, Total de Receitas, Despesas Operacionais e Margem Líquida (%).
- **Distribuição Visual por Categorias:** Barras de progresso com distribuição percentual ordenada por volume financeiro.
- **Feed de Últimos Lançamentos:** Acesso rápido às transações mais recentes com badges de status e tipo.

### 7. 🗂️ Gestão Multi-Ambiente & Multi-Projetos (Workspaces)
- **Menu Lateral Retrátil (Sidebar Drawer):** Navegação fluida para alternar instantaneamente entre projetos (*Chácara*, *Reforma Apartamento*, *Finanças Pessoais*, *Meu Negócio PME*).
- **Criação Ilimitada de Workspaces:** Gerencie múltiplos empreendimentos e imóveis em uma única assinatura.
- **Categorias Customizadas com Gestão Completa:** Crie, edite e exclua categorias com paleta de cores personalizada e classificação por tipo de movimentação.

### 8. 📱 Experiência Mobile-First, Multi-Temas & Identidade
- **Barra de Navegação Inferior (BottomNav):** 5 posições ergonômicas para uso com o polegar no canteiro de obras:
  1. *Menu Drawer:* Acesso à troca de ambientes e ferramentas PME;
  2. *Dashboard:* Painel de indicadores e métricas;
  3. *(+) Central Flutuante:* Lançamento rápido de despesas/receitas com upload de recibo;
  4. *Extrato:* Histórico com busca e filtros avançados;
  5. *Ajustes:* Configurações de perfil, segurança, temas e planos.
- **Sistema Multi-Temas Dinâmico em Runtime:**
  - *Escuro Profundo (Neon Emerald / Blueprint):* Visual contemporâneo para ambientes internos e economia de bateria.
  - *Cyber Blue:* Estilo corporativo com foco em dados e produtividade.
  - *Claro / Leitura:* Alto contraste para uso sob luz solar direta em canteiros de obras.
- **Identidade da Marca Vetorial:** Logotipo responsivo vetorial com showcase animado via Remotion Engine.

### 9. 🔐 Perfil de Usuário & Segurança da Conta
- **Gestão Cadastral Completa:** Edição direta de nome de exibição e e-mail de acesso.
- **Redefinição de Senha:** Alteração protegida dentro do app e fluxo de recuperação com link enviado por e-mail.

---

## 🏆 Diferenciais Competitivos vs Alternativas

| Funcionalidade / Benefício | GSR Finanças | Planilhas (Excel/Sheets) | Caderno / Anotação Física | Apps Tradicionais (Mobills/Organizze) |
| :--- | :---: | :---: | :---: | :---: |
| **Ambiente Nativo de Obras & R$/m²** | ✅ **Nativo e Instantâneo** | ⚠️ Fórmulas manuais complexas | ❌ Inexistente | ❌ Não oferece |
| **Segregação Obra vs Pessoal vs PME** | ✅ **3 Ambientes em 1 clique** | ❌ Arquivos soltos e confusos | ❌ Mistura anotações | ❌ Focado apenas em contas pessoais |
| **Submódulo PME: Precificação & CMV** | ✅ **Integrado (Markup + Break-Even)** | ⚠️ Exige planilhas avançadas | ❌ Impossível | ❌ Não possui |
| **Controle de Estoque Setorial** | ✅ **Comércio, Serviço e Produção** | ⚠️ Controle manual frágil | ❌ Descontrole de perdas | ❌ Não possui |
| **Upload de Fotos e PDFs na Nuvem** | ✅ **Nativo (Storage Seguro)** | ❌ Links locais ou Drive quebrado | ❌ Papéis amassados e manchados | ⚠️ Limitado a planos caros |
| **Relatórios Executivos PDF e Excel** | ✅ **1 Clique com Formatação** | ⚠️ Requer formatação manual | ❌ Inviável | ⚠️ CSV simples sem formatação |
| **Interface Mobile-First para Campo** | ✅ **100% Otimizada para Celular** | ❌ Difícil preenchimento no touch | ⚠️ Molha, rasga e se perde | ⚠️ Desenhado para uso urbano |
| **Segurança PostgreSQL RLS** | ✅ **Nível Bancário Isolado** | ❌ Compartilhamento inseguro de link | ❌ Zero segurança física | ⚠️ Dependente de terceiros |

---

## 💰 Planos Comerciais & Monetização SaaS

A plataforma conta com integração nativa com o **Stripe Billing**, oferecendo checkout transparente, cupons automáticos, gestão de renovação, cancelamento agendado e liberação via `SubscriptionGate`:

| Plano | Preço Regular | Condição Promocional | Principais Recursos Inclusos |
| :--- | :---: | :---: | :--- |
| **7 Dias Grátis** | **R$ 0,00** | Acesso irrestrito sem compromisso | Teste completo dos 3 ambientes (Obra, Pessoal e Negócio) |
| **Plano Lite (Obras & Pessoal)** | **R$ 14,90 / mês** | **50% OFF nos 2 primeiros meses** (R$ 7,45/mês) ou **R$ 149,00/ano** | **2 Ambientes:** Obras & Construções + Finanças Pessoais. Projetos ilimitados, fotos de recibos, relatórios PDF/Excel e investimentos |
| **Plano Business PME (Completo)** | **R$ 29,90 / mês** | **50% OFF nos 2 primeiros meses** (R$ 14,95/mês) ou **R$ 299,00/ano** | **3 Ambientes:** Tudo do Plano Lite + Módulo de Negócios & PME, Ficha Técnica de Insumos, Calculadora de Precificação, Estoque e Margem Líquida |

---

## 🛠️ Arquitetura & Engenharia de Software

### Stack Tecnológica
- **Linguagem & Tipagem:** TypeScript 5+ com checagem estrita (**zero `any`**).
- **Frontend SPA:** React 18 com hooks modernos (`useCallback`, `useMemo`, `useContext`).
- **Build Tooling & Bundler:** Vite 6 (HMR instantâneo e otimização de chunks).
- **Estilização & Design System:** Tailwind CSS com variáveis CSS nativas para chaveamento de temas em tempo de execução.
- **Biblioteca de Ícones:** Lucide React.
- **Motor de Vídeo e Animação:** Remotion Engine integrado para apresentação vetorial da marca.
- **Geradores de Relatórios:**
  - `xlsx` (SheetJS) para relatórios em planilha Excel com auto-filtro e metadados.
  - `jspdf` e `jspdf-autotable` para relatórios executivos em PDF com paginação e design corporativo.
- **Backend Serverless & Banco de Dados (Supabase):**
  - PostgreSQL 15+ com triggers de auditoria;
  - **Row Level Security (RLS)** ativo em todas as tabelas (`despesas`, `workspaces`, `categorias`, `perfis`, `itens_estoque`);
  - Views SQL agregadas para relatórios e indicadores instantâneos (`vw_dashboard_totais`);
  - Supabase Storage para armazenamento de fotos de notas e PDFs com URLs seguras;
  - Supabase Auth com persistência de sessão e JWT.
- **Pagamentos & Assinaturas:** Stripe Billing via Edge Functions (`create-checkout-session`, `stripe-webhook`).

### Segurança, Privacidade e LGPD
- **Isolamento de Tenants via RLS:** Todas as consultas no banco de dados aplicam a função `auth.uid()`, impedindo qualquer vazamento entre usuários.
- **Zero Secrets no Frontend:** Nenhuma chave de serviço (`service_role`) trafega no cliente; apenas a chave pública anônima sob as regras estritas do RLS.
- **Higienização e Parsing:** Sanitização de entradas monetárias em padrão brasileiro (ex.: `1.250,50`) e validação de payloads.

---

## 💻 Guia de Instalação & Execução Local

### Pré-requisitos
- Node.js 18+ ou 20+ instalado;
- Gerenciador de pacotes `npm`;
- Instância ou projeto ativo no Supabase.

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/gsr_financas.git

# 2. Acesse a pasta do projeto
cd gsr_financas

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

```bash
# 5. Inicie o servidor de desenvolvimento
npm run dev

# 6. Para validar tipagem TypeScript e compilar o build de produção:
npm run build
```

---

## 🌐 Deploy em Produção (Vercel & Supabase)

O projeto contém o arquivo de configuração para roteamento SPA:

1. Conecte seu repositório no dashboard da **Vercel** (`New Project`).
2. Defina o Framework Preset como **Vite**.
3. Em **Environment Variables**, cadastre:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Execute o **Deploy**. A cada novo push na branch `main`, o pipeline de CI/CD da Vercel compila e publica a aplicação automaticamente.

---

## 📄 Licença & Direitos

Projeto proprietário desenvolvido para gestão inteligente de obras, finanças patrimoniais e negócios. Todos os direitos reservados.
