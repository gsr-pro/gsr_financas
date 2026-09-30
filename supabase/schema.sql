-- ==============================================================================
-- SISTEMA DE GESTÃO DE CUSTOS DE CONSTRUÇÃO (CHÁCARA 500m²)
-- Banco de Dados: PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";

-- 2. TIPOS CUSTOMIZADOS (ENUMS)
create type public.categoria_despesa as enum (
    'Materiais',
    'Mão de Obra',
    'Documentação',
    'Ferramentas',
    'Outros'
);

create type public.status_pagamento as enum (
    'Pago',
    'Pendente'
);

-- 3. TABELA: PERFIS (Vinculada ao auth.users)
create table if not exists public.perfis (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text not null,
    email text not null unique,
    role text not null default 'proprietario' check (role in ('proprietario', 'administrador', 'visualizador')),
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Comentários descritivos de tabela e colunas
comment on table public.perfis is 'Perfis de usuários autorizados a acessar os dados financeiros da obra';

-- 4. GATILHO (TRIGGER): Criação automática de perfil ao registrar usuário no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.perfis (id, nome, email, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
        new.email,
        'proprietario'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 5. TABELA: DESPESAS
create table if not exists public.despesas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.perfis(id) on delete restrict,
    data_gasto date not null default current_date,
    categoria public.categoria_despesa not null,
    descricao text not null check (length(trim(descricao)) >= 3),
    valor numeric(12, 2) not null check (valor > 0),
    status_pagamento public.status_pagamento not null default 'Pago',
    foto_comprovante_url text,
    observacoes text,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.despesas is 'Registro de despesas e lançamentos de custos da construção da chácara';

-- Índices de performance para relatórios, filtros e ordenação
create index if not exists idx_despesas_user_id on public.despesas(user_id);
create index if not exists idx_despesas_categoria on public.despesas(categoria);
create index if not exists idx_despesas_data_gasto on public.despesas(data_gasto desc);
create index if not exists idx_despesas_status_pagamento on public.despesas(status_pagamento);

-- 6. GATILHO: Atualização automática da coluna updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create trigger trigger_despesas_updated_at
    before update on public.despesas
    for each row execute function public.set_updated_at();

-- 7. VIEW: TOTAIS CONSOLIDADOS DO DASHBOARD
-- Utiliza security_invoker = true (Postgres 15+) para respeitar as regras de RLS do usuário consultor
create or replace view public.vw_dashboard_totais
with (security_invoker = true)
as
with metricas as (
    select
        coalesce(sum(case when categoria = 'Materiais' then valor else 0 end), 0.00) as total_materiais,
        coalesce(sum(case when categoria = 'Mão de Obra' then valor else 0 end), 0.00) as total_mao_de_obra,
        coalesce(sum(case when categoria = 'Documentação' then valor else 0 end), 0.00) as total_documentacao,
        coalesce(sum(case when categoria = 'Ferramentas' then valor else 0 end), 0.00) as total_ferramentas,
        coalesce(sum(case when categoria = 'Outros' then valor else 0 end), 0.00) as total_outros,
        coalesce(sum(case when status_pagamento = 'Pago' then valor else 0 end), 0.00) as total_pago,
        coalesce(sum(case when status_pagamento = 'Pendente' then valor else 0 end), 0.00) as total_pendente,
        coalesce(sum(valor), 0.00) as total_despesas,
        count(*) as total_lancamentos
    from public.despesas
)
select
    50000.00::numeric(12, 2) as valor_aquisicao_terreno,
    '10/04/2022'::text as data_aquisicao_terreno,
    '10x50m (500m²)'::text as dimensoes_terreno,
    m.total_materiais,
    m.total_mao_de_obra,
    m.total_documentacao,
    m.total_ferramentas,
    m.total_outros,
    m.total_pago,
    m.total_pendente,
    m.total_despesas,
    (50000.00 + m.total_despesas)::numeric(12, 2) as custo_total_geral,
    m.total_lancamentos
from metricas m;

-- 8. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
alter table public.perfis enable row level security;
alter table public.despesas enable row level security;

-- Políticas para a tabela `perfis`:
-- Usuário autenticado pode ler os perfis cadastrados da obra
create policy "Usuários autenticados podem visualizar perfis"
    on public.perfis
    for select
    to authenticated
    using (true);

-- Usuário pode atualizar apenas seu próprio perfil
create policy "Usuários podem atualizar seu próprio perfil"
    on public.perfis
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Políticas para a tabela `despesas`:
-- Apenas usuários autenticados que possuam cadastro em `perfis` podem acessar
create policy "Membros autorizados podem visualizar despesas"
    on public.despesas
    for select
    to authenticated
    using (
        exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    );

-- Apenas membros autorizados podem inserir despesas (garantindo que user_id seja o próprio auth.uid())
create policy "Membros autorizados podem criar despesas"
    on public.despesas
    for insert
    to authenticated
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    );

-- Membros autorizados podem editar despesas
create policy "Membros autorizados podem atualizar despesas"
    on public.despesas
    for update
    to authenticated
    using (
        exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    );

-- Membros autorizados podem excluir despesas
create policy "Membros autorizados podem remover despesas"
    on public.despesas
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    );

