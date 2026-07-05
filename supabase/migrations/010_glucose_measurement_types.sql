-- Remove legacy glucose measurement types (bedtime, other).

update public.glucose_logs
set measurement_type = 'fasting'
where measurement_type in ('bedtime', 'other');

alter table public.glucose_logs
  drop constraint if exists glucose_logs_measurement_type_check;

alter table public.glucose_logs
  add constraint glucose_logs_measurement_type_check
  check (measurement_type in ('fasting', 'after_meal'));

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
