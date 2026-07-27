revoke all on function public.bind_rental_workspace_membership() from public;
revoke all on function public.bind_rental_workspace_membership() from anon;
revoke all on function public.bind_rental_workspace_membership() from authenticated;
grant execute on function public.bind_rental_workspace_membership() to postgres, supabase_auth_admin;
