create extension if not exists vector;

create table public.search_index (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id text not null,
  title text not null,
  excerpt text not null,
  search_text text not null,
  search_vector tsvector generated always as (to_tsvector('portuguese', search_text)) stored,
  embedding vector(384),
  url text not null,
  updated_at timestamptz not null default now(),
  unique (source_table, source_id)
);

create index search_index_vector_idx on public.search_index using gin (search_vector);
create index search_index_embedding_idx on public.search_index using hnsw (embedding vector_cosine_ops);

alter table public.search_index enable row level security;

create policy "search_index_public_read" on public.search_index
  for select using (true);

create policy "search_index_admin_write" on public.search_index
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select on public.search_index to anon, authenticated;
grant insert, update, delete on public.search_index to authenticated;

create or replace function public.search_index_fulltext(query_text text, match_count int)
returns table (
  id uuid,
  source_table text,
  source_id text,
  title text,
  excerpt text,
  url text
)
language sql
stable
as $$
  select id, source_table, source_id, title, excerpt, url
  from public.search_index
  where search_vector @@ websearch_to_tsquery('portuguese', query_text)
  order by ts_rank(search_vector, websearch_to_tsquery('portuguese', query_text)) desc
  limit match_count;
$$;

grant execute on function public.search_index_fulltext(text, int) to anon, authenticated;

create or replace function public.match_search_index(query_embedding vector(384), match_count int)
returns table (
  id uuid,
  source_table text,
  source_id text,
  title text,
  excerpt text,
  url text
)
language sql
stable
as $$
  select id, source_table, source_id, title, excerpt, url
  from public.search_index
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_search_index(vector, int) to anon, authenticated;
