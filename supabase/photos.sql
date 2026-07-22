-- Foto de mediciones + storage
-- Ejecutar en SQL Editor después de auth_schema.sql

alter table public.measurements
  add column if not exists photo_url text;

-- Bucket público de fotos (ruta por usuario)
insert into storage.buckets (id, name, public)
values ('measurement-photos', 'measurement-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Photos select own" on storage.objects;
drop policy if exists "Photos insert own" on storage.objects;
drop policy if exists "Photos update own" on storage.objects;
drop policy if exists "Photos delete own" on storage.objects;

create policy "Photos select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Photos insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Photos update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Photos delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'measurement-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lectura pública de URLs (bucket public)
drop policy if exists "Photos public read" on storage.objects;
create policy "Photos public read"
  on storage.objects for select
  to public
  using (bucket_id = 'measurement-photos');

notify pgrst, 'reload schema';
