-- Citas y exámenes sincronizados entre dispositivos (JSON en profiles)
-- Ejecutar en SQL Editor una vez

alter table public.profiles
  add column if not exists schedule_json jsonb;

alter table public.profiles
  add column if not exists exams_json jsonb;

notify pgrst, 'reload schema';
