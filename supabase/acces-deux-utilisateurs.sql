-- =====================================================================
-- SAM : accès réservé à deux personnes, comptes créés avec mot de passe
-- =====================================================================
-- 1. Colle TOUT le fichier dans Supabase → SQL Editor → New query.
-- 2. Tout en bas, dans le bloc « À REMPLIR », mets les 2 adresses et les 2 mots de passe.
-- 3. Clique sur Run SANS rien sélectionner (sinon seule la sélection est exécutée).
-- Tu peux le relancer quand tu veux : il met à jour les adresses et
--    les mots de passe sans rien casser ni perdre les données des projets.
-- Ne mets JAMAIS ce fichier rempli sur GitHub (il contient les mots de passe).
-- =====================================================================

create table if not exists public.allowed_emails (
  email text primary key
);
alter table public.allowed_emails enable row level security;

-- Fonction : crée le compte s'il n'existe pas, sinon change son mot de passe.
create or replace function public.sam_set_user(p_email text, p_password text)
returns text
language plpgsql security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Mot de passe trop court pour % (6 caractères minimum)', v_email;
  end if;

  select id into v_id from auth.users where lower(email) = v_email limit 1;

  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
    return v_email || ' : compte créé';
  else
    update auth.users
       set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_id;
    return v_email || ' : mot de passe mis à jour';
  end if;
end $$;
revoke all on function public.sam_set_user(text, text) from public, anon, authenticated;

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

-- Refuse la création de tout autre compte
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

-- Chacun ne voit que son propre projet, et seulement s'il est autorisé
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

-- ======================= À REMPLIR (tout en bas) =======================
-- Adresses entières, sans prénom devant. Mots de passe : 6 caractères minimum.
do $$
declare
  email_1    text := 'donaldmzr@gmail.com';
  password_1 text := 'MOT_DE_PASSE_DE_DONALD';
  email_2    text := 'sadikoumouflihath@gmail.com';
  password_2 text := 'MOT_DE_PASSE_DE_MOUFLI';
begin
  if password_1 like 'MOT_DE_PASSE%' or password_2 like 'MOT_DE_PASSE%' then
    raise exception 'Remplace d’abord MOT_DE_PASSE_DE_DONALD et MOT_DE_PASSE_DE_MOUFLI par les vrais mots de passe.';
  end if;

  -- La liste autorisée = exactement ces deux adresses, en minuscules
  delete from public.allowed_emails;
  insert into public.allowed_emails (email) values (lower(trim(email_1))), (lower(trim(email_2)));

  -- Crée les comptes, ou met à jour leur mot de passe s'ils existent déjà
  raise notice '%', public.sam_set_user(email_1, password_1);
  raise notice '%', public.sam_set_user(email_2, password_2);
end $$;

-- Résultat : les deux comptes doivent apparaître avec « oui »
select a.email as adresse_autorisee,
       case when u.id is not null then 'oui' else 'NON' end as compte_cree,
       case when u.email_confirmed_at is not null then 'oui' else 'NON' end as confirme
from public.allowed_emails a
left join auth.users u on lower(u.email) = a.email
order by a.email;
