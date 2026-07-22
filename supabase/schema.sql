-- VitalsTrack measurements table
create extension if not exists "pgcrypto";

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  systolic integer not null check (systolic between 60 and 250),
  diastolic integer not null check (diastolic between 40 and 150),
  pulse integer not null check (pulse between 30 and 220),
  recorded_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists measurements_recorded_at_idx
  on public.measurements (recorded_at desc);

alter table public.measurements enable row level security;

-- Personal app without auth yet: allow public read/write via publishable key.
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

grant select, insert, update, delete on public.measurements to anon, authenticated;
