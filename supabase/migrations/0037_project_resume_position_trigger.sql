-- Projeto que entra no currículo (formulário, painel ou MCP) vai pro fim da ordem, em vez de empatar em 0.
create or replace function public.projects_set_resume_position()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.in_resume and (tg_op = 'INSERT' or old.in_resume is not true) then
    new.resume_position := coalesce(
      (select max(resume_position) + 1 from public.projects where in_resume and id <> new.id), 0
    );
  end if;
  return new;
end
$$;

create trigger projects_set_resume_position
  before insert or update of in_resume on public.projects
  for each row execute function public.projects_set_resume_position();
