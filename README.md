# 🏡 Gestão de Custos de Construção da Chácara (500m²)

Aplicativo Mobile-First de alta performance para controle financeiro e orçamentário da construção de uma chácara em terreno de **10x50 metros (500m²)**.

Conectado diretamente ao **Supabase** como backend serverless (PostgreSQL, Auth com RLS e Storage).

---

## 🚀 Tecnologias

- **Frontend:** React 18, TypeScript (Estrito), Vite, Tailwind CSS, Lucide Icons
- **Backend / Database:** Supabase (PostgreSQL 15+, Row Level Security, Triggers, Views Otimizadas)
- **Armazenamento:** Supabase Storage (Bucket `comprovantes` com limite de 5MB)
- **Hospedagem:** Vercel (Configurado via `vercel.json`)

---

## 📱 Funcionalidades

1. **Dashboard Consolidado (Visão Geral):**
   - Custo Fixo de Aquisição do Terreno: **R$ 50.000,00** (Pago em 10/04/2022).
   - Somatório em tempo real de Materiais, Mão de Obra, Documentação, Ferramentas e Outros.
   - **Custo Total Geral** (Terreno + Despesas) calculado via View SQL agregada (`vw_dashboard_totais`).
   - Distribuição percentual visual com gráfico de barras segmentado.
   - Indicador de status de pagamentos: **Total Quitado** vs **A Pagar / Pendente**.

2. **Lançamento Rápido de Gastos (Mobile-First):**
   - Campos: Data, Categoria (Enum), Descrição, Valor monetário (BRL), Status (Pago/Pendente) e Observações.
   - Upload de foto ou PDF do comprovante com prévia imediata.

3. **Histórico de Lançamentos:**
   - Chips rápidos de filtro por categoria.
   - Campo de busca instantânea por descrição.
   - Indicador visual de status de pagamento (Badges).
   - Visualização de comprovantes em modal com suporte a imagens e documentos PDF.
   - Exclusão segura de lançamentos.

4. **Segurança (RLS & Supabase Auth):**
   - Proteção de dados por Row Level Security no PostgreSQL.
   - Apenas usuários cadastrados na tabela `perfis` visualizam e gerenciam as despesas.

---

## 🛠️ Como Executar Localmente

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build
```

---

## 🌐 Publicação na Vercel

1. Suba o projeto para o seu repositório no **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: app de gestao de custos da chacara"
   git branch -M main
   git remote add origin <URL_DO_SEU_REPOSITORIO>
   git push -u origin main
   ```

2. Na **Vercel**:
   - Clique em **"Add New Project"** e selecione o repositório importado do GitHub.
   - O Framework Preset será detectado automaticamente como **Vite**.
   - Em **Environment Variables**, adicione:
     - `VITE_SUPABASE_URL`: `https://qluewnanniwhcjlgvjof.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (consulte `.env.example`)
   - Clique em **Deploy**.
