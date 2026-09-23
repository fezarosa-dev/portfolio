-- artigos_ativo foi removido (redundante com nav_hidden_links, que já existe e
-- não derruba a página inteira, só esconde do menu). Preserva o estado atual
-- (artigos escondido) migrando pra nav_hidden_links, sem regressão de comportamento.
insert into public.site_content (key, value)
select 'nav_hidden_links', '/artigos'
where exists (select 1 from public.site_content where key = 'artigos_ativo' and value = 'false')
on conflict (key) do update set
  value = case
    when public.site_content.value = '' then excluded.value
    when public.site_content.value like '%/artigos%' then public.site_content.value
    else public.site_content.value || ',' || excluded.value
  end;