-- 9. CONFIGURAÇÃO DO STORAGE (BUCKET PARA COMPROVANTES)
-- Criação do Bucket 'comprovantes'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'comprovantes',
    'comprovantes',
    true,
    5242880, -- Limite de 5MB por arquivo
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- RLS para o Storage (tabela storage.objects)
-- Leitura pública para fotos e PDFs de comprovantes
create policy "Comprovantes com visualização pública"
    on storage.objects
    for select
    to public
    using (bucket_id = 'comprovantes');

-- Upload permitido apenas para membros autenticados
create policy "Membros autenticados podem fazer upload de comprovantes"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'comprovantes'
        and exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    );

-- Exclusão de comprovantes permitida aos membros autorizados
create policy "Membros autenticados podem deletar comprovantes"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'comprovantes'
        and exists (
            select 1 from public.perfis p
            where p.id = auth.uid()
        )
    );

-- ===================================================================
-- 10. ASSINATURAS & TRIAL DE 7 DIAS (INTEGRAÇÃO STRIPE)
-- ===================================================================

create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade unique,
    plan_tier text not null default 'obra' check (plan_tier in ('pessoal', 'obra')),
    status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    trial_ends_at timestamptz not null default (now() + interval '7 days'),
    current_period_end timestamptz,
    cancel_at_period_end boolean not null default false,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.subscriptions is 'Assinaturas de usuários, controle de trial de 7 dias e integração Stripe';

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);

-- Gatilho de updated_at para subscriptions
create trigger trigger_subscriptions_updated_at
    before update on public.subscriptions
    for each row execute function public.set_updated_at();

-- Habilitar RLS
alter table public.subscriptions enable row level security;

-- Políticas de RLS para subscriptions
create policy "Usuários podem visualizar sua própria assinatura"
    on public.subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Usuários podem inserir trial inicial próprio"
    on public.subscriptions
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Service role pode gerenciar todas as assinaturas (Edge Functions / Webhooks)
create policy "Service role pode gerenciar todas as assinaturas"
    on public.subscriptions
    for all
    to service_role
    using (true)
    with check (true);

-- Função e Trigger para iniciar Trial de 7 dias automaticamente ao cadastrar usuário
create or replace function public.handle_new_user_trial()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.subscriptions (
        user_id,
        plan_tier,
        status,
        trial_ends_at
    ) values (
        new.id,
        'obra',
        'trialing',
        now() + interval '7 days'
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_trial on auth.users;
create trigger on_auth_user_created_trial
    after insert on auth.users
    for each row execute function public.handle_new_user_trial();

