-- Schema previsto para o módulo Clientes (controle / pesquisa / medidores).
-- Aplicar quando a integração Supabase estiver ativa (migrations / SQL editor).

create table if not exists public.form_registros (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  distrital text not null check (distrital in ('BCB', 'BDC', 'ITM', 'PDS', 'PDT', 'STI')),
  formulario text not null check (formulario in ('clientes', 'consumidores', 'cadastro')),
  relatorios jsonb not null default '[]'::jsonb,
  historico_exportacoes jsonb not null default '[]'::jsonb,
  descricao_obra text not null default '',
  elemento_pep text not null default '',
  data_conclusao text not null default '',
  municipio text not null default '',
  localidade text not null default '',
  total_consumidores integer not null default 0,
  consumidores jsonb not null default '[]'::jsonb,
  -- consumidores[].medidor_baixado controla status de medidor baixado
  metadata jsonb not null default '{}'::jsonb
);

-- Unicidade lógica: 1 registro ativo por distrital + PEP (quando PEP preenchido).
create unique index if not exists form_registros_distrital_pep_uidx
  on public.form_registros (distrital, upper(trim(elemento_pep)))
  where trim(elemento_pep) <> '';

-- Bucket previsto: form-arquivos/{distrital}/{registro_id}/{arquivo_id}-{nome}
-- relatorios[].id referencia o objeto no Storage; armazenado=true quando o upload concluiu.

create index if not exists form_registros_distrital_updated_at_idx
  on public.form_registros (distrital, updated_at desc);

create index if not exists form_registros_consumidores_gin_idx
  on public.form_registros using gin (consumidores);

alter table public.form_registros enable row level security;

-- Storage (rodar no painel Storage / SQL):
-- insert into storage.buckets (id, name, public) values ('form-arquivos', 'form-arquivos', false);
