create table public.search_requests (
  id uuid primary key default gen_random_uuid(),
  ip text,
  created_at timestamptz not null default now()
);

alter table public.search_requests enable row level security;

create policy "search_requests_public_insert" on public.search_requests
  for insert with check (true);

create policy "search_requests_admin_select" on public.search_requests
  for select using (auth.role() = 'authenticated');

grant insert on public.search_requests to anon, authenticated;
grant select on public.search_requests to authenticated;

create or replace function public.count_recent_searches_by_ip(check_ip text, window_minutes int)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.search_requests
  where ip = check_ip
    and created_at > now() - (window_minutes || ' minutes')::interval
$$;

grant execute on function public.count_recent_searches_by_ip(text, int) to anon, authenticated;
