-- Grant API roles access to app tables (required for Supabase PostgREST)

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;

grant all on all sequences in schema public to postgres, service_role;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Trigger functions should not be callable via RPC
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.compute_glucose_is_high() from public, anon, authenticated;
revoke all on function public.validate_medication_log_user() from public, anon, authenticated;
