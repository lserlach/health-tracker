-- Meal logs with 1-hour glucose reminder

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  eaten_at timestamptz not null,
  meal_text text not null,
  remind_at timestamptz not null,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_logs_user_eaten_idx
  on public.meal_logs (user_id, eaten_at desc);

create index if not exists meal_logs_user_remind_idx
  on public.meal_logs (user_id, remind_at);

create trigger meal_logs_set_updated_at
  before update on public.meal_logs
  for each row execute function public.set_updated_at();

alter table public.meal_logs enable row level security;

create policy "meal_logs_select_own"
  on public.meal_logs for select
  using (auth.uid() = user_id);

create policy "meal_logs_insert_own"
  on public.meal_logs for insert
  with check (auth.uid() = user_id);

create policy "meal_logs_update_own"
  on public.meal_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meal_logs_delete_own"
  on public.meal_logs for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.meal_logs to anon, authenticated;
