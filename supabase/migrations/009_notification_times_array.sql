-- Multiple strict notification times per daily reminder section

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
