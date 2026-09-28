alter table public.messages
  add column if not exists subject text,
  add column if not exists category text;
