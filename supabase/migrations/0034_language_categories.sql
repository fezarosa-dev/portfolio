-- categorias das tecnologias (Linguagens, Frameworks, Infra...), usadas na página /tecnologias
create table public.language_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.language_categories enable row level security;

create policy "language_categories_public_read" on public.language_categories
  for select using (true);

create policy "language_categories_admin_all" on public.language_categories
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select on public.language_categories to anon, authenticated;
grant insert, update, delete on public.language_categories to authenticated;
grant select, insert, update, delete on public.language_categories to service_role;

alter table public.languages
  add column category_id uuid references public.language_categories(id) on delete set null;
