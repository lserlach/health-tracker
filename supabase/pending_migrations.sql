-- Pending migrations for health-tracker (006 partially applied; 008+009 required)
-- Safe to run in Supabase SQL Editor

-- 008_notification_schedule.sql
alter table public.settings
  add column if not exists notify_glucose_time text not null default '08:00',
  add column if not exists notify_glucose_repeat_count smallint not null default 1,
  add column if not exists notify_weight_time text not null default '09:00',
  add column if not exists notify_weight_repeat_count smallint not null default 1,
  add column if not exists notify_blood_pressure_time text not null default '10:00',
  add column if not exists notify_blood_pressure_repeat_count smallint not null default 1,
  add column if not exists notify_medications_repeat_count smallint not null default 1;

do $$ begin
  alter table public.settings
    add constraint settings_notify_glucose_repeat_count_check
      check (notify_glucose_repeat_count between 1 and 5);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.settings
    add constraint settings_notify_weight_repeat_count_check
      check (notify_weight_repeat_count between 1 and 5);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.settings
    add constraint settings_notify_blood_pressure_repeat_count_check
      check (notify_blood_pressure_repeat_count between 1 and 5);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.settings
    add constraint settings_notify_medications_repeat_count_check
      check (notify_medications_repeat_count between 1 and 5);
exception when duplicate_object then null;
end $$;

-- 009_notification_times_array.sql
alter table public.settings
  add column if not exists notify_glucose_times text[] not null default array['08:00'],
  add column if not exists notify_weight_times text[] not null default array['09:00'],
  add column if not exists notify_blood_pressure_times text[] not null default array['10:00'];

update public.settings
set
  notify_glucose_times = array[coalesce(notify_glucose_time, '08:00')],
  notify_weight_times = array[coalesce(notify_weight_time, '09:00')],
  notify_blood_pressure_times = array[coalesce(notify_blood_pressure_time, '10:00')]
where true;
