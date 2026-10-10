-- ==============================================================================
-- MIGRAÇÃO FISCAL & CONTABILIDADE: CARNÊ-LEÃO WEB, LIVRO CAIXA & WORKSPACE DO CONTADOR
-- GSR Finanças (Plano Business)
-- ==============================================================================

-- 1. Extensão da Tabela `perfis`
alter table public.perfis
add column if not exists tipo_perfil text not null default 'cliente'
check (tipo_perfil in ('cliente', 'contador', 'administrador'));

alter table public.perfis
add column if not exists cpf_cnpj text,
add column if not exists crc_numero text,
add column if not exists telefone_whatsapp text,
add column if not exists ocupacao_principal text default 'autonomo_construcao'
check (ocupacao_principal in (
    'autonomo_construcao',
    'motorista_app',
    'profissional_saude',
    'advocacia',
    'locador_imoveis',
    'outro'
));

comment on column public.perfis.ocupacao_principal is 'Segmentação do autônomo para aplicação de regras de dedutibilidade e códigos de rendimento do Carnê-Leão';

-- 2. Extensão da Tabela `despesas` para Compliance com Carnê-Leão Web
alter table public.despesas
add column if not exists cpf_cnpj_participante text,
add column if not exists nome_participante text,
add column if not exists codigo_rendimento_carne_leao text default '0101',
add column if not exists is_dedutivel_livro_caixa boolean not null default false,
add column if not exists codigo_deducao_carne_leao text,
add column if not exists tem_comprovante boolean not null default false,
add column if not exists nome_original_arquivo text,
add column if not exists inconsistencias_fiscais jsonb default '[]'::jsonb;

create index if not exists idx_despesas_cpf_participante on public.despesas(cpf_cnpj_participante);
create index if not exists idx_despesas_dedutivel on public.despesas(is_dedutivel_livro_caixa);
create index if not exists idx_despesas_codigo_rendimento on public.despesas(codigo_rendimento_carne_leao);

-- 3. Nova Tabela: `contador_vinculos`
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

comment on table public.contador_vinculos is 'Vínculos de permissão outorgada de clientes para seus respectivos contadores no GSR Finanças';

create index if not exists idx_contador_vinculos_cliente on public.contador_vinculos(cliente_id);
create index if not exists idx_contador_vinculos_contador on public.contador_vinculos(contador_id);
create index if not exists idx_contador_vinculos_email on public.contador_vinculos(contador_email);
create index if not exists idx_contador_vinculos_status on public.contador_vinculos(status);

-- Gatilho de updated_at para contador_vinculos
create trigger trigger_contador_vinculos_updated_at
    before update on public.contador_vinculos
    for each row execute function public.set_updated_at();

-- 4. Políticas de Row Level Security (RLS)
alter table public.contador_vinculos enable row level security;

-- Cliente visualiza e gerencia seus próprios convites
create policy "Clientes visualizam seus convites de contador"
    on public.contador_vinculos
    for select
    to authenticated
    using (auth.uid() = cliente_id);

create policy "Clientes criam convites de contador"
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

-- Contador pode visualizar e aceitar convites direcionados a ele
create policy "Contadores visualizam convites direcionados a eles"
    on public.contador_vinculos
    for select
    to authenticated
    using (
        auth.uid() = contador_id 
        or lower(auth.jwt()->>'email') = lower(contador_email)
    );

create policy "Contadores aceitam convites de clientes"
    on public.contador_vinculos
    for update
    to authenticated
    using (
        lower(auth.jwt()->>'email') = lower(contador_email)
        or auth.uid() = contador_id
    );

-- Contadores com vínculo ativo podem auditar as despesas do cliente
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
