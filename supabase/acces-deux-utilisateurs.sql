-- SAM : accès réservé à deux personnes
-- 1. Remplace les deux adresses ci-dessous (ligne « insert into »).
-- 2. Colle tout ce fichier dans Supabase → SQL Editor → New query → Run.
-- Tu peux le relancer autant de fois que tu veux (par exemple pour changer une adresse).

-- Liste des adresses autorisées (lisible uniquement par la base, jamais par le navigateur)
create table if not exists public.allowed_emails (
  email text primary key
);
alter table public.allowed_emails enable row level security;

-- ⬇️ METS ICI LES DEUX ADRESSES (en minuscules) ⬇️
delete from public.allowed_emails;
insert into public.allowed_emails (email) values
  ('premiere.personne@gmail.com'),
  ('deuxieme.personne@gmail.com');

-- Plus jamais plus de deux adresses
create or replace function public.limit_allowed_emails()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.allowed_emails) >= 2 then
    raise exception 'SAM est limitée à deux utilisateurs';
  end if;
  new.email := lower(trim(new.email));
  return new;
end $$;
drop trigger if exists allowed_emails_limit on public.allowed_emails;
create trigger allowed_emails_limit before insert on public.allowed_emails
  for each row execute function public.limit_allowed_emails();

-- L'utilisateur connecté est-il autorisé ?
create or replace function public.is_allowed()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_allowed() from public;
grant execute on function public.is_allowed() to authenticated;

-- Refuse la création de tout compte dont l'adresse n'est pas dans la liste
create or replace function public.block_unknown_signups()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.allowed_emails where email = lower(new.email)) then
    raise exception 'Adresse non autorisée';
  end if;
  return new;
end $$;
drop trigger if exists only_allowed_signups on auth.users;
create trigger only_allowed_signups before insert on auth.users
  for each row execute function public.block_unknown_signups();

-- Les projets ne sont accessibles qu'aux personnes autorisées, chacune au sien
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id and public.is_allowed());

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id and public.is_allowed());

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id and public.is_allowed())
  with check (auth.uid() = user_id and public.is_allowed());

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id and public.is_allowed());

-- Vérification : doit afficher exactement les deux adresses
select email from public.allowed_emails;
