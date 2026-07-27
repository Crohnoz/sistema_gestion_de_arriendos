create extension if not exists pgcrypto;

create table if not exists public.rental_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Edificio 23',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_workspaces enable row level security;

revoke all on table public.rental_workspaces from anon;
grant select, insert, update on table public.rental_workspaces to authenticated;

drop policy if exists "workspace_select_own" on public.rental_workspaces;
create policy "workspace_select_own"
on public.rental_workspaces
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "workspace_insert_own" on public.rental_workspaces;
create policy "workspace_insert_own"
on public.rental_workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "workspace_update_own" on public.rental_workspaces;
create policy "workspace_update_own"
on public.rental_workspaces
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create or replace function public.set_rental_workspace_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rental_workspaces_set_updated_at on public.rental_workspaces;
create trigger rental_workspaces_set_updated_at
before update on public.rental_workspaces
for each row execute function public.set_rental_workspace_updated_at();

comment on table public.rental_workspaces is
  'Espacio privado por propietario. RLS impide que un usuario autenticado lea o modifique datos de otro propietario.';
