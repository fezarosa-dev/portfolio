-- Tecnologias com nome em PT e EN; categorias do currículo importadas guardam o vínculo por id (não por nome).
alter table public.languages add column name_en text;

alter table public.resume_skill_categories
  add column source_category_id uuid references public.language_categories (id) on delete set null;

-- vínculo das categorias já importadas (uma única vez, pelo nome; daqui pra frente é por id)
update public.resume_skill_categories rc
set source_category_id = lc.id
from public.language_categories lc
where lower(coalesce(rc.name, '')) = lower(lc.name);
