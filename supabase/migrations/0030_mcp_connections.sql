create table public.mcp_connections (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.mcp_connections enable row level security;

-- só o admin autenticado (painel) gerencia conexões. O endpoint MCP em si usa a
-- service role (bypassa RLS) pra autenticar pelo token — token_hash nunca fica
-- acessível por anon/authenticated via API pública.
create policy "mcp_connections_admin_all" on public.mcp_connections
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select, insert, update, delete on public.mcp_connections to authenticated;
