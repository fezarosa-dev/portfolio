-- mesmo problema da 0031, só que em toda tabela que as tools do MCP tocam:
-- service_role nunca tinha SELECT/INSERT/UPDATE/DELETE em nenhuma tabela deste
-- banco (só TRUNCATE/TRIGGER/REFERENCES, que não bastam) -- só ficou visível
-- ao testar list_projetos pela primeira vez via /api/mcp.
grant select, insert, update, delete on public.projects to service_role;
grant select, insert, update, delete on public.companies to service_role;
grant select, insert, update, delete on public.project_languages to service_role;
grant select, insert, update, delete on public.project_authors to service_role;
grant select, insert, update, delete on public.articles to service_role;
grant select, insert, update, delete on public.languages to service_role;
grant select, insert, update, delete on public.authors to service_role;
grant select, insert, update, delete on public.resume to service_role;
grant select, insert, update, delete on public.resume_links to service_role;
grant select, insert, update, delete on public.site_content to service_role;
grant select, insert, update, delete on public.contact_links to service_role;
grant select, insert, update, delete on public.messages to service_role;
grant select, insert, update, delete on public.search_index to service_role;
