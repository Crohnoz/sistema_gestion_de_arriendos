create table if not exists public.rental_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.rental_workspaces(id) on delete cascade,
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('owner', 'manager', 'viewer')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists rental_workspace_members_workspace_email_unique
  on public.rental_workspace_members (workspace_id, lower(email));

create unique index if not exists rental_workspace_members_workspace_user_unique
  on public.rental_workspace_members (workspace_id, user_id)
  where user_id is not null;

create index if not exists rental_workspace_members_user_id_idx
  on public.rental_workspace_members (user_id);

create or replace function public.bind_rental_workspace_membership()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.rental_workspace_members
     set user_id = new.id,
         accepted_at = coalesce(accepted_at, now())
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

drop trigger if exists bind_rental_workspace_membership_after_signup on auth.users;
create trigger bind_rental_workspace_membership_after_signup
after insert or update of email on auth.users
for each row execute function public.bind_rental_workspace_membership();

create or replace function public.rental_email_is_invited(invited_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.rental_workspace_members
     where lower(email) = lower(trim(invited_email))
  );
$$;

revoke all on function public.rental_email_is_invited(text) from public;
grant execute on function public.rental_email_is_invited(text) to anon, authenticated;

alter table public.rental_workspace_members enable row level security;

revoke all on table public.rental_workspace_members from anon;
revoke all on table public.rental_workspace_members from authenticated;
grant select on table public.rental_workspace_members to authenticated;

create policy rental_members_select_own
on public.rental_workspace_members
for select
to authenticated
using (user_id = (select auth.uid()));

comment on table public.rental_workspace_members is
  'Invitaciones y roles de acceso al espacio administrativo compartido.';

-- Los correos invitados se agregan en producción mediante SQL administrativo,
-- nunca dentro del repositorio público.
