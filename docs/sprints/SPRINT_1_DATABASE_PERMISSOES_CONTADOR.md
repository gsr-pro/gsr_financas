# 🦁 SPRINT 1 — Banco de Dados, Schemas Fiscais & RLS Multi-Tenant Contador/Cliente

> **Status:** Planejamento Aprovado  
> **Objetivo:** Estruturar as fundações de dados relacionais no PostgreSQL/Supabase para suportar escrituração fiscal no Carnê-Leão Web, vinculação segura de contadores e preservação de documentos comprobatórios com integridade de 5 anos.

---

## 🏛️ 1. Motivação Arquitetural & Impacto

Atualmente, o GSR Finanças opera com isolamento estrito de dados onde cada usuário acessa apenas seus próprios registros (`auth.uid() = user_id`). Para viabilizar o **Workspace do Contador**, precisamos de um modelo de **outorga de acesso (delegated permissions)** com RLS dinâmico:

1. O cliente (autônomo) convida o contador por e-mail.
2. O contador recebe o vínculo e, após autenticar-se, ganha permissão delegada de leitura e auditoria sobre os lançamentos, anexos e relatórios do cliente.
3. A qualquer momento, o cliente mantém soberania total sobre seus dados, podendo revogar a procuração digital com 1 clique.

---

## 🗄️ 2. Scripts SQL DDL (Supabase / PostgreSQL)

### 2.1. Extensão da Tabela `perfis`
Adição de metadados profissionais, ocupação e perfil contábil:

```sql
-- Adiciona tipo de perfil e dados de qualificação profissional
alter table public.perfis
add column if not exists tipo_perfil text not null default 'cliente'
check (tipo_perfil in ('cliente', 'contador', 'administrador'));

alter table public.perfis
add column if not exists cpf_cnpj text,
add column if not exists crc_numero text, -- Obrigatório para contadores (Registro no Conselho Regional de Contabilidade)
add column if not exists telefone_whatsapp text,
add column if not exists ocupacao_principal text default 'autonomo_construcao'
check (ocupacao_principal in (
    'autonomo_construcao', -- Pedreiros, pintores, gesseiros, eletricistas
    'motorista_app',       -- Uber, 99, entregadores
    'profissional_saude',  -- Médicos, psicólogos, dentistas
    'advocacia',
    'locador_imoveis',
    'outro'
));

comment on column public.perfis.ocupacao_principal is 'Segmentação do autônomo para aplicação de regras de dedutibilidade e códigos de rendimento do Carnê-Leão';
```

---

### 2.2. Extensão Fiscal na Tabela `despesas`
Colunas obrigatórias conforme o **Manual do Carnê-Leão Web da Receita Federal**:

```sql
-- 1. Dados do Pagador / Beneficiário do Serviço
alter table public.despesas
add column if not exists cpf_cnpj_participante text,
add column if not exists nome_participante text;

-- 2. Códigos Tributários do Carnê-Leão Web
alter table public.despesas
add column if not exists codigo_rendimento_carne_leao text default '0101',
add column if not exists is_dedutivel_livro_caixa boolean not null default false,
add column if not exists codigo_deducao_carne_leao text;

-- 3. Flags de Auditoria e Comprovação Documental (Retenção 5 anos)
alter table public.despesas
add column if not exists tem_comprovante boolean not null default false,
add column if not exists nome_original_arquivo text,
add column if not exists inconsistencias_fiscais jsonb default '[]'::jsonb;

-- Índices de performance para conciliação contábil rápida
create index if not exists idx_despesas_cpf_participante on public.despesas(cpf_cnpj_participante);
create index if not exists idx_despesas_dedutivel on public.despesas(is_dedutivel_livro_caixa);
create index if not exists idx_despesas_codigo_rendimento on public.despesas(codigo_rendimento_carne_leao);
```

---

### 2.3. Nova Tabela: `contador_vinculos` (Procurações Digitais)

