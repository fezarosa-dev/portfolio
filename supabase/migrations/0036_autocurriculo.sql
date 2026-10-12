-- Autocurrículo: dados estruturados do currículo (a página pública e o PDF são gerados a partir daqui).
-- Leitura pública (o currículo é público de qualquer forma); escrita só autenticado/service_role.

-- Cabeçalho e resumo (singleton na tabela resume, que já existe)
alter table public.resume
  add column full_name text,
  add column headline text,
  add column headline_en text,
  add column location text,
  add column location_en text,
  add column summary text,
  add column summary_en text;

-- Campos de currículo dos projetos (ficam ocultos no site público)
alter table public.projects
  add column in_resume boolean not null default false,
  add column resume_position integer not null default 0,
  add column resume_what text,
  add column resume_what_en text,
  add column resume_with text,
  add column resume_with_en text,
  add column resume_solves text,
  add column resume_solves_en text;

create table public.resume_experiences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  role text,
  role_en text,
  start_year integer not null,
  start_month smallint check (start_month between 1 and 12),
  end_year integer,
  end_month smallint check (end_month between 1 and 12),
  topics text,
  topics_en text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.resume_education (
  id uuid primary key default gen_random_uuid(),
  degree text,
  degree_en text,
  institution text,
  institution_en text,
  year text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.resume_spoken_languages (
  id uuid primary key default gen_random_uuid(),
  language text,
  language_en text,
  level text,
  level_en text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.resume_certifications (
  id uuid primary key default gen_random_uuid(),
  name text,
  name_en text,
  start_year integer,
  start_month smallint check (start_month between 1 and 12),
  end_year integer,
  end_month smallint check (end_month between 1 and 12),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.resume_skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text,
  name_en text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- habilidade = uma tecnologia já cadastrada (language_id) ou um texto livre (label)
create table public.resume_skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.resume_skill_categories (id) on delete cascade,
  language_id uuid references public.languages (id) on delete cascade,
  label text,
  label_en text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  check (language_id is not null or label is not null)
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'resume_experiences', 'resume_education', 'resume_spoken_languages',
    'resume_certifications', 'resume_skill_categories', 'resume_skills'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s_public_read" on public.%I for select using (true)', t, t);
    execute format(
      'create policy "%s_admin_all" on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t, t
    );
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
  end loop;
end
$$;
