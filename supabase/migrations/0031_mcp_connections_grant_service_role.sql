-- service_role ignora RLS (BYPASSRLS), mas ainda precisa do GRANT de privilégio
-- na tabela em si -- sem isso o PostgREST devolve 42501 "permission denied"
-- mesmo pra um token de service role válido. A migração 0030 só concedeu pra
-- "authenticated" (usado pelo painel admin via cookie); o endpoint MCP usa
-- service_role (sem sessão de cookie) e precisava desse grant também.
grant select, insert, update, delete on public.mcp_connections to service_role;
