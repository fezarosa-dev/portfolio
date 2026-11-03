-- Ficha do servidor de cada projeto na home: o estado do projeto e um número de destaque (o resto da ficha sai
-- dos dados que já existem: empresa e tecnologias por categoria). Opcionais: sem eles o servidor mostra o que tem.
alter table public.projects
  add column status text check (status in ('producao', 'prototipo', 'encerrado')),
  add column highlight text,
  add column highlight_en text;

comment on column public.projects.status is 'producao | prototipo | encerrado (aparece no visor do servidor da home)';
comment on column public.projects.highlight is 'número de destaque real e verificável, ex.: "10 mi de eventos/dia" (PT; EN em highlight_en)';
