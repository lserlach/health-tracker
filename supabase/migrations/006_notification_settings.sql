-- Notification preferences per section + Web Push subscriptions

alter table public.settings
  add column if not exists notify_glucose boolean not null default false,
  add column if not exists notify_medications boolean not null default false,
  add column if not exists notify_weight boolean not null default false,
  add column if not exists notify_blood_pressure boolean not null default false;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create table if not exists public.notification_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, reminder_key)
);

create index if not exists notification_reminders_sent_user_id_idx
  on public.notification_reminders_sent (user_id);

alter table public.push_subscriptions enable row level security;
alter table public.notification_reminders_sent enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

create policy "notification_reminders_sent_select_own"
  on public.notification_reminders_sent for select
  using (auth.uid() = user_id);

create policy "notification_reminders_sent_insert_own"
  on public.notification_reminders_sent for insert
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_subscriptions to anon, authenticated;
grant select, insert, delete on public.notification_reminders_sent to anon, authenticated;
