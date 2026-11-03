-- Grupos de clientes dentro de uma empresa (ex.: vários clientes dentro de "Freelancer"), para a contagem de
-- empresas atendidas ser real: um grupo conta como um cliente; projeto sem grupo conta pela empresa dele.
-- O nome do grupo é só interno (painel e MCP): sem leitura pública.
create table public.company_clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  -- alvo da chave composta de projects: garante que o grupo é da mesma empresa do projeto
  unique (id, company_id)
);

alter table public.company_clients enable row level security;

create policy "company_clients_admin_all" on public.company_clients
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select, insert, update, delete on public.company_clients to authenticated, service_role;

alter table public.projects add column client_id uuid;

-- apagar o grupo solta só o client_id (o projeto continua na empresa)
alter table public.projects
  add constraint projects_client_same_company
  foreign key (client_id, company_id) references public.company_clients(id, company_id)
  on delete set null (client_id);

create index projects_client_id_idx on public.projects(client_id);
create index company_clients_company_id_idx on public.company_clients(company_id);
