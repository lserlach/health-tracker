-- Per-section notification time and repeat count

alter table public.settings
  add column if not exists notify_glucose_time text not null default '08:00',
  add column if not exists notify_glucose_repeat_count smallint not null default 1,
  add column if not exists notify_weight_time text not null default '09:00',
  add column if not exists notify_weight_repeat_count smallint not null default 1,
  add column if not exists notify_blood_pressure_time text not null default '10:00',
  add column if not exists notify_blood_pressure_repeat_count smallint not null default 1,
  add column if not exists notify_medications_repeat_count smallint not null default 1;

alter table public.settings
  add constraint settings_notify_glucose_repeat_count_check
    check (notify_glucose_repeat_count between 1 and 5),
  add constraint settings_notify_weight_repeat_count_check
    check (notify_weight_repeat_count between 1 and 5),
  add constraint settings_notify_blood_pressure_repeat_count_check
    check (notify_blood_pressure_repeat_count between 1 and 5),
  add constraint settings_notify_medications_repeat_count_check
    check (notify_medications_repeat_count between 1 and 5);
