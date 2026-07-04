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
