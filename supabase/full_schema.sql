-- =============================================================================
-- Health Tracker — FULL SCHEMA (run once in Supabase SQL Editor)
-- Project: https://aqrnbxxtqdpqpuhtujsh.supabase.co
-- =============================================================================

-- Health Tracker: initial schema
-- Run before 002_rls_policies.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  start_weight numeric(5, 2),
  pregnancy_week smallint check (pregnancy_week is null or pregnancy_week between 1 and 42),
  tracking_start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Settings (1:1 with user)
-- ---------------------------------------------------------------------------
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  glucose_fasting_limit numeric(4, 2) not null default 5.1,
  glucose_after_meal_limit numeric(4, 2) not null default 7.0,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Medications
-- ---------------------------------------------------------------------------
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dosage text not null,
  icon text not null default 'pill',
  intake_relation text not null default 'any'
    check (intake_relation in ('before_food', 'after_food', 'with_food', 'any')),
  times_per_day integer not null default 1 check (times_per_day between 1 and 12),
  schedule_times jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medications_user_id_idx on public.medications (user_id);
create index medications_user_active_idx on public.medications (user_id, is_active);

-- ---------------------------------------------------------------------------
-- Medication logs
-- ---------------------------------------------------------------------------
create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,
  scheduled_for timestamptz not null,
  taken_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'taken', 'skipped')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (medication_id, scheduled_for)
);

create index medication_logs_user_scheduled_idx
  on public.medication_logs (user_id, scheduled_for desc);

create index medication_logs_medication_idx
  on public.medication_logs (medication_id, scheduled_for desc);

-- ---------------------------------------------------------------------------
-- Glucose logs
-- ---------------------------------------------------------------------------
create table public.glucose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  value numeric(4, 2) not null check (value > 0 and value < 50),
  measurement_type text not null
    check (measurement_type in ('fasting', 'after_meal')),
  meal_text text,
  minutes_after_meal integer check (minutes_after_meal is null or minutes_after_meal >= 0),
  note text,
  is_high boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index glucose_logs_user_measured_idx
  on public.glucose_logs (user_id, measured_at desc);

-- ---------------------------------------------------------------------------
-- Weight logs
-- ---------------------------------------------------------------------------
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  weight numeric(5, 2) not null check (weight > 0 and weight < 500),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weight_logs_user_measured_idx
  on public.weight_logs (user_id, measured_at desc);

-- ---------------------------------------------------------------------------
-- Blood pressure logs
-- ---------------------------------------------------------------------------
create table public.blood_pressure_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  systolic integer not null check (systolic between 50 and 300),
  diastolic integer not null check (diastolic between 30 and 200),
  pulse integer check (pulse is null or pulse between 30 and 250),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blood_pressure_logs_user_measured_idx
  on public.blood_pressure_logs (user_id, measured_at desc);

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger medications_set_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

create trigger medication_logs_set_updated_at
  before update on public.medication_logs
  for each row execute function public.set_updated_at();

create trigger glucose_logs_set_updated_at
  before update on public.glucose_logs
  for each row execute function public.set_updated_at();

create trigger weight_logs_set_updated_at
  before update on public.weight_logs
  for each row execute function public.set_updated_at();

create trigger blood_pressure_logs_set_updated_at
  before update on public.blood_pressure_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user: profile + settings
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));

  insert into public.settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Glucose: compute is_high from user settings
-- ---------------------------------------------------------------------------
create or replace function public.compute_glucose_is_high()
returns trigger
language plpgsql
as $$
declare
  fasting_limit numeric(4, 2);
  after_meal_limit numeric(4, 2);
begin
  select s.glucose_fasting_limit, s.glucose_after_meal_limit
  into fasting_limit, after_meal_limit
  from public.settings s
  where s.user_id = new.user_id;

  if fasting_limit is null then
    fasting_limit := 5.1;
  end if;

  if after_meal_limit is null then
    after_meal_limit := 7.0;
  end if;

  if new.measurement_type = 'after_meal' then
    new.is_high := new.value > after_meal_limit;
  else
    new.is_high := new.value > fasting_limit;
  end if;

  return new;
end;
$$;

create trigger glucose_logs_compute_is_high
  before insert or update on public.glucose_logs
  for each row execute function public.compute_glucose_is_high();

-- ---------------------------------------------------------------------------
-- Medication log: medication must belong to same user
-- ---------------------------------------------------------------------------
create or replace function public.validate_medication_log_user()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.medications m
    where m.id = new.medication_id
      and m.user_id = new.user_id
  ) then
    raise exception 'medication_id does not belong to user_id';
  end if;

  return new;
end;
$$;

create trigger medication_logs_validate_user
  before insert or update on public.medication_logs
  for each row execute function public.validate_medication_log_user();
-- Health Tracker: Row Level Security policies
-- Run after 001_initial_schema.sql

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.glucose_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.blood_pressure_logs enable row level security;

-- Profiles -------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Settings -------------------------------------------------------------------
create policy "settings_select_own"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "settings_insert_own"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "settings_update_own"
  on public.settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "settings_delete_own"
  on public.settings for delete
  using (auth.uid() = user_id);

-- Medications ----------------------------------------------------------------
create policy "medications_select_own"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "medications_insert_own"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "medications_update_own"
  on public.medications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "medications_delete_own"
  on public.medications for delete
  using (auth.uid() = user_id);

-- Medication logs ------------------------------------------------------------
create policy "medication_logs_select_own"
  on public.medication_logs for select
  using (auth.uid() = user_id);

create policy "medication_logs_insert_own"
  on public.medication_logs for insert
  with check (auth.uid() = user_id);

create policy "medication_logs_update_own"
  on public.medication_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "medication_logs_delete_own"
  on public.medication_logs for delete
  using (auth.uid() = user_id);

-- Glucose logs ---------------------------------------------------------------
create policy "glucose_logs_select_own"
  on public.glucose_logs for select
  using (auth.uid() = user_id);

create policy "glucose_logs_insert_own"
  on public.glucose_logs for insert
  with check (auth.uid() = user_id);

create policy "glucose_logs_update_own"
  on public.glucose_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "glucose_logs_delete_own"
  on public.glucose_logs for delete
  using (auth.uid() = user_id);

-- Weight logs ----------------------------------------------------------------
create policy "weight_logs_select_own"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "weight_logs_insert_own"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "weight_logs_update_own"
  on public.weight_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weight_logs_delete_own"
  on public.weight_logs for delete
  using (auth.uid() = user_id);

-- Blood pressure logs --------------------------------------------------------
create policy "blood_pressure_logs_select_own"
  on public.blood_pressure_logs for select
  using (auth.uid() = user_id);

create policy "blood_pressure_logs_insert_own"
  on public.blood_pressure_logs for insert
  with check (auth.uid() = user_id);

create policy "blood_pressure_logs_update_own"
  on public.blood_pressure_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "blood_pressure_logs_delete_own"
  on public.blood_pressure_logs for delete
  using (auth.uid() = user_id);
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
