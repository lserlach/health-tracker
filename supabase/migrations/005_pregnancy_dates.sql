-- Pregnancy dates on profile

alter table public.profiles
  add column if not exists last_menstrual_date date,
  add column if not exists due_date date;
