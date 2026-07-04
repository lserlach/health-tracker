-- Add login field and public verify function for username-based auth

alter table public.profiles
  add column if not exists login text;

create unique index if not exists profiles_login_unique_idx
  on public.profiles (login)
  where login is not null;

create or replace function public.verify_login(p_login text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where login = lower(trim(p_login))
  );
$$;

revoke all on function public.verify_login(text) from public;
grant execute on function public.verify_login(text) to anon, authenticated;

-- Update new-user handler to store login from auth metadata when present
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_login text;
begin
  user_login := nullif(lower(trim(coalesce(new.raw_user_meta_data->>'login', ''))), '');

  insert into public.profiles (id, email, login)
  values (new.id, coalesce(new.email, ''), user_login);

  insert into public.settings (user_id)
  values (new.id);

  return new;
end;
$$;