```sql
create table if not exists public.contador_vinculos (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.perfis(id) on delete cascade,
    contador_email text not null,
    contador_id uuid references public.perfis(id) on delete set null,
    status text not null default 'pendente' check (status in ('pendente', 'ativo', 'revogado', 'recusado')),
    permissao text not null default 'leitura' check (permissao in ('leitura', 'auditoria_completa')),
    observacoes text,
    convidado_em timestamptz not null default timezone('utc'::text, now()),
    respondido_em timestamptz,
    revogado_em timestamptz,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    unique(cliente_id, contador_email)
);

comment on table public.contador_vinculos is 'Vínculos de permissão outorgada de clientes para seus respectivos escritórios de contabilidade';

create index if not exists idx_contador_vinculos_cliente on public.contador_vinculos(cliente_id);
create index if not exists idx_contador_vinculos_contador on public.contador_vinculos(contador_id);
create index if not exists idx_contador_vinculos_email on public.contador_vinculos(contador_email);
create index if not exists idx_contador_vinculos_status on public.contador_vinculos(status);

-- Gatilho de updated_at
create trigger trigger_contador_vinculos_updated_at
    before update on public.contador_vinculos
    for each row execute function public.set_updated_at();
```

---

### 2.4. Políticas de Row Level Security (RLS) Avançadas

```sql
alter table public.contador_vinculos enable row level security;

-- 1. Políticas para `contador_vinculos`:
-- Cliente vê seus próprios convites
create policy "Clientes visualizam seus convites de contador"
    on public.contador_vinculos
    for select
    to authenticated
    using (auth.uid() = cliente_id);

-- Cliente pode criar e revogar convites
create policy "Clientes gerenciam convites de contador"
    on public.contador_vinculos
    for insert
    to authenticated
    with check (auth.uid() = cliente_id);

create policy "Clientes atualizam convites de contador"
    on public.contador_vinculos
    for update
    to authenticated
    using (auth.uid() = cliente_id)
    with check (auth.uid() = cliente_id);

-- Contador pode visualizar convites direcionados ao seu e-mail ou seu ID
create policy "Contadores visualizam convites direcionados a eles"
    on public.contador_vinculos
    for select
    to authenticated
    using (
        auth.uid() = contador_id 
        or lower(auth.jwt()->>'email') = lower(contador_email)
    );

-- Contador pode aceitar ou recusar convite
create policy "Contadores aceitam convites de clientes"
    on public.contador_vinculos
    for update
    to authenticated
    using (
        lower(auth.jwt()->>'email') = lower(contador_email)
        or auth.uid() = contador_id
    );

-- 2. Atualização das Políticas RLS da tabela `despesas` para permitir leitura do Contador Outorgado:
create policy "Contadores autorizados podem auditar despesas dos clientes"
    on public.despesas
    for select
    to authenticated
    using (
        exists (
            select 1 from public.contador_vinculos cv
            where cv.cliente_id = public.despesas.user_id
              and cv.contador_id = auth.uid()
              and cv.status = 'ativo'
        )
    );

-- 3. Atualização das Políticas RLS do Supabase Storage para permitir download dos comprovantes pelo Contador:
create policy "Contadores autorizados podem ler comprovantes dos clientes"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'comprovantes'
        and exists (
            select 1 from public.contador_vinculos cv
            join public.despesas d on d.user_id = cv.cliente_id
            where cv.contador_id = auth.uid()
              and cv.status = 'ativo'
              and d.foto_comprovante_url like '%' || storage.objects.name || '%'
        )
    );
```

---

## 💻 3. Contratos de Tipagem TypeScript (`src/types/fiscal.types.ts`)

Definição estrita das estruturas de dados sem uso de `any`:

```typescript
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
  contador_id: string | null;
  status: StatusVinculoContador;
  permissao: PermissaoContador;
  observacoes?: string | null;
  convidado_em: string;
  respondido_em?: string | null;
  revogado_em?: string | null;
  created_at: string;
  updated_at: string;
  // Campos agregados em joins
  cliente_nome?: string;
  cliente_email?: string;
  cliente_cpf?: string;
}

export interface InconsistenciaFiscal {
  codigo: 'CPF_INVALIDO' | 'CPF_AUSENTE' | 'COMPROVANTE_FALTANTE' | 'DEDUTIBILIDADE_DUVIDOSA';
  severidade: 'erro' | 'alerta';
  mensagem: string;
  campo: string;
}
```

---

## ✅ 4. Critérios de Aceite do Sprint 1
- [ ] Script de migração SQL executável no Supabase sem erros de sintaxe.
- [ ] Regras de RLS testadas: usuário comum não visualiza dados de terceiros; contador outorgado visualiza apenas dados dos clientes com vínculo `ativo`.
- [ ] Revogação do vínculo pelo cliente corta instantaneamente a visualização do contador.
- [ ] Tipos TypeScript compilam sem erros com `npm run build`.
