-- Slug curto e estável para a URL pública do projeto (o uuid fica só como chave interna).
create extension if not exists unaccent with schema extensions;

alter table public.projects add column slug text;

create or replace function public.project_slug_base(t text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select coalesce(nullif(trim(both '-' from regexp_replace(
    lower(unaccent(split_part(split_part(coalesce(t, ''), ' — ', 1), ' - ', 1))),
    '[^a-z0-9]+', '-', 'g')), ''), 'projeto')
$$;

-- Só define o slug quando vem nulo; depois disso ele não muda mais (links compartilhados continuam válidos).
create or replace function public.projects_set_slug()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  base text := public.project_slug_base(coalesce(new.title, new.title_en));
begin
  if new.slug is null then
    new.slug := base;
    if exists (select 1 from public.projects where slug = new.slug and id <> new.id) then
      new.slug := base || '-' || substr(new.id::text, 1, 6);
    end if;
  end if;
  return new;
end
$$;

create trigger projects_set_slug before insert on public.projects
  for each row execute function public.projects_set_slug();

-- backfill: o primeiro de cada slug repetido fica com o nome limpo, os demais ganham sufixo do id
update public.projects p set slug = case when r.rn = 1 then r.base else r.base || '-' || substr(p.id::text, 1, 6) end
from (
  select id, base, row_number() over (partition by base order by created_at) as rn
  from (select id, created_at, public.project_slug_base(coalesce(title, title_en)) as base from public.projects) x
) r
where r.id = p.id;

alter table public.projects alter column slug set not null;
create unique index projects_slug_key on public.projects (slug);
