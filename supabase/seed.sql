-- Optional seed data (run after schema.sql)
insert into public.measurements (systolic, diastolic, pulse, recorded_at, notes)
values
  (118, 76, 72, now() - interval '2 hours', 'En reposo, después del desayuno'),
  (134, 88, 84, now() - interval '1 day', null),
  (152, 96, 92, now() - interval '1 day 8 hours', 'Tras una reunión estresante'),
  (121, 79, 68, now() - interval '1 day 12 hours', null),
  (124, 80, 74, now() - interval '2 days', null),
  (119, 75, 70, now() - interval '3 days', null),
  (128, 82, 78, now() - interval '4 days', null),
  (116, 74, 66, now() - interval '5 days', null),
  (122, 78, 71, now() - interval '6 days', null);
