-- Rascunho da fila de mudanças do admin (uma linha por usuário). O preview do site lê esta linha
-- e mostra o conteúdo com a fila aplicada por cima. Só o próprio usuário autenticado enxerga/edita a sua.
create table public.preview_drafts (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  changes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.preview_drafts enable row level security;

create policy "preview_drafts_own" on public.preview_drafts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.preview_drafts to authenticated;
