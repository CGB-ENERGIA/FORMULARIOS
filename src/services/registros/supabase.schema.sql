-- Schema previsto para a tabela de registros no Supabase.
-- Aplicar quando a integração estiver ativa (migrations / SQL editor).

create table if not exists public.form_registros (
  id text primary key,
  created_at timestamptz not null default now(),
  distrital text not null check (distrital in ('BCB', 'BDC', 'ITM', 'PDS', 'PDT', 'STI')),
  formulario text not null check (formulario in ('clientes', 'consumidores', 'cadastro')),
  relatorios jsonb not null default '[]'::jsonb,
  descricao_obra text not null default '',
  elemento_pep text not null default '',
  data_conclusao text not null default '',
  municipio text not null default '',
  localidade text not null default '',
  total_consumidores integer not null default 0,
  consumidores jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists form_registros_distrital_created_at_idx
  on public.form_registros (distrital, created_at desc);

alter table public.form_registros enable row level security;
