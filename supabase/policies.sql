-- Run AFTER this only if the table already exists (created via Table Editor).
-- If you prefer SQL-only setup, use schema.sql instead.

alter table public.measurements enable row level security;

drop policy if exists "Allow public select" on public.measurements;
drop policy if exists "Allow public insert" on public.measurements;
drop policy if exists "Allow public update" on public.measurements;
drop policy if exists "Allow public delete" on public.measurements;

create policy "Allow public select"
  on public.measurements for select
  to anon, authenticated
  using (true);

create policy "Allow public insert"
  on public.measurements for insert
  to anon, authenticated
  with check (true);

create policy "Allow public update"
  on public.measurements for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Allow public delete"
  on public.measurements for delete
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.measurements to anon, authenticated;

notify pgrst, 'reload schema';
