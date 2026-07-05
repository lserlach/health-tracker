-- Meal slot for after-meal glucose logs (breakfast, lunch, etc.)

alter table public.glucose_logs
  add column if not exists meal_slot text
    check (
      meal_slot is null
      or meal_slot in ('breakfast', 'second_breakfast', 'lunch', 'afternoon_snack', 'dinner')
    );

update public.glucose_logs
set meal_slot = case
  when meal_text ilike '2-й завтрак%' or meal_text ilike '2й завтрак%' then 'second_breakfast'
  when meal_text ilike 'завтрак%' then 'breakfast'
  when meal_text ilike 'обед%' then 'lunch'
  when meal_text ilike 'полдник%' then 'afternoon_snack'
  when meal_text ilike 'ужин%' then 'dinner'
  else 'lunch'
end
where measurement_type = 'after_meal'
  and meal_slot is null;
