insert into public.materials (name, default_unit) values
  ('Little millet (Bhagar) - raw', 'kg'),
  ('Bhagar flour', 'kg')
on conflict (name) do nothing;
