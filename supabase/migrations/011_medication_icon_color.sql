alter table public.medications
  add column if not exists icon_color text not null default 'purple'
    check (icon_color in ('purple', 'blue', 'pink'));
