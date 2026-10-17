-- telefone opcional informado por quem manda mensagem pelo formulário de contato
alter table public.messages add column if not exists phone text;
